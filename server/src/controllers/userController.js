import User from '../models/User.js';

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// GET /api/users/search?q=ali
export async function searchUsers(req, res) {
  const q = String(req.query.q || '').trim();
  if (!q) return res.json({ users: [] });

  const users = await User.find({
    _id: { $ne: req.user._id },
    username: new RegExp(escapeRegex(q), 'i'),
  })
    .select('username avatar lastSeen')
    .sort({ username: 1 })
    .limit(10)
    .lean();

  res.json({ users });
}

// PATCH /api/users/me  { username?, avatar? }
export async function updateProfile(req, res) {
  const { username, avatar } = req.body;
  if (username === undefined && avatar === undefined) {
    return res.status(400).json({ message: 'Nothing to update' });
  }

  const user = req.user;
  if (username !== undefined) user.username = username;
  if (avatar !== undefined) user.avatar = avatar;

  // save() runs the schema validators (length, format, allowed icons)
  // and the unique index rejects a username someone else already has.
  await user.save();

  // Tell everyone connected so sidebars and chat headers update live.
  req.app.get('io')?.emit('profile:updated', {
    _id: user._id.toString(),
    username: user.username,
    avatar: user.avatar || null,
  });

  res.json({ user: user.toClient() });
}