import { useEffect } from 'react';

// Confirmation dialog: Delete for me / Delete for everyone / Cancel.
export default function DeleteMessageModal({
  message,
  canDeleteForEveryone,
  busy,
  error,
  onDeleteForMe,
  onDeleteForEveryone,
  onCancel,
}) {
  // Escape = Cancel
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onCancel();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-label="Delete message"
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold">Delete message?</h2>

        {!message.deletedForEveryone && (
          <p className="mt-3 line-clamp-3 break-words rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-600 dark:bg-slate-800 dark:text-slate-300">
            {message.text}
          </p>
        )}

        <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">
          {canDeleteForEveryone
            ? '"Delete for me" removes it from your chat only. "Delete for everyone" removes it for both of you.'
            : 'This removes the message from your chat only.'}
        </p>

        {error && (
          <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
            {error}
          </p>
        )}

        <div className="mt-5 flex flex-col gap-2">
          <button onClick={onDeleteForMe} disabled={busy} className="btn-primary w-full">
            Delete for me
          </button>
          {canDeleteForEveryone && (
            <button
              onClick={onDeleteForEveryone}
              disabled={busy}
              className="w-full rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Delete for everyone
            </button>
          )}
          <button
            onClick={onCancel}
            disabled={busy}
            className="w-full rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-semibold transition hover:bg-slate-100 disabled:opacity-60 dark:border-slate-700 dark:hover:bg-slate-800"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}