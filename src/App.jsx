import { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar.jsx';
import Header from './components/Header.jsx';
import ToastContainer from './components/ToastContainer.jsx';
import Dashboard from './pages/Dashboard.jsx';
import TextDataPage from './pages/TextDataPage.jsx';
import HistoryPage from './pages/HistoryPage.jsx';
import DevToolsPage from './pages/DevToolsPage.jsx';
import ImagesPage from './pages/ImagesPage.jsx';
import ZipPage from './pages/ZipPage.jsx';
import { ToastProvider } from './hooks/useToast.jsx';

// Same key the old vanilla UI used for its theme toggle, kept for continuity
// in case this ever reads the same localStorage profile.
const THEME_KEY = 'fcp-theme';

// All 6 sidebar sections are real pages now — every tool has been ported.
// ComingSoonSection.jsx is unused as of this change but left in place
// (src/pages/ComingSoonSection.jsx) in case a future new category needs the
// same "not built yet" pattern.
const PAGES = {
  dashboard: Dashboard,
  text: TextDataPage,
  images: ImagesPage,
  zip: ZipPage,
  devtools: DevToolsPage,
  history: HistoryPage,
};

export default function App() {
  const [activeSection, setActiveSection] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem(THEME_KEY) || 'dark');

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => setTheme((t) => (t === 'dark' ? 'light' : 'dark')), []);

  const navigate = useCallback((section) => {
    setActiveSection(section);
    setSidebarOpen(false);
  }, []);

  const ActivePage = PAGES[activeSection] || Dashboard;

  return (
    <ToastProvider>
      <div className="flex h-screen overflow-hidden bg-neutral-50 dark:bg-neutral-950 text-neutral-900 dark:text-neutral-100">
        <Sidebar
          activeSection={activeSection}
          onNavigate={navigate}
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <Header
            onMenuClick={() => setSidebarOpen(true)}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            theme={theme}
            onToggleTheme={toggleTheme}
          />

          <main className="flex-1 overflow-y-auto">
            {activeSection === 'dashboard' ? (
              <Dashboard searchQuery={searchQuery} onNavigate={navigate} />
            ) : (
              <ActivePage />
            )}
          </main>
        </div>

        <ToastContainer />
      </div>
    </ToastProvider>
  );
}
