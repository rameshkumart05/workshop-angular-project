# Workshop Registration (Angular + Supabase + Razorpay)

A starter project based on the two supplied reference screenshots:
- Angular landing page with workshop details and countdown
- Angular registration/payment page
- Node/Express API creates Razorpay orders and verifies payment signatures
- Supabase PostgreSQL stores registrations and payment status

## Requirements
- Node.js 20+
- npm
- Supabase project
- Razorpay account (test mode is fine while developing)

## 1. Supabase setup
1. Create a project at https://supabase.com.
2. Open **SQL Editor** and run `supabase/schema.sql`.
3. Copy the Project URL and **service_role** key from Project Settings → API.
   The service-role key is secret. Put it only in the backend `.env`; never in Angular.

## 2. Backend setup
```bash
cd backend
cp .env.example .env
npm install
```
Fill in `.env`:
- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`
- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `FRONTEND_URL` (for local development: `http://localhost:4200`)

Start the API:
```bash
npm run dev
```
API runs at `http://localhost:3001`.

## 3. Angular setup
In a second terminal:
```bash
cd frontend
npm install
npm start
```
Open `http://localhost:4200`.

The Angular app calls the backend at `http://localhost:3001/api` by default.
For deployment, set `src/environments/environment.ts` `apiUrl` to your deployed API URL.

## 4. Razorpay test mode
Use Razorpay test keys in backend `.env`. Complete a test payment using the test payment methods shown by Razorpay Checkout. Do not switch to live keys until your Razorpay account is activated and your business details are approved.

## 5. Important production steps
- Deploy the backend to a Node hosting service and Angular frontend to Cloudflare Pages, Netlify, or Vercel.
- Set all backend environment variables in the hosting dashboard.
- Set `FRONTEND_URL` to the exact deployed frontend origin.
- Configure HTTPS and a Razorpay webhook if you want server-to-server payment event reconciliation.
- Add rate limiting, request logging, spam protection/CAPTCHA, and an admin authentication flow before public launch.
- The backend verifies the Razorpay signature and fetches the Razorpay order before marking a registration as `paid`.
- Do not expose the Supabase service-role key or Razorpay secret in frontend code.

## Customization
Workshop details are in `frontend/src/app/config/workshop.config.ts`.
Update the date, times, title, and Zoom label there before publishing.
update price details are in `frontend/src/app/config/workshop.config.ts`, `\backend\config_amount.js`.
The current countdown target is November 14, 2026 at 8:00 PM in the visitor's local browser timezone.
