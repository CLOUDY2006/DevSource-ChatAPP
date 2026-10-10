import { MessageCircle } from 'lucide-react';
import ThemeToggle from './ThemeToggle';

// Shared shell for the login and register screens.
export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="relative flex min-h-full items-center justify-center bg-slate-100 p-4 dark:bg-slate-950">
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-600 text-white">
            <MessageCircle size={22} />
          </span>
          <div>
            <h1 className="text-2xl font-bold leading-tight">{title}</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{subtitle}</p>
          </div>
        </div>
        {children}
        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400">{footer}</p>
      </div>
    </div>
  );
}
