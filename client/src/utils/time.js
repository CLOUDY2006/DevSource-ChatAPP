const sameDay = (a, b) => a.toDateString() === b.toDateString();

const yesterdayOf = (d) => {
  const y = new Date(d);
  y.setDate(y.getDate() - 1);
  return y;
};

// 3:45 PM
export const formatTime = (iso) =>
  new Date(iso).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });

// Separator label inside a conversation: Today / Yesterday / Mon, 5 Oct
export function formatDayLabel(iso) {
  const d = new Date(iso);
  const now = new Date();
  if (sameDay(d, now)) return 'Today';
  if (sameDay(d, yesterdayOf(now))) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });
}

// Sidebar timestamp: time today, "Yesterday", otherwise a short date
export function formatListTime(iso) {
  const d = new Date(iso);
  const now = new Date();
  if (sameDay(d, now)) return formatTime(iso);
  if (sameDay(d, yesterdayOf(now))) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}

export function formatLastSeen(iso) {
  if (!iso) return 'Offline';
  const d = new Date(iso);
  const now = new Date();
  if (sameDay(d, now)) return `Last seen today at ${formatTime(iso)}`;
  if (sameDay(d, yesterdayOf(now))) return `Last seen yesterday at ${formatTime(iso)}`;
  return `Last seen ${d.toLocaleDateString([], { day: 'numeric', month: 'short' })}`;
}

export const formatMemberSince = (iso) =>
  new Date(iso).toLocaleDateString([], { month: 'long', year: 'numeric' });
