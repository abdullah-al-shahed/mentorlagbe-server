import Stripe from "stripe";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// রোল অনুযায়ী Pro Plan (amount সেন্টে)
export const PRO_PLANS = {
  tutor: { name: "Pro Tutor Plan", amount: 1500 },
  student: { name: "Pro Student Plan", amount: 1000 },
};