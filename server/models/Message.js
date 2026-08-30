const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    content: { type: String, required: true, trim: true },
    read: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Fast lookup of a conversation between two users, sorted by time
messageSchema.index({ sender: 1, recipient: 1, createdAt: 1 });

module.exports = mongoose.model("Message", messageSchema);
