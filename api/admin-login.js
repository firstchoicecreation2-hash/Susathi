// /api/admin-login — checks the entered passcode against a server-only
// environment variable. The real passcode never appears in the website's
// code, so "View Page Source" can't reveal it.

const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || 'susathi-admin';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }
  const { passcode } = req.body;
  if (passcode === ADMIN_PASSCODE) {
    res.status(200).json({ success: true });
  } else {
    res.status(401).json({ success: false });
  }
};
