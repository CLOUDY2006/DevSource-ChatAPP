import { Ban, Trash2 } from 'lucide-react';
import { formatTime } from '../utils/time';

export default function MessageBubble({ message, isOwn, onDelete }) {
  const deleted = message.deletedForEveryone;

  // Trash button: appears on hover (desktop) and is always visible on touch screens.
  const deleteButton = (
    <button
      onClick={() => onDelete(message)}
      aria-label="Delete message"
      className="icon-btn h-8 w-8 shrink-0 opacity-0 transition focus-visible:opacity-100 group-hover:opacity-100 [@media(hover:none)]:opacity-100"
    >
      <Trash2 size={15} />
    </button>
  );

  const bubbleStyle = deleted
    ? 'border border-dashed border-slate-300 text-slate-500 dark:border-slate-600 dark:text-slate-400'
    : isOwn
      ? 'rounded-br-md bg-brand-600 text-white shadow-sm'
      : 'rounded-bl-md border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800';

  return (
    <div className={`group flex items-center gap-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
      {isOwn && deleteButton}

      <div className={`max-w-[80%] rounded-2xl px-3.5 py-2 md:max-w-[65%] ${bubbleStyle}`}>
        {deleted ? (
          <p className="flex items-center gap-1.5 text-[15px] italic leading-relaxed">
            <Ban size={14} className="shrink-0" />
            {isOwn ? 'You deleted this message' : 'This message was deleted'}
          </p>
        ) : (
          <p className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">{message.text}</p>
        )}
        <p
          className={`mt-0.5 text-right text-[11px] ${
            isOwn && !deleted ? 'text-brand-100' : 'text-slate-400 dark:text-slate-400'
          }`}
        >
          {formatTime(message.createdAt)}
        </p>
      </div>

      {!isOwn && deleteButton}
    </div>
  );
}