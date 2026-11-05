const express = require("express");
const { updateProfile, getUserById, searchUsers } = require("../controllers/userController");
const { protect } = require("../middleware/auth");

const router = express.Router();

router.put("/profile", protect, updateProfile);
router.get("/search", protect, searchUsers);
router.get("/:id", protect, getUserById);

module.exports = router;
