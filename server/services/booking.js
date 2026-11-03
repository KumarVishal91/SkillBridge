/**
 * Booking helpers (pure functions, no DB) so conflict detection is unit tested.
 */

const MIN = 60 * 1000;

/** Do two [start, start+duration) intervals overlap? Back-to-back sessions do NOT conflict. */
function overlaps(aStart, aDurationMin, bStart, bDurationMin) {
  const a0 = +new Date(aStart);
  const a1 = a0 + aDurationMin * MIN;
  const b0 = +new Date(bStart);
  const b1 = b0 + bDurationMin * MIN;
  return a0 < b1 && b0 < a1;
}

/** First existing booking that clashes with `slot` ({ start, durationMin }), or null. */
function findConflict(slot, existing = []) {
  return (
    existing.find((b) => overlaps(slot.start, slot.durationMin, b.start, b.durationMin)) || null
  );
}

/** Validate a proposed slot. Returns an error string or null. */
function validateSlot({ start, durationMin }, now = new Date()) {
  const s = new Date(start);
  if (Number.isNaN(+s)) return 'Invalid start time';
  if (+s < +now) return 'Start time must be in the future';
  if (!(durationMin >= 15 && durationMin <= 240)) return 'Duration must be 15-240 minutes';
  return null;
}

const meetingLinkFor = (id) => `https://meet.jit.si/SkillBridge-${id}`;

module.exports = { overlaps, findConflict, validateSlot, meetingLinkFor };
