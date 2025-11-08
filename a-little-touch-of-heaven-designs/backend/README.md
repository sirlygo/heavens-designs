# A Little Touch of Heaven Designs – Backend

This Express server exposes a `/create-checkout-session` endpoint used by the frontend checkout page to create Stripe Checkout sessions.

## Getting started

1. Install dependencies:
   ```bash
   npm install
   ```
2. Copy `.env.example` to `.env` and populate your Stripe keys:
   ```bash
   cp .env.example .env
   ```
3. Start the development server:
   ```bash
   npm start
   ```

By default the server listens on port **4242**. Update the `success_url` and `cancel_url` inside `server.js` to point to your deployed frontend URLs.
