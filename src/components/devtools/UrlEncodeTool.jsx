import { useState } from 'react';
import { Copy } from 'lucide-react';
import Card from '../Card.jsx';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.js';

export default function UrlEncodeTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const copy = useCopyToClipboard();

  return (
    <Card>
      <h2 className="font-bold text-sm text-neutral-900 dark:text-white mb-3">URL Encode / Decode</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Hello World"
            className="w-full h-24 font-mono text-sm p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-accent focus:outline-none resize-y text-neutral-900 dark:text-neutral-100"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Output</label>
          <textarea
            value={output}
            readOnly
            className="w-full h-24 font-mono text-sm p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent resize-y text-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>
      <div className="flex gap-2 mt-3">
        <button onClick={() => setOutput(encodeURIComponent(input))} className="px-4 py-1.5 rounded-full bg-accent text-black font-bold text-xs hover:opacity-90">
          Encode
        </button>
        <button
          onClick={() => {
            try {
              setOutput(decodeURIComponent(input));
            } catch {
              setOutput('');
            }
          }}
          className="px-4 py-1.5 rounded-full bg-accent text-black font-bold text-xs hover:opacity-90"
        >
          Decode
        </button>
        <button
          onClick={() => copy(output)}
          disabled={!output}
          className="px-4 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
        >
          <Copy size={12} aria-hidden="true" /> Copy
        </button>
      </div>
    </Card>
  );
}
