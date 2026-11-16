import { Menu, Search, User, Sun, Moon } from 'lucide-react';

export default function Header({ onMenuClick, searchQuery, onSearchChange, theme, onToggleTheme }) {
  return (
    <header className="h-16 border-b border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black flex items-center gap-3 px-4 md:px-6 shrink-0">
      <button
        onClick={onMenuClick}
        className="md:hidden p-2 -ml-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800"
        aria-label="Open menu"
      >
        <Menu size={20} aria-hidden="true" />
      </button>

      <div className="flex-1 max-w-md relative">
        <label htmlFor="tool-search" className="sr-only">
          Search tools
        </label>
        <Search size={16} aria-hidden="true" className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400 pointer-events-none" />
        <input
          id="tool-search"
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="Search tools..."
          className="w-full pl-9 pr-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-accent focus:outline-none text-sm text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400"
        />
      </div>

      <button
        onClick={onToggleTheme}
        className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 text-neutral-600 dark:text-neutral-300"
        aria-label="Toggle theme"
        title="Toggle theme"
      >
        {theme === 'light' ? <Moon size={18} aria-hidden="true" /> : <Sun size={18} aria-hidden="true" />}
      </button>

      <div className="flex items-center gap-2 pl-3 border-l border-neutral-200 dark:border-neutral-800">
        <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-neutral-700 flex items-center justify-center shrink-0">
          <User size={16} aria-hidden="true" />
        </div>
        <span className="hidden sm:block text-sm font-semibold text-neutral-900 dark:text-neutral-100">
          Local User
        </span>
      </div>
    </header>
  );
}
