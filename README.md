# A Little Touch of Heaven Designs

This repository contains a simple e-commerce experience for a custom vinyl printing shop. The project is split into a static frontend and a minimal Express/Stripe backend.

```
a-little-touch-of-heaven-designs/
├── frontend/
│   ├── index.html
│   ├── shop.html
│   ├── cart.html
│   ├── contact.html
│   ├── success.html
│   ├── styles.css
│   └── script.js
└── backend/
    ├── server.js
    ├── package.json
    ├── .env.example
    └── README.md
```

* The **frontend** directory holds the static site that can be deployed to any static host (e.g., Netlify). It manages a localStorage-based cart, connects to PayPal via the client SDK, and forwards card payments to the backend for Stripe Checkout.
* The **backend** directory contains a small Node/Express server that exposes the `/create-checkout-session` endpoint used to initiate Stripe payments.

See the individual READMEs for setup instructions.
