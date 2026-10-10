import mongoose from 'mongoose';
import bcrypt from 'bcrypt';

// Profile icons the user can pick from. The client maps each key to an icon + colour.
export const AVATAR_KEYS = ['cat', 'dog', 'bird', 'fish', 'rabbit', 'squirrel', 'turtle', 'rat', 'snail'];

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: [true, 'Username is required'],
      unique: true,
      trim: true,
      lowercase: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username must be at most 20 characters'],
      match: [/^[a-z0-9_]+$/, 'Username can only contain letters, numbers and underscores'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      trim: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Enter a valid email address'],
    },
    // select: false -> never returned by queries unless explicitly requested
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false,
    },
    avatar: {
      type: String,
      enum: { values: AVATAR_KEYS, message: 'Choose one of the available icons' },
    },
    lastSeen: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Hash the password whenever it is set or changed.
userSchema.pre('save', async function () {
  if (!this.isModified('password')) return;
  this.password = await bcrypt.hash(this.password, 10);
});

userSchema.methods.matchPassword = function (plain) {
  return bcrypt.compare(plain, this.password);
};

// Shape sent to the client (never includes the password).
userSchema.methods.toClient = function () {
  return {
    _id: this._id.toString(),
    username: this.username,
    email: this.email,
    avatar: this.avatar || null,
    lastSeen: this.lastSeen,
    createdAt: this.createdAt,
  };
};

export default mongoose.model('User', userSchema);