import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';

import { connectDB } from './config/db.js';
import { initSocket } from './socket/index.js';
import authRoutes from './routes/authRoutes.js';
import userRoutes from './routes/userRoutes.js';
import messageRoutes from './routes/messageRoutes.js';
import { notFound, errorHandler } from './middleware/error.js';
import { allowedOrigins } from './utils/origins.js';

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is not set. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const app = express();
app.use(cors({ origin: allowedOrigins(), credentials: true }));
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/messages', messageRoutes);

app.use(notFound);
app.use(errorHandler);

// Express and Socket.IO share one HTTP server (and one port).
const server = http.createServer(app);
app.set('io', initSocket(server)); // controllers reach it via req.app.get('io')

await connectDB();
const port = process.env.PORT || 5000;
server.listen(port, () => console.log(`Server listening on http://localhost:${port}`));