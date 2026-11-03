const test = require('node:test');
const assert = require('node:assert');
const {
  scoreMatch,
  findMatches,
  findSkillChains,
  availabilityOverlapHours,
} = require('../services/matchingEngine');

const u = (id, name, teaches, wants, extra = {}) => ({
  _id: id,
  name,
  teaches: teaches.map((n) => ({ name: n, level: 'advanced' })),
  wants: wants.map((n) => ({ name: n, level: 'beginner' })),
  availability: [],
  rating: 0,
  completedSessions: 0,
  ...extra,
});

test('availability overlap sums shared hours on same day only', () => {
  const a = [{ day: 1, start: 18, end: 21 }, { day: 2, start: 9, end: 10 }];
  const b = [{ day: 1, start: 19, end: 22 }, { day: 3, start: 9, end: 12 }];
  assert.strictEqual(availabilityOverlapHours(a, b), 2);
});

test('mutual match is detected in both directions', () => {
  const me = u(1, 'Me', ['react'], ['guitar']);
  const them = u(2, 'Them', ['guitar'], ['react']);
  const m = scoreMatch(me, them);
  assert.ok(m.mutual);
  assert.deepStrictEqual(m.theyTeachYou, ['guitar']);
  assert.deepStrictEqual(m.youTeachThem, ['react']);
});

test('one-way match is not mutual and scores lower than mutual', () => {
  const me = u(1, 'Me', ['react'], ['guitar']);
  const mutual = u(2, 'Mutual', ['guitar'], ['react']);
  const oneWay = u(3, 'OneWay', ['guitar'], ['cooking']);
  const a = scoreMatch(me, mutual);
  const b = scoreMatch(me, oneWay);
  assert.ok(!b.mutual);
  assert.ok(a.score > b.score);
});

test('no overlap returns null', () => {
  const me = u(1, 'Me', ['react'], ['guitar']);
  const other = u(2, 'Other', ['cooking'], ['spanish']);
  assert.strictEqual(scoreMatch(me, other), null);
});

test('skill names are case-insensitive', () => {
  const me = u(1, 'Me', ['React'], ['Guitar']);
  const them = u(2, 'Them', ['guitar'], ['REACT']);
  assert.ok(scoreMatch(me, them).mutual);
});

test('higher rating and availability overlap rank higher among mutual matches', () => {
  const slots = [{ day: 1, start: 18, end: 21 }];
  const me = u(1, 'Me', ['react'], ['guitar'], { availability: slots });
  const good = u(2, 'Good', ['guitar'], ['react'], { rating: 5, availability: slots });
  const meh = u(3, 'Meh', ['guitar'], ['react'], { rating: 2 });
  const ranked = findMatches(me, [meh, good]);
  assert.strictEqual(ranked[0].user.name, 'Good');
});

test('findMatches excludes self and puts mutual first', () => {
  const me = u(1, 'Me', ['react'], ['guitar']);
  const oneWay = u(2, 'OneWay', ['guitar'], [], { rating: 5, completedSessions: 20 });
  const mutual = u(3, 'Mutual', ['guitar'], ['react']);
  const ranked = findMatches(me, [me, oneWay, mutual]);
  assert.strictEqual(ranked.length, 2);
  assert.strictEqual(ranked[0].user.name, 'Mutual');
});

test('3-way skill chain is found when no direct match exists', () => {
  // me teaches A, wants B.  B-user teaches B, wants C.  C-user teaches C, wants A.
  const me = u(1, 'Me', ['a'], ['b']);
  const bu = u(2, 'BUser', ['b'], ['c']);
  const cu = u(3, 'CUser', ['c'], ['a']);
  assert.strictEqual(findMatches(me, [bu, cu]).filter((m) => m.mutual).length, 0);
  const chains = findSkillChains(me, [bu, cu]);
  assert.strictEqual(chains.length, 1);
  assert.deepStrictEqual(
    chains[0].path.map((p) => `${p.teacher}->${p.learner}:${p.skill}`),
    ['BUser->you:b', 'CUser->BUser:c', 'you->CUser:a']
  );
});
