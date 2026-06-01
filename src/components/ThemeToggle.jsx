import { Sun, Moon } from 'lucide-react';

export default function ThemeToggle({ theme, onToggle, className = '' }) {
  return (
    <button
      onClick={onToggle}
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      className={`p-1.5 rounded-md transition-colors text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:text-zinc-400 dark:hover:text-zinc-200 dark:hover:bg-zinc-900 ${className}`}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
