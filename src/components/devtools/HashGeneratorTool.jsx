import { useState } from 'react';
import { Copy } from 'lucide-react';
import Card from '../Card.jsx';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.js';
import { md5, subtleHash } from '../../utils/hash.js';

export default function HashGeneratorTool() {
  const [input, setInput] = useState('');
  const [algo, setAlgo] = useState('MD5');
  const [output, setOutput] = useState('');
  const copy = useCopyToClipboard();

  const generate = async () => {
    const result = algo === 'MD5' ? md5(input) : await subtleHash(algo, input);
    setOutput(result);
  };

  return (
    <Card>
      <h2 className="font-bold text-sm text-neutral-900 dark:text-white mb-3">Hash Generator</h2>
      <label htmlFor="hash-input" className="sr-only">
        Text to hash
      </label>
      <textarea
        id="hash-input"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder="Text to hash..."
        className="w-full h-24 font-mono text-sm p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-accent focus:outline-none resize-y text-neutral-900 dark:text-neutral-100 mb-3"
      />
      <div className="flex gap-2 mb-3">
        <label htmlFor="hash-algo" className="sr-only">
          Hash algorithm
        </label>
        <select
          id="hash-algo"
          value={algo}
          onChange={(e) => setAlgo(e.target.value)}
          className="px-3 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent text-sm text-neutral-900 dark:text-neutral-100"
        >
          <option value="MD5">MD5</option>
          <option value="SHA-256">SHA-256</option>
          <option value="SHA-512">SHA-512</option>
        </select>
        <button onClick={generate} className="px-4 py-1.5 rounded-full bg-accent text-black font-bold text-xs hover:opacity-90">
          Generate Hash
        </button>
      </div>
      <div className="flex gap-2 items-center">
        <label htmlFor="hash-output" className="sr-only">
          Hash result
        </label>
        <input
          id="hash-output"
          readOnly
          value={output}
          placeholder="Result appears here..."
          className="flex-1 font-mono text-sm px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent text-neutral-900 dark:text-neutral-100"
        />
        <button
          onClick={() => copy(output)}
          disabled={!output}
          aria-label="Copy hash"
          className="p-2 rounded-md border border-neutral-300 dark:border-neutral-700 text-neutral-700 dark:text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Copy size={14} aria-hidden="true" />
        </button>
      </div>
    </Card>
  );
}
