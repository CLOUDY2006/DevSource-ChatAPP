import Avatar from './Avatar';

// One row in the sidebar (used for both recent chats and search results).
export default function ConversationItem({ user, subtitle, time, unread = 0, active, online, typing, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`flex w-full items-center gap-3 px-4 py-3 text-left transition ${
        active
          ? 'bg-brand-50 dark:bg-brand-500/15'
          : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
      }`}
    >
      <Avatar name={user.username} avatar={user.avatar} online={online} />
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate font-semibold">{user.username}</span>
          {time && <span className="shrink-0 text-xs text-slate-500 dark:text-slate-400">{time}</span>}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span
            className={`truncate text-sm ${
              typing ? 'font-medium text-brand-600 dark:text-brand-400' : 'text-slate-500 dark:text-slate-400'
            }`}
          >
            {typing ? 'typing…' : subtitle}
          </span>
          {unread > 0 && (
            <span className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-brand-600 px-1.5 text-xs font-semibold text-white">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}