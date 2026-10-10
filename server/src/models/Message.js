import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
    read: { type: Boolean, default: false },
    // "Delete for me": ids of users who hid this message from their own view.
    deletedFor: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // "Delete for everyone": text is wiped and the message shows as a placeholder.
    deletedForEveryone: { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Fast "conversation between A and B, newest first" queries.
messageSchema.index({ sender: 1, recipient: 1, createdAt: -1 });
// Fast unread counts.
messageSchema.index({ recipient: 1, read: 1 });

messageSchema.methods.toClient = function () {
  return {
    _id: this._id.toString(),
    sender: this.sender.toString(),
    recipient: this.recipient.toString(),
    text: this.text,
    read: this.read,
    deletedForEveryone: this.deletedForEveryone,
    createdAt: this.createdAt.toISOString(),
  };
};

export default mongoose.model('Message', messageSchema);