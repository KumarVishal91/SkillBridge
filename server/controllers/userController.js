const User = require("../models/User");

const updateProfile = async (req, res) => {
  try {
    const allowedFields = [
      "name",
      "bio",
      "timezone",
      "skillsTeach",
      "skillsWant",
      "availability",
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(req.userId, updates, {
      new: true,
      runValidators: true,
    });

    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user.toSafeObject());
  } catch (err) {
    res.status(500).json({ message: "Failed to update profile", error: err.message });
  }
};

const getUserById = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: "User not found" });
  res.json(user.toSafeObject());
};

const searchUsers = async (req, res) => {
  try {
    const { skill } = req.query;
    const query = skill
      ? { "skillsTeach.name": { $regex: skill, $options: "i" } }
      : {};

    const users = await User.find(query)
      .select("-password")
      .sort({ rating: -1, completedSessions: -1 })
      .limit(50);

    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Search failed", error: err.message });
  }
};

module.exports = { updateProfile, getUserById, searchUsers };
