import { getAvatar } from '../utils/avatars';

const COLORS = [
  'bg-rose-500',
  'bg-amber-500',
  'bg-emerald-500',
  'bg-sky-500',
  'bg-violet-500',
  'bg-fuchsia-500',
  'bg-teal-500',
  'bg-indigo-500',
];

// Fallback for users who haven't picked an icon: first letter on a colour from their name.
const colorFor = (name = '') => COLORS[[...name].reduce((sum, ch) => sum + ch.charCodeAt(0), 0) % COLORS.length];

const SIZES = {
  sm: { box: 'h-9 w-9 text-sm', icon: 18 },
  md: { box: 'h-11 w-11 text-base', icon: 22 },
  lg: { box: 'h-20 w-20 text-3xl', icon: 40 },
};

// avatar: icon key chosen by the user (optional). online: true/false shows a status dot.
export default function Avatar({ name, avatar, size = 'md', online }) {
  const chosen = getAvatar(avatar);
  const { box, icon } = SIZES[size];

  return (
    <div className="relative shrink-0">
      <div
        className={`flex items-center justify-center rounded-full font-semibold uppercase text-white ${box} ${
          chosen ? chosen.bg : colorFor(name)
        }`}
        aria-hidden="true"
      >
        {chosen ? <chosen.Icon size={icon} strokeWidth={2} /> : name?.[0] || '?'}
      </div>
      {online !== undefined && (
        <span
          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-white dark:ring-slate-900 ${
            online ? 'bg-emerald-500' : 'bg-slate-400'
          }`}
          title={online ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
}