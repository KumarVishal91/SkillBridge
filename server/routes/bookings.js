const express = require('express');
const Booking = require('../models/Booking');
const User = require('../models/User');
const { auth } = require('../middleware/auth');
const { findConflict, validateSlot, meetingLinkFor } = require('../services/booking');

const router = express.Router();

/** Accepted sessions of either user (plus the proposer's own pending requests) that could clash. */
async function clashCandidates(userIds, proposerId, excludeId) {
  const q = {
    $or: [
      { status: 'accepted', $or: [{ proposer: { $in: userIds } }, { partner: { $in: userIds } }] },
      { status: 'pending', proposer: proposerId },
    ],
  };
  if (excludeId) q._id = { $ne: excludeId };
  return Booking.find(q).lean();
}

// My bookings (both directions)
router.get('/', auth, async (req, res) => {
  try {
    const list = await Booking.find({ $or: [{ proposer: req.userId }, { partner: req.userId }] })
      .sort({ start: 1 })
      .populate('proposer partner', 'name')
      .lean();
    res.json(list);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// Propose a session
router.post('/', auth, async (req, res) => {
  try {
    const { partnerId, skill, start, note } = req.body;
    const durationMin = Number(req.body.durationMin) || 60;
    if (!partnerId || !skill) return res.status(400).json({ message: 'Partner and skill are required' });
    if (String(partnerId) === String(req.userId)) return res.status(400).json({ message: "You can't book yourself" });
    if (!(await User.exists({ _id: partnerId }))) return res.status(404).json({ message: 'User not found' });

    const err = validateSlot({ start, durationMin });
    if (err) return res.status(400).json({ message: err });

    const existing = await clashCandidates([req.userId, partnerId], req.userId);
    if (findConflict({ start, durationMin }, existing)) {
      return res.status(409).json({ message: 'Time conflict: one of you already has a session at that time' });
    }

    const booking = await Booking.create({
      proposer: req.userId,
      partner: partnerId,
      skill,
      start,
      durationMin,
      note: note || '',
    });
    res.status(201).json(booking);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// accept | decline | cancel | complete
router.patch('/:id', auth, async (req, res) => {
  try {
    const { action } = req.body;
    const b = await Booking.findById(req.params.id);
    if (!b) return res.status(404).json({ message: 'Booking not found' });

    const isPartner = String(b.partner) === req.userId;
    const isProposer = String(b.proposer) === req.userId;
    if (!isPartner && !isProposer) return res.status(403).json({ message: 'Not your booking' });

    if (action === 'accept' || action === 'decline') {
      if (!isPartner) return res.status(403).json({ message: 'Only the invited user can respond' });
      if (b.status !== 'pending') return res.status(400).json({ message: `Booking is already ${b.status}` });
      if (action === 'decline') {
        b.status = 'declined';
      } else {
        // re-check: either user may have accepted something else since the request was made
        const existing = await clashCandidates([b.proposer, b.partner], b.proposer, b._id);
        const accepted = existing.filter((x) => x.status === 'accepted');
        if (findConflict(b, accepted)) {
          return res.status(409).json({ message: 'Time conflict with another accepted session' });
        }
        b.status = 'accepted';
        b.meetingLink = meetingLinkFor(b._id);
      }
    } else if (action === 'cancel') {
      if (!['pending', 'accepted'].includes(b.status)) return res.status(400).json({ message: `Booking is already ${b.status}` });
      b.status = 'cancelled';
    } else if (action === 'complete') {
      if (b.status !== 'accepted') return res.status(400).json({ message: 'Only accepted sessions can be completed' });
      b.status = 'completed';
      await User.updateMany({ _id: { $in: [b.proposer, b.partner] } }, { $inc: { completedSessions: 1 } });
    } else {
      return res.status(400).json({ message: 'Unknown action' });
    }

    await b.save();
    res.json(b);
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

module.exports = router;
