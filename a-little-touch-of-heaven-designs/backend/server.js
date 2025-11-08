import express from "express";
import Stripe from "stripe";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

app.use(cors());
app.use(express.json());

app.post("/create-checkout-session", async (req, res) => {
  const items = req.body.cart || [];
  const line_items = items.map(item => ({
    price_data: {
      currency: "usd",
      product_data: { name: item.name },
      unit_amount: item.price * 100,
    },
    quantity: 1,
  }));

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items,
    mode: "payment",
    success_url: "https://your-frontend-site.netlify.app/success.html",
    cancel_url: "https://your-frontend-site.netlify.app/cart.html",
  });

  res.json({ id: session.id });
});

app.listen(4242, () => console.log("Server running on port 4242"));
