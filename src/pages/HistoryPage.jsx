import { useState } from 'react';
import { Trash2, History as HistoryIcon } from 'lucide-react';
import { useConversionHistory } from '../hooks/useConversionHistory.js';
import { useIsDesktop } from '../hooks/useIsDesktop.js';
import { TOOL_LABELS, TOOL_ICONS } from '../toolsMeta.js';

function formatTimestamp(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

function HistoryRow({ entry, onDelete, isDesktop }) {
  const Icon = TOOL_ICONS[entry.toolId];
  const label = TOOL_LABELS[entry.toolId] || entry.toolId;

  if (isDesktop) {
    return (
      <tr className="border-t border-neutral-200 dark:border-neutral-800">
        <td className="px-4 py-3">
          <div className="flex items-center gap-2">
            {Icon && <Icon size={16} className="text-accent shrink-0" aria-hidden="true" />}
            <span className="font-semibold text-neutral-900 dark:text-white">{label}</span>
            {entry.detail && (
              <span className="text-neutral-400 dark:text-neutral-500">— {entry.detail}</span>
            )}
          </div>
        </td>
        <td className="px-4 py-3 text-neutral-500 dark:text-neutral-400">
          {formatTimestamp(entry.timestamp)}
        </td>
        <td className="px-4 py-3 text-right">
          <button
            onClick={onDelete}
            aria-label={`Delete ${label} entry from ${formatTimestamp(entry.timestamp)}`}
            className="p-1.5 rounded-md text-neutral-400 hover:text-red-500 hover:bg-neutral-100 dark:hover:bg-neutral-800"
          >
            <Trash2 size={16} aria-hidden="true" />
          </button>
        </td>
      </tr>
    );
  }

  return (
    <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg p-4 bg-white dark:bg-neutral-900 flex items-start justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0">
        {Icon && <Icon size={18} className="text-accent shrink-0 mt-0.5" aria-hidden="true" />}
        <div className="min-w-0">
          <div className="font-semibold text-neutral-900 dark:text-white truncate">{label}</div>
          {entry.detail && (
            <div className="text-sm text-neutral-500 dark:text-neutral-400 truncate">{entry.detail}</div>
          )}
          <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">
            {formatTimestamp(entry.timestamp)}
          </div>
        </div>
      </div>
      <button
        onClick={onDelete}
        aria-label={`Delete ${label} entry from ${formatTimestamp(entry.timestamp)}`}
        className="p-1.5 rounded-md text-neutral-400 hover:text-red-500 shrink-0"
      >
        <Trash2 size={16} aria-hidden="true" />
      </button>
    </div>
  );
}

export default function HistoryPage() {
  const { history, deleteEntry, clearHistory, maxEntries } = useConversionHistory();
  const [query, setQuery] = useState('');
  const isDesktop = useIsDesktop();

  const q = query.trim().toLowerCase();
  const filtered = q
    ? history.filter((e) => {
        const label = TOOL_LABELS[e.toolId] || e.toolId;
        return label.toLowerCase().includes(q) || (e.detail || '').toLowerCase().includes(q);
      })
    : history;

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white">Conversion History</h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">
            {history.length} of up to {maxEntries} conversions, stored locally.
          </p>
        </div>
        <div className="flex gap-2">
          <label htmlFor="history-search" className="sr-only">
            Search history
          </label>
          <input
            id="history-search"
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search history..."
            className="px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-accent focus:outline-none text-sm text-neutral-900 dark:text-neutral-100"
          />
          <button
            onClick={clearHistory}
            disabled={history.length === 0}
            className="px-4 py-2 rounded-md border border-neutral-300 dark:border-neutral-700 text-sm font-semibold text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Clear History
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-neutral-500 dark:text-neutral-400">
          <HistoryIcon className="mx-auto mb-3 opacity-50" size={32} aria-hidden="true" />
          {history.length === 0 ? 'No conversions yet.' : `No history matches "${query}".`}
        </div>
      ) : isDesktop ? (
        <div className="border border-neutral-200 dark:border-neutral-800 rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-left">
              <tr>
                <th scope="col" className="px-4 py-3 font-semibold">Tool</th>
                <th scope="col" className="px-4 py-3 font-semibold">When</th>
                <th scope="col" className="px-4 py-3 font-semibold w-10">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((entry) => (
                <HistoryRow key={entry.id} entry={entry} onDelete={() => deleteEntry(entry.id)} isDesktop />
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map((entry) => (
            <HistoryRow key={entry.id} entry={entry} onDelete={() => deleteEntry(entry.id)} isDesktop={false} />
          ))}
        </div>
      )}
    </div>
  );
}
