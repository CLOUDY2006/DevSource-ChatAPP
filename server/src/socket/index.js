import { Server } from 'socket.io';
import mongoose from 'mongoose';
import User from '../models/User.js';
import Message from '../models/Message.js';
import { verifyToken } from '../utils/token.js';
import { allowedOrigins } from '../utils/origins.js';

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: { origin: allowedOrigins(), credentials: true },
  });

  // userId -> Set of socket ids (one user can have several tabs/devices open)
  const online = new Map();

  // ---- Authentication: runs once per connection, before "connection" fires ----
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next(new Error('Authentication required'));
      const { id } = verifyToken(token);
      const user = await User.findById(id).select('_id username');
      if (!user) return next(new Error('User not found'));
      socket.user = { id: user._id.toString(), username: user.username };
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const userId = socket.user.id;

    // Every user gets a private room named after their id.
    // Emitting to that room reaches all of their open tabs.
    socket.join(userId);

    // ---- Presence ----
    const sockets = online.get(userId) ?? new Set();
    sockets.add(socket.id);
    online.set(userId, sockets);

    socket.emit('presence:list', [...online.keys()]);
    if (sockets.size === 1) socket.broadcast.emit('presence:online', userId); // first tab only

    // ---- Messaging ----
    // Client sends { to, text } and gets an acknowledgement { ok, error? } back.
    socket.on('message:send', async (payload, ack) => {
      try {
        const { to, text } = payload || {};
        const body = typeof text === 'string' ? text.trim() : '';
        if (!body) throw new Error('Message cannot be empty');
        if (body.length > 2000) throw new Error('Message is too long (max 2000 characters)');
        if (!mongoose.isValidObjectId(to) || to === userId) throw new Error('Invalid recipient');
        if (!(await User.exists({ _id: to }))) throw new Error('Recipient not found');

        const message = await Message.create({ sender: userId, recipient: to, text: body });
        const data = message.toClient();

        // Deliver to the recipient's room AND the sender's room (keeps the sender's other tabs in sync).
        io.to(to).to(userId).emit('message:new', data);
        ack?.({ ok: true, message: data });
      } catch (err) {
        ack?.({ ok: false, error: err.message });
      }
    });

    // ---- Typing indicator (not stored, just relayed) ----
    socket.on('typing', ({ to, isTyping } = {}) => {
      if (!mongoose.isValidObjectId(to)) return;
      socket.to(to).emit('typing', { from: userId, isTyping: Boolean(isTyping) });
    });

    // ---- Disconnect ----
    socket.on('disconnect', async () => {
      const set = online.get(userId);
      set?.delete(socket.id);
      if (set && set.size > 0) return; // still connected in another tab

      online.delete(userId);
      const lastSeen = new Date();
      await User.findByIdAndUpdate(userId, { lastSeen }).catch(() => {});
      if (!online.has(userId)) {
        io.emit('presence:offline', { userId, lastSeen: lastSeen.toISOString() });
      }
    });
  });

  return io;
}