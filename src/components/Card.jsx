export default function Card({ children, className = '' }) {
  return (
    <div
      className={`bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-5 ${className}`}
    >
      {children}
    </div>
  );
}
