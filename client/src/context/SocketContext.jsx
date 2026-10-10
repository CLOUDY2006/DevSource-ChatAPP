import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './AuthContext';
import { API_URL } from '../api/axios';

const SocketContext = createContext(null);

// Owns the single Socket.IO connection and the presence (online/offline) state.
export function SocketProvider({ children }) {
  const { user, token, logout } = useAuth();
  const [socket, setSocket] = useState(null);
  const [onlineIds, setOnlineIds] = useState(() => new Set());
  const [lastSeen, setLastSeen] = useState({}); // userId -> ISO date, updated live

  useEffect(() => {
    if (!user || !token) return;

    const s = io(API_URL || undefined, { auth: { token } });

    s.on('presence:list', (ids) => setOnlineIds(new Set(ids)));
    s.on('presence:online', (id) => setOnlineIds((prev) => new Set(prev).add(id)));
    s.on('presence:offline', ({ userId, lastSeen: ts }) => {
      setOnlineIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
      setLastSeen((prev) => ({ ...prev, [userId]: ts }));
    });
    // Bad/expired token -> go back to the login screen.
    s.on('connect_error', (err) => {
      if (['Invalid token', 'User not found', 'Authentication required'].includes(err.message)) logout();
    });

    setSocket(s);
    return () => {
      s.disconnect();
      setSocket(null);
      setOnlineIds(new Set());
    };
  }, [user?._id, token, logout]);

  return (
    <SocketContext.Provider value={{ socket, onlineIds, lastSeen }}>{children}</SocketContext.Provider>
  );
}

export const useSocket = () => useContext(SocketContext);
