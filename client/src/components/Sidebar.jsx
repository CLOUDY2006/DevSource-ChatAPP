import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import api from '../api/axios';
import Avatar from './Avatar';
import ConversationItem from './ConversationItem';
import ProfileModal from './ProfileModal';
import ThemeToggle from './ThemeToggle';
import { formatLastSeen, formatListTime } from '../utils/time';

export default function Sidebar({
  currentUser,
  conversations,
  activeUserId,
  onSelectUser,
  onlineIds,
  lastSeen,
  typingFrom,
}) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const searchActive = query.trim().length > 0;

  // Debounced user search: waits 300ms after the last keystroke.
  useEffect(() => {
    const q = query.trim();
    if (!q) {
      setResults([]);
      setSearching(false);
      return;
    }
    setSearching(true);
    let cancelled = false;
    const timer = setTimeout(async () => {
      try {
        const { data } = await api.get('/users/search', { params: { q } });
        if (!cancelled) setResults(data.users);
      } catch {
        if (!cancelled) setResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 300);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  const select = (user) => {
    setQuery('');
    onSelectUser(user);
  };

  return (
    <div className="flex h-full flex-col">
      {/* Header + search */}
      <div className="border-b border-slate-200 px-4 pb-3 pt-4 dark:border-slate-800">
        <div className="mb-3 flex items-center justify-between">
          <h1 className="text-xl font-bold">Messages</h1>
          <ThemeToggle />
        </div>
        <div className="relative">
          <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9 pr-9"
            placeholder="Search people by username"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Search users"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto">
        {searchActive ? (
          searching ? (
            <p className="p-6 text-center text-sm text-slate-500">Searching…</p>
          ) : results.length === 0 ? (
            <p className="p-6 text-center text-sm text-slate-500">No one found with that username.</p>
          ) : (
            results.map((u) => {
              const online = onlineIds.has(u._id);
              return (
                <ConversationItem
                  key={u._id}
                  user={u}
                  online={online}
                  active={u._id === activeUserId}
                  subtitle={online ? 'Online' : formatLastSeen(lastSeen[u._id] || u.lastSeen)}
                  onClick={() => select(u)}
                />
              );
            })
          )
        ) : conversations.length === 0 ? (
          <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
            No conversations yet. Search for a username above to start one.
          </div>
        ) : (
          conversations.map(({ user, lastMessage, unread }) => (
            <ConversationItem
              key={user._id}
              user={user}
              online={onlineIds.has(user._id)}
              active={user._id === activeUserId}
              unread={unread}
              typing={typingFrom[user._id]}
              time={formatListTime(lastMessage.createdAt)}
              subtitle={
                lastMessage.deletedForEveryone
                  ? 'This message was deleted'
                  : `${lastMessage.sender === currentUser._id ? 'You: ' : ''}${lastMessage.text}`
              }
              onClick={() => select(user)}
            />
          ))
        )}
      </div>

      {/* Profile bar */}
      <button
        onClick={() => setShowProfile(true)}
        className="flex items-center gap-3 border-t border-slate-200 px-4 py-3 text-left transition hover:bg-slate-100 dark:border-slate-800 dark:hover:bg-slate-800/60"
      >
        <Avatar name={currentUser.username} avatar={currentUser.avatar} size="sm" online />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{currentUser.username}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">View profile</p>
        </div>
      </button>

      {showProfile && <ProfileModal onClose={() => setShowProfile(false)} />}
    </div>
  );
}