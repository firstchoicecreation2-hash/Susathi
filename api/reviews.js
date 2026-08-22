// /api/reviews — lets customers leave a star rating and comment on a product,
// shared across all visitors via the same KV database used for products.

const { kv } = require('@vercel/kv');

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    const productId = req.query.productId;
    if (!productId) {
      return res.status(400).json({ error: 'productId is required.' });
    }
    try {
      const all = (await kv.get('susathi-reviews')) || {};
      res.status(200).json(all[productId] || []);
    } catch (err) {
      console.error('Could not read reviews:', err);
      res.status(200).json([]);
    }
    return;
  }

  if (req.method === 'POST') {
    try {
      const { productId, name, rating, comment } = req.body;
      if (!productId || !name || !rating) {
        return res.status(400).json({ error: 'Missing required fields.' });
      }
      const numericRating = Math.max(1, Math.min(5, Number(rating)));
      const all = (await kv.get('susathi-reviews')) || {};
      if (!all[productId]) all[productId] = [];
      all[productId].unshift({
        name: String(name).slice(0, 60),
        rating: numericRating,
        comment: String(comment || '').slice(0, 500),
        date: new Date().toISOString(),
      });
      await kv.set('susathi-reviews', all);
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('Could not save review:', err);
      res.status(500).json({ error: 'Could not save review.' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
