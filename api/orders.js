// /api/orders — saves every order (COD and online) to a shared database,
// and emails the store owner a notification for each new order.

const { kv } = require('@vercel/kv');

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'susathi-admin';
const OWNER_EMAIL = 'yogeshsharma072004@gmail.com';

async function sendOrderEmail(order) {
  // If RESEND_API_KEY isn't set up yet, silently skip emailing — the order is
  // still saved and visible in the Admin panel either way.
  if (!process.env.RESEND_API_KEY) return;
  try {
    const itemsHtml = order.items
      .map(i => `${i.qty} x ${i.name} (Size ${i.size}) — ₹${i.price * i.qty}`)
      .join('<br>');
    const html = `
      <h2>New Susathi Order — ${order.id}</h2>
      <p><b>Payment method:</b> ${order.paymentMethod.toUpperCase()}</p>
      <p><b>Customer:</b> ${order.name}<br>
      <b>Phone:</b> ${order.phone}<br>
      <b>Email:</b> ${order.email || '-'}</p>
      <p><b>Address:</b> ${order.address}, ${order.city} - ${order.pincode}</p>
      <p><b>Items:</b><br>${itemsHtml}</p>
      <p><b>Total:</b> ₹${order.total}</p>
    `;
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: 'Bearer ' + process.env.RESEND_API_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Susathi Orders <onboarding@resend.dev>',
        to: OWNER_EMAIL,
        subject: `New Order ${order.id} — ${order.paymentMethod.toUpperCase()} — ₹${order.total}`,
        html,
      }),
    });
  } catch (err) {
    console.error('Order email failed:', err);
  }
}

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const passcode = req.headers['x-admin-passcode'];
    if (passcode !== ADMIN_PASSCODE) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const orders = await kv.get('susathi-orders');
      res.status(200).json(orders || []);
    } catch (err) {
      console.error('Could not read orders:', err);
      res.status(200).json([]);
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const order = req.body;
      if (!order || !order.id || !Array.isArray(order.items)) {
        return res.status(400).json({ error: 'Invalid order data.' });
      }
      const orders = (await kv.get('susathi-orders')) || [];
      orders.unshift(order); // newest first
      await kv.set('susathi-orders', orders);
      await sendOrderEmail(order);
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('Could not save order:', err);
      res.status(500).json({ error: 'Could not save order.' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
