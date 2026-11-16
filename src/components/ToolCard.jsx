import { memo } from 'react';
import { ArrowRight, Star } from 'lucide-react';
import Card from './Card.jsx';

// Memoized because Dashboard now passes stable onOpen/onToggleFavorite
// references (see Dashboard.jsx) — without that, memo would do nothing,
// since new function props on every render would still force a re-render
// here regardless.
function ToolCard({ id, icon: Icon, title, description, isFavorite, onOpen, onToggleFavorite }) {
  return (
    <Card className="flex flex-col gap-3 relative">
      <button
        onClick={(e) => {
          e.stopPropagation();
          onToggleFavorite(id);
        }}
        aria-label={isFavorite ? `Remove ${title} from favorites` : `Add ${title} to favorites`}
        title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
        className={`absolute top-3 right-3 p-1 rounded-md transition-colors ${
          isFavorite ? 'text-yellow-400' : 'text-neutral-400 hover:text-yellow-400'
        }`}
      >
        <Star size={16} fill={isFavorite ? 'currentColor' : 'none'} aria-hidden="true" />
      </button>

      <div className="w-10 h-10 rounded-md bg-accent/15 text-accent flex items-center justify-center">
        <Icon size={20} aria-hidden="true" />
      </div>
      <div className="pr-4">
        <h3 className="font-bold text-sm text-neutral-900 dark:text-white">{title}</h3>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 mt-1">{description}</p>
      </div>
      <button
        onClick={() => onOpen(id)}
        className="mt-auto inline-flex items-center gap-1 text-sm font-semibold text-accent hover:gap-2 transition-all self-start"
      >
        Open <ArrowRight size={14} aria-hidden="true" />
      </button>
    </Card>
  );
}

export default memo(ToolCard);
