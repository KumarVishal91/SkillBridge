/**
 * SkillBridge matching engine.
 *
 * Pure functions (no DB access) so the algorithm is easy to unit test.
 * Users are modeled as a directed graph:  teaches[] / wants[] edges.
 *
 *   me  --(I want X)-->  them --(they teach X)
 *   them --(they want Y)--> me --(I teach Y)
 *
 * A "mutual" match exists when BOTH directions have at least one overlapping skill.
 */

const WEIGHTS = {
  mutualBonus: 40, // both directions match
  perSkillOverlap: 10, // each matched skill (capped)
  maxSkillOverlapPoints: 30,
  rating: 4, // x rating (0-5)   -> max 20
  sessions: 1, // x completed sessions, capped
  maxSessionPoints: 10,
  availability: 3, // x overlapping hours/week, capped
  maxAvailabilityPoints: 15,
  levelFit: 5, // teacher level >= what learner needs
};

const LEVEL_RANK = { beginner: 1, intermediate: 2, advanced: 3 };

const norm = (s) => String(s || '').trim().toLowerCase();

const names = (skills = []) => skills.map((s) => norm(s.name));

/** Skills that `learner` wants and `teacher` teaches. */
function skillsTaughtTo(teacher, learner) {
  const teachSet = new Map((teacher.teaches || []).map((s) => [norm(s.name), s]));
  return (learner.wants || [])
    .map((w) => ({ want: w, teach: teachSet.get(norm(w.name)) }))
    .filter((x) => x.teach)
    .map((x) => ({
      skill: norm(x.want.name),
      teacherLevel: x.teach.level,
      learnerLevel: x.want.level,
    }));
}

/** Total overlapping hours per week between two availability lists. */
function availabilityOverlapHours(a = [], b = []) {
  let hours = 0;
  for (const x of a) {
    for (const y of b) {
      if (x.day !== y.day) continue;
      const overlap = Math.min(x.end, y.end) - Math.max(x.start, y.start);
      if (overlap > 0) hours += overlap;
    }
  }
  return hours;
}

function levelFitPoints(pairs) {
  // reward when teacher's level is at least the learner's current level
  const fits = pairs.filter(
    (p) => (LEVEL_RANK[p.teacherLevel] || 2) >= (LEVEL_RANK[p.learnerLevel] || 2)
  ).length;
  return fits * WEIGHTS.levelFit;
}

/**
 * Score a candidate against `me`.
 * Returns null if there is no relevant overlap at all.
 */
function scoreMatch(me, other) {
  const theyTeachMe = skillsTaughtTo(other, me); // what I can learn from them
  const iTeachThem = skillsTaughtTo(me, other); // what I can teach them

  if (theyTeachMe.length === 0 && iTeachThem.length === 0) return null;

  const mutual = theyTeachMe.length > 0 && iTeachThem.length > 0;
  const overlapHours = availabilityOverlapHours(me.availability, other.availability);

  let score = 0;
  const breakdown = {};

  breakdown.mutual = mutual ? WEIGHTS.mutualBonus : 0;
  breakdown.skills = Math.min(
    (theyTeachMe.length + iTeachThem.length) * WEIGHTS.perSkillOverlap,
    WEIGHTS.maxSkillOverlapPoints
  );
  breakdown.rating = Math.round((other.rating || 0) * WEIGHTS.rating * 10) / 10;
  breakdown.sessions = Math.min(
    (other.completedSessions || 0) * WEIGHTS.sessions,
    WEIGHTS.maxSessionPoints
  );
  breakdown.availability = Math.min(
    overlapHours * WEIGHTS.availability,
    WEIGHTS.maxAvailabilityPoints
  );
  breakdown.levelFit = levelFitPoints(theyTeachMe);

  score = Object.values(breakdown).reduce((a, b) => a + b, 0);

  return {
    score: Math.round(score * 10) / 10,
    mutual,
    overlapHours,
    theyTeachYou: theyTeachMe.map((p) => p.skill),
    youTeachThem: iTeachThem.map((p) => p.skill),
    breakdown,
  };
}

/** Rank all candidates for `me`. Mutual matches always come first. */
function findMatches(me, candidates, { limit = 20 } = {}) {
  const results = [];
  for (const other of candidates) {
    if (String(other._id) === String(me._id)) continue;
    const m = scoreMatch(me, other);
    if (m) results.push({ user: other, ...m });
  }
  results.sort((a, b) => Number(b.mutual) - Number(a.mutual) || b.score - a.score);
  return results.slice(0, limit);
}

/**
 * Skill chains (3-way): me -> B -> C -> me
 *   B teaches something I want
 *   C teaches something B wants
 *   I teach something C wants
 * Used when there is no direct mutual match.
 */
function findSkillChains(me, candidates, { limit = 5 } = {}) {
  const others = candidates.filter((u) => String(u._id) !== String(me._id));
  const chains = [];

  for (const b of others) {
    const fromB = skillsTaughtTo(b, me); // I learn from B
    if (!fromB.length) continue;
    for (const c of others) {
      if (String(c._id) === String(b._id)) continue;
      const fromC = skillsTaughtTo(c, b); // B learns from C
      if (!fromC.length) continue;
      const toC = skillsTaughtTo(me, c); // C learns from me
      if (!toC.length) continue;
      chains.push({
        users: [b, c],
        path: [
          { teacher: b.name, learner: 'you', skill: fromB[0].skill },
          { teacher: c.name, learner: b.name, skill: fromC[0].skill },
          { teacher: 'you', learner: c.name, skill: toC[0].skill },
        ],
        score: (b.rating || 0) + (c.rating || 0),
      });
    }
  }
  chains.sort((x, y) => y.score - x.score);
  return chains.slice(0, limit).map(({ users, path, score }) => ({
    users: users.map((u) => ({ _id: u._id, name: u.name })),
    path,
    score,
  }));
}

module.exports = {
  scoreMatch,
  findMatches,
  findSkillChains,
  availabilityOverlapHours,
  skillsTaughtTo,
  WEIGHTS,
  norm,
  names,
};
