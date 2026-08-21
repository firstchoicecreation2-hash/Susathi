// /api/verify-payment — Vercel serverless function.
// Confirms a payment is genuine before you treat an order as paid.
// Never trust a "success" message from the browser alone.

const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({ verified: false, error: 'Missing payment details.' });
    }

    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    const isValid = expectedSignature === razorpay_signature;

    if (isValid) {
      // This is the moment to mark the order as paid in a real database.
      // This demo has no database — you'd add one (e.g. Vercel Postgres) here.
      res.status(200).json({ verified: true });
    } else {
      res.status(400).json({ verified: false, error: 'Signature mismatch — payment could not be verified.' });
    }
  } catch (err) {
    console.error('Verification failed:', err);
    res.status(500).json({ verified: false, error: 'Server error during verification.' });
  }
};
