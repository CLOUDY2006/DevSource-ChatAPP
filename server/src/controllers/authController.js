import User from '../models/User.js';
import { signToken } from '../utils/token.js';

const session = (user) => ({ token: signToken(user._id), user: user.toClient() });

export async function register(req, res) {
  const { username, email, password } = req.body;
  if (!username || !email || !password) {
    return res.status(400).json({ message: 'Username, email and password are required' });
  }
  // Schema validation + unique indexes produce friendly errors (see middleware/error.js)
  const user = await User.create({ username, email, password });
  res.status(201).json(session(user));
}

export async function login(req, res) {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }
  // password has select:false, so ask for it explicitly
  const user = await User.findOne({ email: String(email).toLowerCase().trim() }).select('+password');
  if (!user || !(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Incorrect email or password' });
  }
  res.json(session(user));
}

export function me(req, res) {
  res.json({ user: req.user.toClient() });
}
