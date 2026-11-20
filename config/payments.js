import { Router } from "express";
import { getCollection, COLLECTIONS } from "../config/db.js";
import { stripe, PRO_PLANS } from "../config/stripe.js";
import { verifyToken, verifyAdmin } from "../middlewares/auth.js";

const router = Router();

// ---------- Checkout session  ----------
router.post("/create-checkout-session", verifyToken, async (req, res) => {
  const plan = PRO_PLANS[req.user.role];
  if (!plan) {
    return res.status(400).send({ message: "No Pro plan available for your role" });
  }
  if (req.user.plan === "pro") {
    return res.status(400).send({ message: "You are already on the Pro plan" });
  }

  try {
    const clientUrl = process.env.CLIENT_URL.split(",")[0];
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      customer_email: req.user.email,
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: "usd",
            unit_amount: plan.amount,
            product_data: { name: plan.name },
          },
        },
      ],
      metadata: {
        userEmail: req.user.email,
        planName: plan.name,
      },
      success_url: `${clientUrl}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${clientUrl}/payment/cancel`,
    });
    res.send({ url: session.url });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
});

// ---------- Payment verify: payments এ সেভ + user কে pro করা ----------
router.post("/verify", verifyToken, async (req, res) => {
  const { sessionId } = req.body;
  if (!sessionId) {
    return res.status(400).send({ success: false, message: "Session ID is required" });
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.status !== "complete" || session.payment_status !== "paid") {
      return res.status(400).send({ success: false, message: "Payment not completed" });
    }
    // অন্য কারো session দিয়ে নিজের প্ল্যান আপগ্রেড করা আটকানো
    if (session.metadata?.userEmail !== req.user.email) {
      return res.status(403).send({ success: false, message: "Session does not belong to you" });
    }

    const payments = await getCollection(COLLECTIONS.PAYMENTS);
    const existing = await payments.findOne({ stripeSessionId: sessionId });
    if (existing) {
      return res.send({ success: true, alreadyVerified: true, payment: existing });
    }

    const payment = {
      userEmail: req.user.email,
      userName: req.user.name,
      userRole: req.user.role,
      planName: session.metadata.planName,
      amount: session.amount_total / 100,
      currency: session.currency,
      transactionId: session.payment_intent,
      stripeSessionId: sessionId,
      paymentStatus: "paid",
      paidAt: new Date().toISOString(),
    };
    await payments.insertOne(payment);

    const users = await getCollection(COLLECTIONS.USERS);
    await users.updateOne({ email: req.user.email }, { $set: { plan: "pro" } });

    res.send({ success: true, payment });
  } catch (error) {
    res.status(500).send({ success: false, message: error.message });
  }
});

// ---------- Admin: সব transaction ----------
router.get("/", verifyToken, verifyAdmin, async (req, res) => {
  const payments = await getCollection(COLLECTIONS.PAYMENTS);
  const result = await payments.find({}).sort({ paidAt: -1 }).toArray();
  res.send(result);
});

export default router;