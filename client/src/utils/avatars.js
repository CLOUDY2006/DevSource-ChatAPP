import { Cat, Dog, Bird, Fish, Rabbit, Squirrel, Turtle, Rat, Snail } from 'lucide-react';

// Keys must match AVATAR_KEYS in server/src/models/User.js.
export const AVATARS = [
  { id: 'cat', Icon: Cat, bg: 'bg-amber-500' },
  { id: 'dog', Icon: Dog, bg: 'bg-sky-500' },
  { id: 'bird', Icon: Bird, bg: 'bg-rose-500' },
  { id: 'fish', Icon: Fish, bg: 'bg-teal-500' },
  { id: 'rabbit', Icon: Rabbit, bg: 'bg-fuchsia-500' },
  { id: 'squirrel', Icon: Squirrel, bg: 'bg-orange-500' },
  { id: 'turtle', Icon: Turtle, bg: 'bg-emerald-500' },
  { id: 'rat', Icon: Rat, bg: 'bg-violet-500' },
  { id: 'snail', Icon: Snail, bg: 'bg-indigo-500' },
];

export const getAvatar = (id) => AVATARS.find((a) => a.id === id);