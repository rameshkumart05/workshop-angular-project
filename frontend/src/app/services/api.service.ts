import { Injectable } from '@angular/core';

//const API_URL = 'http://localhost:3001/api';
const API_URL = 'https://tgs-workshop-api.onrender.com/api';

export interface RegistrationPayload {
  fullName: string;
  email: string;
  phone: string;
  annualRevenue: string;
  experience: string;
}

@Injectable({ providedIn: 'root' })
export class ApiService {
  async createRegistration(payload: RegistrationPayload): Promise<{ registrationId: string }> {
    return this.request('/registrations', payload);
  }

  async createOrder(registrationId: string): Promise<{ keyId: string; orderId: string; amount: number; currency: string }> {
    return this.request('/payments/create-order', { registrationId });
  }

  async verifyPayment(payload: {
    registrationId: string;
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }): Promise<{ verified: boolean }> {
    return this.request('/payments/verify', payload);
  }

  private async request<T>(path: string, body: unknown): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
  } catch {
    throw new Error('Cannot connect to the payment server. Please try again.');
  }

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(
      data.message || `Request failed with status ${response.status}.`
    );
  }

  return data as T;
}
}
