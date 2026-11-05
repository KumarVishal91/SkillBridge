const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { auth, signToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password || password.length < 6) {
      return res.status(400).json({ message: 'Name, email and a password of 6+ characters are required' });
    }
    if (await User.findOne({ email: email.toLowerCase() })) {
      return res.status(409).json({ message: 'Email already registered' });
    }
    const user = await User.create({ name, email, password: await bcrypt.hash(password, 10) });
    const safe = user.toObject();
    delete safe.password;
    res.status(201).json({ token: signToken(user._id), user: safe });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: (email || '').toLowerCase() }).select('+password');
    if (!user || !(await bcrypt.compare(password || '', user.password))) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }
    const safe = user.toObject();
    delete safe.password;
    res.json({ token: signToken(user._id), user: safe });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/me', auth, async (req, res) => {
  const user = await User.findById(req.userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

module.exports = router;
