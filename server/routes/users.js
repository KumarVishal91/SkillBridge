const express = require('express');
const User = require('../models/User');
const Review = require('../models/Review');
const { auth } = require('../middleware/auth');
const { findMatches, findSkillChains, norm } = require('../services/matchingEngine');

const router = express.Router();

const cleanSkills = (arr = []) =>
  arr
    .filter((s) => s && s.name && String(s.name).trim())
    .map((s) => ({ name: norm(s.name), level: s.level || 'intermediate' }));

const cleanSlots = (arr = []) =>
  arr.filter((s) => s.end > s.start && s.day >= 0 && s.day <= 6);

// Update my profile
router.put('/me', auth, async (req, res) => {
  try {
    const { name, bio, teaches, wants, availability } = req.body;
    const update = {};
    if (name !== undefined) update.name = name;
    if (bio !== undefined) update.bio = bio;
    if (teaches) update.teaches = cleanSkills(teaches);
    if (wants) update.wants = cleanSkills(wants);
    if (availability) update.availability = cleanSlots(availability);
    const user = await User.findByIdAndUpdate(req.userId, update, { new: true });
    res.json(user);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Ranked matches for me (+ skill chains if no mutual match)
router.get('/matches', auth, async (req, res) => {
  try {
    const me = await User.findById(req.userId).lean();
    const candidates = await User.find({ _id: { $ne: me._id } }).lean();
    const matches = findMatches(me, candidates);
    const hasMutual = matches.some((m) => m.mutual);
    const chains = hasMutual ? [] : findSkillChains(me, candidates);
    res.json({
      matches: matches.map((m) => ({
        ...m,
        user: {
          _id: m.user._id,
          name: m.user.name,
          bio: m.user.bio,
          rating: m.user.rating,
          completedSessions: m.user.completedSessions,
          teaches: m.user.teaches,
          wants: m.user.wants,
        },
      })),
      chains,
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Search who teaches a skill, ranked by reputation
router.get('/search', auth, async (req, res) => {
  try {
    const q = norm(req.query.q);
    if (!q) return res.json([]);
    const escaped = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const users = await User.find({
      _id: { $ne: req.userId },
      'teaches.name': { $regex: escaped, $options: 'i' },
    }).lean();
    users.sort(
      (a, b) =>
        (b.rating || 0) * 2 + (b.completedSessions || 0) * 0.5 -
        ((a.rating || 0) * 2 + (a.completedSessions || 0) * 0.5)
    );
    res.json(
      users.slice(0, 30).map((u) => ({
        _id: u._id,
        name: u.name,
        bio: u.bio,
        rating: u.rating,
        completedSessions: u.completedSessions,
        teaches: u.teaches,
        wants: u.wants,
      }))
    );
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Public profile
router.get('/:id', auth, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).lean();
    if (!user) return res.status(404).json({ message: 'User not found' });
    const reviews = await Review.find({ reviewee: user._id })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate('reviewer', 'name')
      .lean();
    res.json({ ...user, reviews });
  } catch (e) {
    res.status(400).json({ message: 'Invalid user id' });
  }
});

// Rate a user after a session (1 review per reviewer/reviewee pair, updatable)
router.post('/:id/rate', auth, async (req, res) => {
  try {
    const stars = Number(req.body.stars);
    if (!(stars >= 1 && stars <= 5)) return res.status(400).json({ message: 'stars must be 1-5' });
    if (req.params.id === req.userId) return res.status(400).json({ message: "You can't rate yourself" });

    await Review.findOneAndUpdate(
      { reviewer: req.userId, reviewee: req.params.id },
      { stars, comment: req.body.comment || '' },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    const all = await Review.find({ reviewee: req.params.id });
    const avg = all.reduce((s, r) => s + r.stars, 0) / all.length;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { rating: Math.round(avg * 10) / 10, ratingCount: all.length, $inc: { completedSessions: 0 } },
      { new: true }
    );
    res.json({ rating: user.rating, ratingCount: user.ratingCount });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Mark a session completed with someone (bumps both users' counters)
router.post('/:id/complete-session', auth, async (req, res) => {
  try {
    if (req.params.id === req.userId) return res.status(400).json({ message: 'Invalid user' });
    await User.updateMany({ _id: { $in: [req.userId, req.params.id] } }, { $inc: { completedSessions: 1 } });
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
