import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import Avatar from './Avatar';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import DeleteMessageModal from './DeleteMessageModal';
import { getErrorMessage } from '../api/axios';
import { formatDayLabel, formatLastSeen } from '../utils/time';

function TypingBubble() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-bl-md border border-slate-200 bg-white px-4 py-3 dark:border-slate-700 dark:bg-slate-800">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="h-1.5 w-1.5 animate-dot rounded-full bg-slate-400"
            style={{ animationDelay: `${i * 0.15}s` }}
          />
        ))}
      </div>
    </div>
  );
}

// Rendered with key={activeUser._id}, so every chat starts with fresh scroll state.
export default function ChatWindow({
  currentUserId,
  user,
  messages,
  hasMore,
  loading,
  online,
  lastSeen,
  isTyping,
  onBack,
  onLoadEarlier,
  onSend,
  onDeleteMessage,
  onTyping,
}) {
  const listRef = useRef(null);
  const nearBottom = useRef(true);
  const lastIdRef = useRef(null);
  const prevHeight = useRef(0); // set just before older messages are prepended

  // delete flow: which message the dialog is open for
  const [toDeleteId, setToDeleteId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  const target = messages.find((m) => m._id === toDeleteId);

  const closeDelete = () => {
    if (deleting) return;
    setToDeleteId(null);
    setDeleteError('');
  };

  const confirmDelete = async (scope) => {
    setDeleting(true);
    setDeleteError('');
    try {
      await onDeleteMessage(toDeleteId, scope);
      setToDeleteId(null);
    } catch (err) {
      setDeleteError(getErrorMessage(err));
    } finally {
      setDeleting(false);
    }
  };

  useLayoutEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const last = messages[messages.length - 1];

    if (prevHeight.current) {
      // older messages were added above: keep the viewport where it was
      el.scrollTop = el.scrollHeight - prevHeight.current;
      prevHeight.current = 0;
    } else if (last?._id !== lastIdRef.current && (nearBottom.current || last?.sender === currentUserId)) {
      el.scrollTop = el.scrollHeight;
    }
    lastIdRef.current = last?._id;
  }, [messages, currentUserId]);

  const handleScroll = () => {
    const el = listRef.current;
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  };

  const loadEarlier = async () => {
    prevHeight.current = listRef.current.scrollHeight;
    const ok = await onLoadEarlier();
    if (!ok) prevHeight.current = 0;
  };

  const status = isTyping ? 'typing…' : online ? 'Online' : formatLastSeen(lastSeen);

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-3 py-3 dark:border-slate-800 dark:bg-slate-900 md:px-5">
        <button className="icon-btn md:hidden" onClick={onBack} aria-label="Back to conversations">
          <ArrowLeft size={20} />
        </button>
        <Avatar name={user.username} avatar={user.avatar} online={online} />
        <div className="min-w-0">
          <h2 className="truncate font-semibold">{user.username}</h2>
          <p
            className={`truncate text-xs ${
              isTyping || online ? 'text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {status}
          </p>
        </div>
      </header>

      {/* Messages */}
      <div ref={listRef} onScroll={handleScroll} className="flex-1 space-y-1.5 overflow-y-auto px-3 py-4 md:px-6">
        {hasMore && (
          <div className="pb-2 text-center">
            <button
              onClick={loadEarlier}
              className="rounded-full bg-slate-200 px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-300 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
            >
              Load earlier messages
            </button>
          </div>
        )}

        {loading && <p className="py-8 text-center text-sm text-slate-500">Loading messages…</p>}

        {!loading && messages.length === 0 && (
          <p className="py-12 text-center text-sm text-slate-500 dark:text-slate-400">
            No messages yet. Say hello to {user.username}.
          </p>
        )}

        {messages.map((m, i) => {
          const newDay = i === 0 || new Date(m.createdAt).toDateString() !== new Date(messages[i - 1].createdAt).toDateString();
          return (
            <Fragment key={m._id}>
              {newDay && (
                <div className="py-2 text-center">
                  <span className="rounded-full bg-slate-200/80 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                    {formatDayLabel(m.createdAt)}
                  </span>
                </div>
              )}
              <MessageBubble
                message={m}
                isOwn={m.sender === currentUserId}
                onDelete={(msg) => {
                  setDeleteError('');
                  setToDeleteId(msg._id);
                }}
              />
            </Fragment>
          );
        })}

        {isTyping && <TypingBubble />}
      </div>

      <MessageInput onSend={onSend} onTyping={onTyping} />

      {target && (
        <DeleteMessageModal
          message={target}
          canDeleteForEveryone={target.sender === currentUserId && !target.deletedForEveryone}
          busy={deleting}
          error={deleteError}
          onDeleteForMe={() => confirmDelete('me')}
          onDeleteForEveryone={() => confirmDelete('everyone')}
          onCancel={closeDelete}
        />
      )}
    </div>
  );
}