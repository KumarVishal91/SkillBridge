const User = require("../models/User");

/**
 * Checks whether skillName appears in a user's skill list (case-insensitive).
 */
const hasSkill = (skillList, skillName) =>
  skillList.some((s) => s.name.toLowerCase() === skillName.toLowerCase());

/**
 * Counts overlapping availability slots between two users.
 * A simple day+time-window overlap check, not a full calendar diff.
 */
const countAvailabilityOverlap = (slotsA, slotsB) => {
  let overlap = 0;
  for (const a of slotsA) {
    for (const b of slotsB) {
      if (a.dayOfWeek === b.dayOfWeek && a.startTime < b.endTime && b.startTime < a.endTime) {
        overlap += 1;
      }
    }
  }
  return overlap;
};

/**
 * Computes a match score between the current user and a candidate.
 * Weighted combination of: mutual-match bonus, candidate rating,
 * completed sessions, and availability overlap.
 */
const scoreCandidate = (currentUser, candidate) => {
  const candidateTeachesWhatIWant = candidate.skillsTeach.filter((s) =>
    hasSkill(currentUser.skillsWant, s.name)
  );
  const iTeachWhatCandidateWants = currentUser.skillsTeach.filter((s) =>
    hasSkill(candidate.skillsWant, s.name)
  );

  const isMutual = candidateTeachesWhatIWant.length > 0 && iTeachWhatCandidateWants.length > 0;

  if (candidateTeachesWhatIWant.length === 0) return null; // not relevant at all

  const availabilityOverlap = countAvailabilityOverlap(
    currentUser.availability || [],
    candidate.availability || []
  );

  // Weighted score - tune these weights as the product evolves
  const score =
    (isMutual ? 50 : 0) +
    candidateTeachesWhatIWant.length * 10 +
    candidate.rating * 6 +
    Math.min(candidate.completedSessions, 10) * 2 +
    availabilityOverlap * 5;

  return {
    userId: candidate._id,
    name: candidate.name,
    rating: candidate.rating,
    isMutual,
    theyTeachYouWant: candidateTeachesWhatIWant.map((s) => s.name),
    youTeachTheyWant: iTeachWhatCandidateWants.map((s) => s.name),
    availabilityOverlap,
    score: Math.round(score * 100) / 100,
  };
};

/**
 * Finds and ranks direct matches for a user.
 */
const findMatches = async (userId, limit = 20) => {
  const currentUser = await User.findById(userId);
  if (!currentUser) throw new Error("User not found");

  if (!currentUser.skillsWant.length) return [];

  const candidates = await User.find({ _id: { $ne: userId } });

  const scored = candidates
    .map((candidate) => scoreCandidate(currentUser, candidate))
    .filter(Boolean)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  return scored;
};

/**
 * Stretch feature: finds 3-way skill chains (A wants what B teaches,
 * B wants what C teaches, C wants what A teaches) when no direct
 * mutual match exists for the user.
 */
const findSkillChains = async (userId, limit = 5) => {
  const currentUser = await User.findById(userId);
  if (!currentUser) throw new Error("User not found");

  const allUsers = await User.find({ _id: { $ne: userId } });
  const chains = [];

  for (const b of allUsers) {
    const bTeachesWhatATakes = b.skillsTeach.some((s) => hasSkill(currentUser.skillsWant, s.name));
    if (!bTeachesWhatATakes) continue;

    for (const c of allUsers) {
      if (c._id.equals(b._id)) continue;

      const cTeachesWhatBWants = c.skillsTeach.some((s) => hasSkill(b.skillsWant, s.name));
      const aTeachesWhatCWants = currentUser.skillsTeach.some((s) => hasSkill(c.skillsWant, s.name));

      if (cTeachesWhatBWants && aTeachesWhatCWants) {
        chains.push({
          chain: [
            { userId: currentUser._id, name: currentUser.name },
            { userId: b._id, name: b.name },
            { userId: c._id, name: c.name },
          ],
        });
      }

      if (chains.length >= limit) return chains;
    }
  }

  return chains;
};

module.exports = { findMatches, findSkillChains };
