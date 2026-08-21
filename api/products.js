// /api/products — shared product catalog, visible to every visitor.
// Uses Vercel KV (a small free database) so that when the admin adds, edits,
// or deletes a product, every customer sees the same catalog instantly.

const { kv } = require('@vercel/kv');

const DEFAULT_PRODUCTS = [
  {id:'p1', name:'Royal Oxford Formal Shirt', category:'Formal', price:1499, stock:24, desc:'Crisp oxford weave in deep navy, cut for a tailored silhouette that holds through a long day.'},
  {id:'p2', name:'Classic White Casual Shirt', category:'Casual', price:999, stock:40, desc:'Breathable cotton in pure white, built as the one shirt that works with anything.'},
  {id:'p3', name:'Midnight Formal Blazer Shirt', category:'Formal', price:1899, stock:15, desc:'Structured shoulders and a matte-black finish for evenings that call for more.'},
  {id:'p4', name:'Ivory Linen Shirt', category:'Casual', price:1199, stock:30, desc:'Lightweight linen with a relaxed drape, made for warm afternoons.'},
  {id:'p5', name:'Everyday Crew T-Shirt', category:'T-Shirt', price:599, stock:60, desc:'Heavyweight cotton crew neck in a fit that holds its shape wash after wash.'},
  {id:'p6', name:'Graphic Print Tee', category:'T-Shirt', price:649, stock:45, desc:'Minimal Susathi crest print on soft-hand combed cotton.'},
  {id:'p7', name:'Weekend Polo Tee', category:'T-Shirt', price:799, stock:35, desc:'Pique cotton polo with a clean, unbothered fit.'},
  {id:'p8', name:'Charcoal Slim Fit Trousers', category:'Pants', price:1299, stock:28, desc:'Slim tailored trouser in stretch charcoal wool-blend, office to dinner.'},
  {id:'p9', name:'Formal Grey Trousers', category:'Pants', price:1399, stock:20, desc:'Classic pleat-front grey formal trouser with a full break.'},
  {id:'p10', name:'Comfort Fit Joggers', category:'Lower', price:899, stock:50, desc:'Tapered jogger in brushed fleece, built for the in-between hours.'},
  {id:'p11', name:'Relaxed Cargo Lower', category:'Lower', price:999, stock:33, desc:'Utility cargo with reinforced pockets and a relaxed leg.'},
  {id:'p12', name:'Alpine Fleece Hoodie', category:'Winter', price:1799, stock:22, desc:'Heavyweight fleece hoodie built to hold heat through the coldest months.'},
  {id:'p13', name:'Royal Zip Hoodie', category:'Winter', price:1999, stock:18, desc:'Full-zip hoodie in brushed cotton with a gold-stitched crest.'},
  {id:'p14', name:'Wool Blend Overcoat', category:'Winter', price:2999, stock:10, desc:'Long wool-blend overcoat, the one coat your winter wardrobe is missing.'},
];

// This must match the passcode used in the Admin panel. You can override it
// by setting an ADMIN_PASSCODE environment variable in Vercel for better security.
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'susathi-admin';

module.exports = async (req, res) => {
  if (req.method === 'GET') {
    try {
      const products = await kv.get('susathi-products');
      res.status(200).json(products && products.length ? products : DEFAULT_PRODUCTS);
    } catch (err) {
      console.error('Could not read products:', err);
      // If the KV database isn't connected yet, fall back to defaults so the site still works.
      res.status(200).json(DEFAULT_PRODUCTS);
    }
    return;
  }

  if (req.method === 'POST') {
    const passcode = req.headers['x-admin-passcode'];
    if (passcode !== ADMIN_PASSCODE) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    try {
      const { products } = req.body;
      if (!Array.isArray(products)) {
        return res.status(400).json({ error: 'Invalid product data.' });
      }
      await kv.set('susathi-products', products);
      res.status(200).json({ success: true });
    } catch (err) {
      console.error('Could not save products:', err);
      res.status(500).json({ error: 'Could not save products. Is the Vercel KV database connected?' });
    }
    return;
  }

  res.status(405).json({ error: 'Method not allowed' });
};
