const Message = require("../models/Message");

const getConversation = async (req, res) => {
  try {
    const otherUserId = req.params.userId;
    const messages = await Message.find({
      $or: [
        { sender: req.userId, recipient: otherUserId },
        { sender: otherUserId, recipient: req.userId },
      ],
    }).sort({ createdAt: 1 });

    res.json(messages);
  } catch (err) {
    res.status(500).json({ message: "Failed to load conversation", error: err.message });
  }
};

module.exports = { getConversation };
