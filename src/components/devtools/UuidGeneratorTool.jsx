import { useState } from 'react';
import { Copy } from 'lucide-react';
import Card from '../Card.jsx';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.js';

export default function UuidGeneratorTool() {
  const [uuid, setUuid] = useState('');
  const copy = useCopyToClipboard();

  return (
    <Card>
      <h2 className="font-bold text-sm text-neutral-900 dark:text-white mb-3">UUID Generator</h2>
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setUuid(crypto.randomUUID())}
          className="px-4 py-1.5 rounded-full bg-accent text-black font-bold text-xs hover:opacity-90"
        >
          Generate UUID
        </button>
        <button
          onClick={() => copy(uuid)}
          disabled={!uuid}
          className="px-4 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
        >
          <Copy size={12} aria-hidden="true" /> Copy
        </button>
      </div>
      <label htmlFor="uuid-output" className="sr-only">
        Generated UUID
      </label>
      <input
        id="uuid-output"
        readOnly
        value={uuid}
        placeholder="Click Generate..."
        className="w-full font-mono text-sm px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent text-neutral-900 dark:text-neutral-100"
      />
    </Card>
  );
}
