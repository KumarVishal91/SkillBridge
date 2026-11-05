const jwt = require('jsonwebtoken');

const secret = () => process.env.JWT_SECRET || 'dev_secret_change_me';

function signToken(userId) {
  return jwt.sign({ id: userId }, secret(), { expiresIn: '7d' });
}

function verifyToken(token) {
  return jwt.verify(token, secret());
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: 'Not authenticated' });
  try {
    req.userId = verifyToken(token).id;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid or expired token' });
  }
}

module.exports = { auth, signToken, verifyToken };
