# Real-Time Chat App

React + Vite + Tailwind · Node + Express · Socket.IO · MongoDB + Mongoose · JWT + bcrypt

## Run it

Requirements: Node 20+ and a running MongoDB (local or Atlas).

```bash
# 1. Backend
cd server
cp .env.example .env        # set MONGO_URI and a long random JWT_SECRET
npm install
npm run dev                 # http://localhost:5000

# 2. Frontend (new terminal)
cd client
npm install
npm run dev                 # http://localhost:5173
```

Open http://localhost:5173 in two browsers (or one normal + one private window), register two users, search for each other and chat.

## Structure

```
server/src
  index.js               Express + HTTP server + Socket.IO bootstrap
  config/db.js           Mongoose connection
  models/                User, Message
  middleware/            auth (JWT guard), error (central handler)
  controllers/           auth, user (search), message (history, conversations, read)
  routes/                one router per controller
  socket/index.js        auth handshake, presence, send message, typing
  utils/token.js         sign / verify JWT

client/src
  api/axios.js           axios instance that adds the JWT
  context/               Auth, Socket (+presence), Theme
  hooks/useChat.js       conversations, messages, typing, send, pagination
  pages/                 Login, Register, Chat
  components/            Sidebar, ChatWindow, MessageBubble, MessageInput, ...
  utils/time.js          timestamp formatting
```

## REST API

| Method | Route | Purpose |
|---|---|---|
| POST | /api/auth/register | create account, returns `{ token, user }` |
| POST | /api/auth/login | returns `{ token, user }` |
| GET | /api/auth/me | current user from token |
| GET | /api/users/search?q= | search by username (max 10) |
| GET | /api/messages/conversations | recent chats + last message + unread count |
| GET | /api/messages/:userId?before= | 30 messages, `before` pages back in time |
| PATCH | /api/messages/:userId/read | mark messages from that user as read |

## Socket.IO events

| Event | Direction | Payload |
|---|---|---|
| (handshake) | client → server | `auth: { token }` |
| `message:send` | client → server | `{ to, text }` + ack `{ ok, error? }` |
| `message:new` | server → both users | saved message |
| `typing` | both ways | `{ to, isTyping }` / `{ from, isTyping }` |
| `presence:list` | server → client | online user ids (on connect) |
| `presence:online` | server → all | userId |
| `presence:offline` | server → all | `{ userId, lastSeen }` |

## Notes

- The JWT is kept in localStorage for simplicity. For stricter security, use an httpOnly cookie.
- Production: build the client (`npm run build`), set `VITE_API_URL` and the server's `CLIENT_URL`, and add rate limiting on the auth routes.
