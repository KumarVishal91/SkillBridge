const jwt = require("jsonwebtoken");
const Message = require("../models/Message");

// Maps userId -> socketId for direct delivery + presence
const onlineUsers = new Map();

const initChatSocket = (io) => {
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (err) {
      next(new Error("Authentication failed"));
    }
  });

  io.on("connection", (socket) => {
    onlineUsers.set(socket.userId, socket.id);
    io.emit("presence:update", Array.from(onlineUsers.keys()));

    socket.on("message:send", async ({ recipientId, content }) => {
      try {
        const message = await Message.create({
          sender: socket.userId,
          recipient: recipientId,
          content,
        });

        const recipientSocketId = onlineUsers.get(recipientId);
        if (recipientSocketId) {
          io.to(recipientSocketId).emit("message:receive", message);
        }
        socket.emit("message:sent", message);
      } catch (err) {
        socket.emit("message:error", { message: "Failed to send message" });
      }
    });

    socket.on("typing:start", ({ recipientId }) => {
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("typing:start", { userId: socket.userId });
      }
    });

    socket.on("typing:stop", ({ recipientId }) => {
      const recipientSocketId = onlineUsers.get(recipientId);
      if (recipientSocketId) {
        io.to(recipientSocketId).emit("typing:stop", { userId: socket.userId });
      }
    });

    socket.on("disconnect", () => {
      onlineUsers.delete(socket.userId);
      io.emit("presence:update", Array.from(onlineUsers.keys()));
    });
  });
};

module.exports = { initChatSocket };
