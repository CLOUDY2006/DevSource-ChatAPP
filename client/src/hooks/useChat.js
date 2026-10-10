import { useCallback, useEffect, useRef, useState } from 'react';
import api from '../api/axios';

// All chat state + actions live here so the page/components stay presentational.
export function useChat(currentUser, socket) {
  const [conversations, setConversations] = useState([]);
  const [activeUser, setActiveUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [typingFrom, setTypingFrom] = useState({}); // userId -> boolean

  // Refs let socket handlers read the latest values without re-subscribing.
  const activeRef = useRef(null);
  const conversationsRef = useRef([]);
  const typingTimers = useRef({});
  conversationsRef.current = conversations;

  const loadConversations = useCallback(async () => {
    try {
      const { data } = await api.get('/messages/conversations');
      setConversations(data.conversations);
    } catch {
      /* sidebar just stays empty */
    }
  }, []);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  const markRead = useCallback((userId) => {
    api.patch(`/messages/${userId}/read`).catch(() => {});
    setConversations((prev) => prev.map((c) => (c.user._id === userId ? { ...c, unread: 0 } : c)));
  }, []);

  const openChat = useCallback(
    async (user) => {
      activeRef.current = user;
      setActiveUser(user);
      setMessages([]);
      setHasMore(false);
      setLoadingMessages(true);
      try {
        const { data } = await api.get(`/messages/${user._id}`);
        if (activeRef.current?._id !== user._id) return; // user already switched chats
        setMessages(data.messages);
        setHasMore(data.hasMore);
        markRead(user._id);
      } catch {
        /* leave the window empty */
      } finally {
        if (activeRef.current?._id === user._id) setLoadingMessages(false);
      }
    },
    [markRead]
  );

  const closeChat = useCallback(() => {
    activeRef.current = null;
    setActiveUser(null);
    setMessages([]);
  }, []);

  // Fetch the next older page (cursor = createdAt of the oldest loaded message).
  const loadEarlier = useCallback(async () => {
    const other = activeRef.current;
    const oldest = messages[0];
    if (!other || !oldest) return false;
    try {
      const { data } = await api.get(`/messages/${other._id}`, { params: { before: oldest.createdAt } });
      if (activeRef.current?._id !== other._id) return false;
      setMessages((prev) => [...data.messages, ...prev]);
      setHasMore(data.hasMore);
      return true;
    } catch {
      return false;
    }
  }, [messages]);

  // Send through the socket; the server saves it, then broadcasts "message:new" to both users.
  const sendMessage = useCallback(
    (text) =>
      new Promise((resolve, reject) => {
        const to = activeRef.current?._id;
        if (!socket || !to) return reject(new Error('Not connected'));
        socket.timeout(8000).emit('message:send', { to, text }, (err, res) => {
          if (err) return reject(new Error('Message timed out. Check your connection.'));
          if (!res?.ok) return reject(new Error(res?.error || 'Could not send message'));
          resolve(res.message);
        });
      }),
    [socket]
  );

  // Apply a deletion locally. Called after our own API call and when the socket
  // announces one (so other tabs / the other person's screen stay in sync).
  const applyDeletion = useCallback(
    ({ _id, scope }) => {
      setMessages((prev) =>
        scope === 'me'
          ? prev.filter((m) => m._id !== _id)
          : prev.map((m) => (m._id === _id ? { ...m, text: '', deletedForEveryone: true } : m))
      );
      loadConversations(); // refresh last-message previews and unread counts
    },
    [loadConversations]
  );

  const deleteMessage = useCallback(
    async (messageId, scope) => {
      const { data } = await api.delete(`/messages/${messageId}`, { params: { scope } });
      applyDeletion(data);
    },
    [applyDeletion]
  );

  const emitTyping = useCallback(
    (to, isTyping) => socket?.emit('typing', { to, isTyping }),
    [socket]
  );

  // ---- Incoming socket events ----
  useEffect(() => {
    if (!socket) return;

    const onMessage = (msg) => {
      const mine = msg.sender === currentUser._id;
      const otherId = mine ? msg.recipient : msg.sender;
      const isActive = activeRef.current?._id === otherId;

      if (isActive) {
        setMessages((prev) => (prev.some((m) => m._id === msg._id) ? prev : [...prev, msg]));
        if (!mine) markRead(otherId);
      }

      const existing = conversationsRef.current.find((c) => c.user._id === otherId);
      const knownUser = existing?.user || (isActive ? activeRef.current : null);

      if (!knownUser) {
        loadConversations(); // first message from someone we have no profile for yet
        return;
      }
      setConversations((prev) => {
        const old = prev.find((c) => c.user._id === otherId);
        const entry = {
          user: knownUser,
          lastMessage: msg,
          unread: (old?.unread || 0) + (!mine && !isActive ? 1 : 0),
        };
        return [entry, ...prev.filter((c) => c.user._id !== otherId)];
      });

      // a message from them means they've stopped typing
      if (!mine) setTypingFrom((p) => ({ ...p, [otherId]: false }));
    };

    const onTyping = ({ from, isTyping }) => {
      clearTimeout(typingTimers.current[from]);
      setTypingFrom((p) => ({ ...p, [from]: isTyping }));
      // safety net in case the "stopped typing" event is lost
      if (isTyping) {
        typingTimers.current[from] = setTimeout(
          () => setTypingFrom((p) => ({ ...p, [from]: false })),
          5000
        );
      }
    };

    // Someone changed their name or icon: patch it everywhere we show them.
    const onProfile = (p) => {
      setConversations((prev) =>
        prev.map((c) => (c.user._id === p._id ? { ...c, user: { ...c.user, ...p } } : c))
      );
      if (activeRef.current?._id === p._id) {
        activeRef.current = { ...activeRef.current, ...p };
        setActiveUser(activeRef.current);
      }
    };

    socket.on('message:new', onMessage);
    socket.on('typing', onTyping);
    socket.on('profile:updated', onProfile);
    socket.on('message:deleted', applyDeletion);
    return () => {
      socket.off('message:new', onMessage);
      socket.off('typing', onTyping);
      socket.off('profile:updated', onProfile);
      socket.off('message:deleted', applyDeletion);
    };
  }, [socket, currentUser._id, markRead, loadConversations, applyDeletion]);

  return {
    conversations,
    activeUser,
    messages,
    hasMore,
    loadingMessages,
    typingFrom,
    openChat,
    closeChat,
    loadEarlier,
    sendMessage,
    deleteMessage,
    emitTyping,
  };
}