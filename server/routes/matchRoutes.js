const express = require("express");
const { getMatches, getSkillChains } = require("../controllers/matchController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/", protect, getMatches);
router.get("/chains", protect, getSkillChains);

module.exports = router;
