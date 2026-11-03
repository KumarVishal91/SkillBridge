const Message = require('../models/Message');
const { verifyToken } = require('../middleware/auth');

// userId -> Set<socketId>
const online = new Map();

function setupChat(io) {
  io.use((socket, next) => {
    try {
      socket.userId = verifyToken(socket.handshake.auth?.token).id;
      next();
    } catch {
      next(new Error('Unauthorized'));
    }
  });

  io.on('connection', (socket) => {
    const uid = socket.userId;
    socket.join(`user:${uid}`);

    if (!online.has(uid)) online.set(uid, new Set());
    online.get(uid).add(socket.id);
    io.emit('presence', { userId: uid, online: true });
    socket.emit('presence:list', [...online.keys()]);

    socket.on('message:send', async ({ to, text }, ack) => {
      try {
        const clean = String(text || '').trim();
        if (!to || !clean) return ack?.({ error: 'Invalid message' });
        const msg = await Message.create({ from: uid, to, text: clean });
        const payload = msg.toObject();
        io.to(`user:${to}`).emit('message:new', payload);
        io.to(`user:${uid}`).emit('message:new', payload); // sync sender's other tabs
        ack?.({ ok: true, message: payload });
      } catch (e) {
        ack?.({ error: e.message });
      }
    });

    socket.on('typing', ({ to, typing }) => {
      if (to) io.to(`user:${to}`).emit('typing', { from: uid, typing: !!typing });
    });

    socket.on('disconnect', () => {
      const set = online.get(uid);
      if (set) {
        set.delete(socket.id);
        if (set.size === 0) {
          online.delete(uid);
          io.emit('presence', { userId: uid, online: false });
        }
      }
    });
  });
}

module.exports = setupChat;
