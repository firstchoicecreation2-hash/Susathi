// /api/create-order — Vercel serverless function.
// Runs on Vercel's servers, never in the customer's browser, so it's safe to
// use your Razorpay Key Secret here (set as an environment variable in Vercel).

const Razorpay = require('razorpay');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { amount, receipt } = req.body;
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'A valid amount is required.' });
    }

    const razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });

    const order = await razorpay.orders.create({
      amount: Math.round(amount * 100), // rupees to paise
      currency: 'INR',
      receipt: receipt || ('susathi_' + Date.now()),
    });

    res.status(200).json(order);
  } catch (err) {
    console.error('Order creation failed:', err);
    res.status(500).json({ error: 'Could not create order.' });
  }
};
