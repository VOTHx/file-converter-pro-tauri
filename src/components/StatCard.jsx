import Card from './Card.jsx';

export default function StatCard({ icon: Icon, label, value, sublabel }) {
  return (
    <Card className="flex items-start gap-4">
      <div className="w-10 h-10 rounded-md bg-accent/15 text-accent flex items-center justify-center shrink-0">
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-extrabold text-neutral-900 dark:text-white leading-tight truncate">
          {value}
        </div>
        <div className="text-sm text-neutral-500 dark:text-neutral-400">{label}</div>
        {sublabel && (
          <div className="text-xs text-neutral-400 dark:text-neutral-500 mt-1">{sublabel}</div>
        )}
      </div>
    </Card>
  );
}
