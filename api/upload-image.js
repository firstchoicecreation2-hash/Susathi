// /api/upload-image — receives one image (already resized in the browser)
// and stores it in Vercel Blob, a small file-storage service. Returns a public
// URL that gets saved on the product record.

const { put } = require('@vercel/blob');

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'susathi-admin';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const passcode = req.headers['x-admin-passcode'];
  if (passcode !== ADMIN_PASSCODE) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const { imageData, filename } = req.body;
    if (!imageData) {
      return res.status(400).json({ error: 'No image data provided.' });
    }
    const matches = imageData.match(/^data:(.+);base64,(.+)$/);
    if (!matches) {
      return res.status(400).json({ error: 'Invalid image data.' });
    }
    const contentType = matches[1];
    const buffer = Buffer.from(matches[2], 'base64');

    const safeName = (filename || 'product-image').replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const blob = await put(`susathi/${Date.now()}-${safeName}`, buffer, {
      access: 'public',
      contentType,
    });

    res.status(200).json({ url: blob.url });
  } catch (err) {
    console.error('Image upload failed:', err);
    res.status(500).json({ error: 'Could not upload image. Is Vercel Blob storage connected?' });
  }
};
