const express = require("express");
const { getConversation } = require("../controllers/messageController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.get("/:userId", protect, getConversation);

module.exports = router;
