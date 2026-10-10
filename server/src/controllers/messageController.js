import mongoose from 'mongoose';
import Message from '../models/Message.js';

const PAGE_SIZE = 30;

function parseUserId(req, res) {
  const { userId } = req.params;
  if (!mongoose.isValidObjectId(userId)) {
    res.status(400).json({ message: 'Invalid user id' });
    return null;
  }
  return userId;
}

// GET /api/messages/conversations
// One entry per person you've chatted with: last message + unread count, newest first.
export async function getConversations(req, res) {
  const me = req.user._id;

  const conversations = await Message.aggregate([
    // ignore messages this user deleted "for me"
    { $match: { $or: [{ sender: me }, { recipient: me }], deletedFor: { $ne: me } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: { $cond: [{ $eq: ['$sender', me] }, '$recipient', '$sender'] },
        lastMessage: { $first: '$$ROOT' },
        unread: {
          $sum: {
            $cond: [
              {
                $and: [
                  { $eq: ['$recipient', me] },
                  { $eq: ['$read', false] },
                  { $ne: ['$deletedForEveryone', true] },
                ],
              },
              1,
              0,
            ],
          },
        },
      },
    },
    { $sort: { 'lastMessage.createdAt': -1 } },
    { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
    { $unwind: '$user' },
    {
      $project: {
        _id: 0,
        unread: 1,
        lastMessage: { _id: 1, sender: 1, recipient: 1, text: 1, read: 1, deletedForEveryone: 1, createdAt: 1 },
        user: { _id: 1, username: 1, avatar: 1, lastSeen: 1 },
      },
    },
  ]);

  res.json({ conversations });
}

// GET /api/messages/:userId?before=<ISO date>
// Returns up to 30 messages (oldest -> newest). Pass `before` to page back in time.
export async function getMessages(req, res) {
  const other = parseUserId(req, res);
  if (!other) return;
  const me = req.user._id;

  const filter = {
    $or: [
      { sender: me, recipient: other },
      { sender: other, recipient: me },
    ],
    deletedFor: { $ne: me }, // hide messages deleted "for me"
  };
  if (req.query.before) {
    const before = new Date(req.query.before);
    if (!Number.isNaN(before.getTime())) filter.createdAt = { $lt: before };
  }

  // fetch one extra row so we know if there is another page
  const rows = await Message.find(filter)
    .sort({ createdAt: -1 })
    .limit(PAGE_SIZE + 1)
    .select('-deletedFor')
    .lean();

  const hasMore = rows.length > PAGE_SIZE;
  const messages = rows.slice(0, PAGE_SIZE).reverse();
  res.json({ messages, hasMore });
}

// PATCH /api/messages/:userId/read  -> mark everything from :userId as read
export async function markRead(req, res) {
  const other = parseUserId(req, res);
  if (!other) return;

  const result = await Message.updateMany(
    { sender: other, recipient: req.user._id, read: false },
    { $set: { read: true } }
  );
  res.json({ updated: result.modifiedCount });
}

// DELETE /api/messages/:messageId?scope=me|everyone
//  me       -> hides the message for the current user only (sender or recipient)
//  everyone -> sender only; wipes the text for both users
export async function deleteMessage(req, res) {
  const { messageId } = req.params;
  const { scope } = req.query;
  if (!mongoose.isValidObjectId(messageId)) {
    return res.status(400).json({ message: 'Invalid message id' });
  }
  if (!['me', 'everyone'].includes(scope)) {
    return res.status(400).json({ message: 'scope must be "me" or "everyone"' });
  }

  const me = req.user._id;
  // only participants of the conversation may touch the message
  const message = await Message.findOne({
    _id: messageId,
    $or: [{ sender: me }, { recipient: me }],
  });
  if (!message) return res.status(404).json({ message: 'Message not found' });

  const payload = {
    _id: message._id.toString(),
    sender: message.sender.toString(),
    recipient: message.recipient.toString(),
    scope,
  };
  const io = req.app.get('io');

  if (scope === 'everyone') {
    if (!message.sender.equals(me)) {
      return res.status(403).json({ message: 'You can only delete your own messages for everyone' });
    }
    await Message.updateOne({ _id: message._id }, { $set: { deletedForEveryone: true, text: '' } });
    // both users (and all their tabs) are told
    io?.to(payload.sender).to(payload.recipient).emit('message:deleted', payload);
  } else {
    await Message.updateOne({ _id: message._id }, { $addToSet: { deletedFor: me } });
    // only the current user's own tabs are told
    io?.to(me.toString()).emit('message:deleted', payload);
  }

  res.json(payload);
}