export default function ComingSoonSection({ icon: Icon, title, phase, onBack }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center p-8">
      <div className="w-14 h-14 rounded-full bg-accent/15 text-accent flex items-center justify-center mb-4">
        <Icon size={26} />
      </div>
      <h2 className="text-xl font-extrabold text-neutral-900 dark:text-white">{title}</h2>
      <p className="text-neutral-500 dark:text-neutral-400 mt-2 max-w-sm">
        This tool is fully built and working in the current app — it's being migrated into this
        new dashboard shell in {phase}.
      </p>
      <button
        onClick={onBack}
        className="mt-6 px-5 py-2 rounded-full bg-accent text-black font-bold text-sm hover:opacity-90"
      >
        Back to Dashboard
      </button>
    </div>
  );
}
