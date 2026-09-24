// /api/coupons — admin creates discount codes (percent or flat amount, with
// optional expiry). Customers validate a code at checkout via GET ?code=.

const { kv } = require('@vercel/kv');

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'susathi-admin';

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const code = req.query.code;

    if (code) {
      // Public: validate a code entered at checkout — no passcode needed.
      try {
        const coupons = (await kv.get('susathi-coupons')) || [];
        const found = coupons.find(c => c.code === String(code).toUpperCase().trim());
        if (!found || !found.active) {
          return res.status(404).json({ valid: false, error: 'Invalid coupon code.' });
        }
        if (found.expiry && new Date(found.expiry) < new Date()) {
          return res.status(400).json({ valid: false, error: 'This coupon has expired.' });
        }
        return res.status(200).json({ valid: true, code: found.code, type: found.type, value: found.value });
      } catch (err) {
        console.error('Coupon validation failed:', err);
        return res.status(500).json({ valid: false, error: 'Could not validate coupon.' });
      }
    }

    // Admin: list all coupons.
    const passcode = req.headers['x-admin-passcode'];
    if (passcode !== ADMIN_PASSCODE) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const coupons = (await kv.get('susathi-coupons')) || [];
      res.status(200).json(coupons);
    } catch (err) {
      console.error('Could not read coupons:', err);
      res.status(200).json([]);
    }
    return;
  }

  if (req.method === 'POST') {
    const passcode = req.headers['x-admin-passcode'];
    if (passcode !== ADMIN_PASSCODE) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const { code, type, value, expiry } = req.body;
      if (!code || !type || value === undefined || value === null) {
        return res.status(400).json({ error: 'Missing required fields.' });
      }
      const coupons = (await kv.get('susathi-coupons')) || [];
      const upperCode = String(code).toUpperCase().trim();
      const newCoupon = { code: upperCode, type, value: Number(value), expiry: expiry || null, active: true };
      const existingIdx = coupons.findIndex(c => c.code === upperCode);
      if (existingIdx >= 0) coupons[existingIdx] = newCoupon;
      else coupons.push(newCoupon);

      await kv.set('susathi-coupons', coupons);
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('Could not save coupon:', err);
      res.status(500).json({ error: 'Could not save coupon.' });
    }
    return;
  }

  if (req.method === 'DELETE') {
    const passcode = req.headers['x-admin-passcode'];
    if (passcode !== ADMIN_PASSCODE) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const { code } = req.body;
      if (!code) {
        return res.status(400).json({ error: 'code is required.' });
      }
      const coupons = (await kv.get('susathi-coupons')) || [];
      const filtered = coupons.filter(c => c.code !== String(code).toUpperCase().trim());
      await kv.set('susathi-coupons', filtered);
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('Could not delete coupon:', err);
      res.status(500).json({ error: 'Could not delete coupon.' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
