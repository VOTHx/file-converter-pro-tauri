import { BarChart3, CalendarDays, Star, Files } from 'lucide-react';
import ToolCard from '../components/ToolCard.jsx';
import StatCard from '../components/StatCard.jsx';
import { useConversionStats } from '../hooks/useConversionStats.js';
import { useFavorites } from '../hooks/useFavorites.js';
import { TOOLS, TOOL_LABELS } from '../toolsMeta.js';

export default function Dashboard({ searchQuery, onNavigate }) {
  const { stats, todayCount, favoriteTool, favoriteToolCount } = useConversionStats();
  const { favorites, isFavorite, toggleFavorite } = useFavorites();

  const query = searchQuery.trim().toLowerCase();
  const filtered = query
    ? TOOLS.filter(
        (t) => t.title.toLowerCase().includes(query) || t.description.toLowerCase().includes(query)
      )
    : TOOLS;

  // Pinned is deliberately unaffected by the search box — favorites are meant
  // to always be one glance away, not something you have to search for.
  const pinned = TOOLS.filter((t) => favorites.includes(t.id));

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white">Welcome back</h1>
      <p className="text-neutral-500 dark:text-neutral-400 mt-1 mb-6">Pick a tool to get started.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard icon={BarChart3} label="Total Conversions" value={stats.total} />
        <StatCard icon={CalendarDays} label="Today's Conversions" value={todayCount} />
        <StatCard
          icon={Star}
          label="Favorite Tool"
          value={favoriteTool ? TOOL_LABELS[favoriteTool] || favoriteTool : '—'}
          sublabel={
            favoriteTool
              ? `${favoriteToolCount} conversion${favoriteToolCount === 1 ? '' : 's'}`
              : 'No conversions yet'
          }
        />
        <StatCard icon={Files} label="Files Processed" value={stats.filesProcessed} />
      </div>

      {pinned.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wide">
            Pinned
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {pinned.map((tool) => (
              <ToolCard
                key={tool.id}
                id={tool.id}
                icon={tool.icon}
                title={tool.title}
                description={tool.description}
                isFavorite={isFavorite(tool.id)}
                onOpen={onNavigate}
                onToggleFavorite={toggleFavorite}
              />
            ))}
          </div>
        </div>
      )}

      <h2 className="text-sm font-bold text-neutral-500 dark:text-neutral-400 mb-3 uppercase tracking-wide">
        All Tools
      </h2>
      {filtered.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No tools match "{searchQuery}".
        </p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {filtered.map((tool) => (
            <ToolCard
              key={tool.id}
              id={tool.id}
              icon={tool.icon}
              title={tool.title}
              description={tool.description}
              isFavorite={isFavorite(tool.id)}
              onOpen={onNavigate}
              onToggleFavorite={toggleFavorite}
            />
          ))}
        </div>
      )}
    </div>
  );
}
