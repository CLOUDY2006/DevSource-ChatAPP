import { useState } from 'react';
import { Check, LogOut, X } from 'lucide-react';
import Avatar from './Avatar';
import ThemeToggle from './ThemeToggle';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../api/axios';
import { AVATARS } from '../utils/avatars';
import { formatMemberSince } from '../utils/time';

export default function ProfileModal({ onClose }) {
  const { user, logout, updateProfile } = useAuth();
  const [username, setUsername] = useState(user.username);
  const [avatar, setAvatar] = useState(user.avatar);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const changed = username.trim().toLowerCase() !== user.username || avatar !== user.avatar;

  const save = async (e) => {
    e.preventDefault();
    setError('');
    setSaved(false);
    setSaving(true);
    try {
      const changes = {};
      if (username.trim().toLowerCase() !== user.username) changes.username = username;
      if (avatar !== user.avatar) changes.avatar = avatar;
      await updateProfile(changes);
      setSaved(true);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label="Your profile"
    >
      <div
        className="max-h-full w-full max-w-sm overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-900"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-end">
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <div className="flex flex-col items-center text-center">
          <Avatar name={username || user.username} avatar={avatar} size="lg" />
          <p className="mt-3 text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Member since {formatMemberSince(user.createdAt)}
          </p>
        </div>

        <form onSubmit={save} className="mt-5 space-y-4">
          <div>
            <p className="mb-2 text-sm font-medium">Profile icon</p>
            <div className="grid grid-cols-3 gap-3" role="radiogroup" aria-label="Profile icon">
              {AVATARS.map(({ id, Icon, bg }) => {
                const selected = avatar === id;
                return (
                  <button
                    type="button"
                    key={id}
                    role="radio"
                    aria-checked={selected}
                    aria-label={id}
                    onClick={() => {
                      setAvatar(id);
                      setSaved(false);
                    }}
                    className={`relative mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white transition focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 ${bg} ${
                      selected
                        ? 'ring-4 ring-brand-500/40 ring-offset-2 ring-offset-white dark:ring-offset-slate-900'
                        : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    <Icon size={26} />
                    {selected && (
                      <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-brand-600 ring-2 ring-white dark:ring-slate-900">
                        <Check size={12} strokeWidth={3} />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label htmlFor="profile-username" className="mb-1.5 block text-sm font-medium">
              Username
            </label>
            <input
              id="profile-username"
              className="input"
              value={username}
              minLength={3}
              maxLength={20}
              required
              onChange={(e) => {
                setUsername(e.target.value);
                setSaved(false);
              }}
            />
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              3–20 characters: letters, numbers, underscores.
            </p>
          </div>

          {error && (
            <p role="alert" className="text-sm text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
          {saved && !changed && <p className="text-sm text-emerald-600 dark:text-emerald-400">Profile saved.</p>}

          <button type="submit" disabled={!changed || saving} className="btn-primary w-full">
            {saving ? 'Saving…' : 'Save changes'}
          </button>
        </form>

        <div className="mt-5 flex items-center justify-between rounded-xl bg-slate-100 px-4 py-2.5 dark:bg-slate-800">
          <span className="text-sm font-medium">Appearance</span>
          <ThemeToggle />
        </div>

        <button
          onClick={logout}
          className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 py-2.5 text-sm font-semibold text-red-600 transition hover:bg-red-50 dark:border-slate-700 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          <LogOut size={16} /> Log out
        </button>
      </div>
    </div>
  );
}