const test = require('node:test');
const assert = require('node:assert');
const { overlaps, findConflict, validateSlot, meetingLinkFor } = require('../services/booking');

const at = (h, m = 0) => new Date(Date.UTC(2030, 0, 1, h, m));

test('overlapping sessions conflict', () => {
  assert.ok(overlaps(at(10), 60, at(10, 30), 60));
  assert.ok(overlaps(at(10), 120, at(11), 30)); // contained
});

test('back-to-back sessions do not conflict', () => {
  assert.ok(!overlaps(at(10), 60, at(11), 60));
  assert.ok(!overlaps(at(11), 60, at(10), 60));
});

test('findConflict returns the clashing booking or null', () => {
  const existing = [{ start: at(9), durationMin: 60 }, { start: at(14), durationMin: 60 }];
  assert.strictEqual(findConflict({ start: at(12), durationMin: 60 }, existing), null);
  assert.strictEqual(findConflict({ start: at(13, 30), durationMin: 60 }, existing), existing[1]);
});

test('validateSlot rejects past dates, bad durations, accepts valid', () => {
  const now = at(8);
  assert.match(validateSlot({ start: at(7), durationMin: 60 }, now), /future/);
  assert.match(validateSlot({ start: at(9), durationMin: 5 }, now), /Duration/);
  assert.match(validateSlot({ start: 'nope', durationMin: 60 }, now), /Invalid/);
  assert.strictEqual(validateSlot({ start: at(9), durationMin: 60 }, now), null);
});

test('meeting link embeds the booking id', () => {
  assert.strictEqual(meetingLinkFor('abc123'), 'https://meet.jit.si/SkillBridge-abc123');
});
