import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import Razorpay from 'razorpay';
import crypto from 'node:crypto';
import { WORKSHOP_AMOUNT, WORKSHOP_CONFIG } from './Config_amount.js';
import { createClient } from '@supabase/supabase-js';

const required = ['SUPABASE_URL', 'SUPABASE_SERVICE_ROLE_KEY', 'RAZORPAY_KEY_ID', 'RAZORPAY_KEY_SECRET'];
for (const key of required) {
  if (!process.env[key]) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
}

const app = express();
const port = Number(process.env.PORT || 3001);
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:4200';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});

app.use(helmet());
app.use(cors({ origin: frontendUrl }));
app.use(express.json({ limit: '20kb' }));
app.use('/api', rateLimit({ windowMs: 60_000, limit: 40, standardHeaders: 'draft-7', legacyHeaders: false }));

const clean = (value, max = 160) => String(value ?? '').trim().slice(0, max);
//const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.post('/api/registrations', async (req, res) => {
  try {
    const full_name = clean(req.body.fullName);
    const email = clean(req.body.email, 254).toLowerCase();
    const phone = clean(req.body.phone, 24);
    const annualRevenue = clean(req.body.annualRevenue, 40);
    const experience = clean(req.body.experience, 40);

    if (!full_name || full_name.length < 2 || !emailPattern.test(email) ||
        !/^[+\d\s()-]{8,24}$/.test(phone) || !annualRevenue || !experience) {
      return res.status(400).json({ message: 'Please provide valid details in all required fields.' });
    }

    const { data, error } = await supabase
      .from('workshop_registrations')
      .insert({ full_name, email, phone, annualRevenue, experience, amount: WORKSHOP_AMOUNT, currency: WORKSHOP_CONFIG.currency, payment_status: 'pending' })
      .select('id')
      .single();

    if (error) throw error;
    return res.status(201).json({ registrationId: data.id });
  } catch (error) {
    console.error('Registration create error:', error.message);
    return res.status(500).json({ message: 'Could not save registration. Please try again.' });
  }
});

app.post('/api/payments/create-order', async (req, res) => {
  try {
    const registrationId = clean(req.body.registrationId, 64);
    if (!/^[0-9a-f-]{36}$/i.test(registrationId)) {
      return res.status(400).json({ message: 'Invalid registration.' });
    }

    const { data: registration, error: readError } = await supabase
      .from('workshop_registrations')
      .select('id, payment_status, razorpay_order_id')
      .eq('id', registrationId)
      .single();

    if (readError || !registration) return res.status(404).json({ message: 'Registration not found.' });
    if (registration.payment_status === 'paid') return res.status(409).json({ message: 'This registration is already paid.' });

    if (registration.razorpay_order_id) {
      const existing = await razorpay.orders.fetch(registration.razorpay_order_id);
      return res.json({ keyId: process.env.RAZORPAY_KEY_ID, orderId: existing.id, amount: existing.amount, currency: existing.currency });
    }

    const order = await razorpay.orders.create({
      amount: WORKSHOP_AMOUNT,
      currency: WORKSHOP_CONFIG.currency,
      receipt: `ws_${registrationId.replaceAll('-', '').slice(0, 20)}`,
      notes: { registrationId }
    });

    const { error: updateError } = await supabase
      .from('workshop_registrations')
      .update({ razorpay_order_id: order.id, updated_at: new Date().toISOString() })
      .eq('id', registrationId);

    if (updateError) throw updateError;
    return res.json({ keyId: process.env.RAZORPAY_KEY_ID, orderId: order.id, amount: order.amount, currency: order.currency });
  } catch (error) {
    console.error('Order create error:', error.message);
    return res.status(500).json({ message: 'Could not start payment. Please try again.' });
  }
});

app.post('/api/payments/verify', async (req, res) => {
  try {
    const registrationId = clean(req.body.registrationId, 64);
    const orderId = clean(req.body.razorpay_order_id, 100);
    const paymentId = clean(req.body.razorpay_payment_id, 100);
    const signature = clean(req.body.razorpay_signature, 200);

    if (!registrationId || !orderId || !paymentId || !signature) {
      return res.status(400).json({ message: 'Missing payment verification details.' });
    }

    const { data: registration, error } = await supabase
      .from('workshop_registrations')
      .select('id, amount, currency, razorpay_order_id, payment_status')
      .eq('id', registrationId)
      .single();

    if (error || !registration) return res.status(404).json({ message: 'Registration not found.' });
    if (registration.payment_status === 'paid' && registration.razorpay_order_id === orderId) {
      return res.json({ verified: true });
    }
    if (registration.razorpay_order_id !== orderId) {
      return res.status(400).json({ message: 'Order does not match this registration.' });
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${paymentId}`)
      .digest('hex');

    const a = Buffer.from(expected);
    const b = Buffer.from(signature);
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return res.status(400).json({ message: 'Payment signature could not be verified.' });
    }

    const payment = await razorpay.payments.fetch(paymentId);
    if (payment.order_id !== orderId || payment.amount !== registration.amount ||
        payment.currency !== registration.currency || payment.status !== 'captured') {
      return res.status(400).json({ message: 'Payment is not captured for the expected amount.' });
    }

    const { error: updateError } = await supabase
      .from('workshop_registrations')
      .update({
        payment_status: 'paid',
        razorpay_payment_id: paymentId,
        updated_at: new Date().toISOString()
      })
      .eq('id', registrationId);

    if (updateError) throw updateError;
    return res.json({ verified: true });
  } catch (error) {
    console.error('Payment verify error:', error.message);
    return res.status(500).json({ message: 'Could not verify payment. Contact support before paying again.' });
  }
});

// Start the server
//app.listen(port, () => console.log(`Workshop API listening on http://localhost:${port}`));
app.listen(port, '0.0.0.0', () => {console.log(`Workshop API listening on port ${port}`);
});