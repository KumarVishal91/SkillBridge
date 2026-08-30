const { findMatches, findSkillChains } = require("../services/matchingEngine");

const getMatches = async (req, res) => {
  try {
    const matches = await findMatches(req.userId);
    res.json(matches);
  } catch (err) {
    res.status(500).json({ message: "Failed to compute matches", error: err.message });
  }
};

const getSkillChains = async (req, res) => {
  try {
    const chains = await findSkillChains(req.userId);
    res.json(chains);
  } catch (err) {
    res.status(500).json({ message: "Failed to compute skill chains", error: err.message });
  }
};

module.exports = { getMatches, getSkillChains };
