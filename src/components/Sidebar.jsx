import { useEffect, useRef } from 'react';
import { LayoutDashboard, FileJson, Image as ImageIcon, Archive, Wrench, History, X } from 'lucide-react';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'text', label: 'Text & Data', icon: FileJson },
  { id: 'images', label: 'Images', icon: ImageIcon },
  { id: 'zip', label: 'Zip', icon: Archive },
  { id: 'devtools', label: 'Dev Tools', icon: Wrench },
  { id: 'history', label: 'History', icon: History },
];

function Brand() {
  return (
    <div className="px-4 pb-5 flex items-center gap-2 font-extrabold text-lg text-neutral-900 dark:text-white">
      <span className="inline-block w-7 h-7 rounded-full bg-accent shrink-0" aria-hidden="true" />
      Converter Pro
    </div>
  );
}

function NavList({ activeSection, onNavigate }) {
  return (
    <nav className="flex flex-col gap-1 px-2" aria-label="Main">
      {NAV_ITEMS.map(({ id, label, icon: Icon }) => {
        const active = activeSection === id;
        return (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            aria-current={active ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-left transition-colors border-l-2 ${
              active
                ? 'border-accent bg-accent/10 text-neutral-900 dark:text-white'
                : 'border-transparent text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800'
            }`}
          >
            <Icon size={18} aria-hidden="true" />
            {label}
          </button>
        );
      })}
    </nav>
  );
}

export default function Sidebar({ activeSection, onNavigate, isOpen, onClose }) {
  const closeButtonRef = useRef(null);

  // Focus the close button when the drawer opens, and let Escape close it —
  // without this, a modal-like overlay opens with focus left behind on
  // whatever triggered it, which is a real accessibility gap for a drawer.
  useEffect(() => {
    if (!isOpen) return;
    closeButtonRef.current?.focus();
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <>
      {/* Desktop sidebar — always visible at md breakpoint and up */}
      <aside className="hidden md:flex md:w-60 md:flex-col md:shrink-0 border-r border-neutral-200 dark:border-neutral-800 bg-white dark:bg-black py-5">
        <Brand />
        <NavList activeSection={activeSection} onNavigate={onNavigate} />
      </aside>

      {/* Mobile drawer — overlay + slide-in panel, only rendered when open */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex" role="dialog" aria-modal="true" aria-label="Navigation">
          <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
          <aside className="relative z-50 w-64 h-full bg-white dark:bg-black py-5 flex flex-col shadow-xl">
            <div className="flex items-center justify-between pr-4">
              <Brand />
              <button
                ref={closeButtonRef}
                onClick={onClose}
                aria-label="Close menu"
                className="p-2 rounded-md hover:bg-neutral-100 dark:hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-accent"
              >
                <X size={18} aria-hidden="true" />
              </button>
            </div>
            <NavList
              activeSection={activeSection}
              onNavigate={(id) => { onNavigate(id); onClose(); }}
            />
          </aside>
        </div>
      )}
    </>
  );
}
