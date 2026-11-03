const express = require('express');
const mongoose = require('mongoose');
const Message = require('../models/Message');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// Conversation list: latest message per partner
router.get('/', auth, async (req, res) => {
  try {
    const me = new mongoose.Types.ObjectId(req.userId);
    const msgs = await Message.find({ $or: [{ from: me }, { to: me }] })
      .sort({ createdAt: -1 })
      .limit(500)
      .lean();
    const seen = new Map();
    for (const m of msgs) {
      const partner = String(m.from) === req.userId ? String(m.to) : String(m.from);
      if (!seen.has(partner)) seen.set(partner, m);
    }
    const users = await User.find({ _id: { $in: [...seen.keys()] } }, 'name').lean();
    const nameOf = Object.fromEntries(users.map((u) => [String(u._id), u.name]));
    res.json(
      [...seen.entries()].map(([partnerId, last]) => ({
        partnerId,
        partnerName: nameOf[partnerId] || 'Unknown',
        lastMessage: last.text,
        at: last.createdAt,
      }))
    );
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// History with one user
router.get('/:partnerId', auth, async (req, res) => {
  try {
    const { partnerId } = req.params;
    const msgs = await Message.find({
      $or: [
        { from: req.userId, to: partnerId },
        { from: partnerId, to: req.userId },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(200)
      .lean();
    res.json(msgs);
  } catch (e) {
    res.status(400).json({ message: 'Invalid user id' });
  }
});

module.exports = router;
