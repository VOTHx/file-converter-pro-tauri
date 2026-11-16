import { useState } from 'react';
import { Copy } from 'lucide-react';
import Card from '../Card.jsx';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.js';

function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === 'object') {
    return Object.keys(value)
      .sort()
      .reduce((acc, k) => {
        acc[k] = sortKeysDeep(value[k]);
        return acc;
      }, {});
  }
  return value;
}

export default function JsonFormatterTool() {
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [status, setStatus] = useState(null);
  const copy = useCopyToClipboard();

  const run = (transform, successMsg) => {
    try {
      const obj = JSON.parse(input);
      setOutput(transform(obj));
      setStatus({ ok: true, msg: successMsg });
    } catch (err) {
      setStatus({ ok: false, msg: 'Invalid JSON: ' + err.message });
    }
  };

  const validate = () => {
    try {
      JSON.parse(input);
      setStatus({ ok: true, msg: 'Valid JSON.' });
    } catch (err) {
      setStatus({ ok: false, msg: 'Invalid JSON: ' + err.message });
    }
  };

  return (
    <Card>
      <h2 className="font-bold text-sm text-neutral-900 dark:text-white mb-3">JSON Formatter</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Input</label>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder='{"z":1,"a":2}'
            className="w-full h-32 font-mono text-sm p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-accent focus:outline-none resize-y text-neutral-900 dark:text-neutral-100"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Output</label>
          <textarea
            value={output}
            readOnly
            className="w-full h-32 font-mono text-sm p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent resize-y text-neutral-900 dark:text-neutral-100"
          />
        </div>
      </div>
      <div className="flex flex-wrap gap-2 mt-3">
        <button onClick={() => run((o) => JSON.stringify(o, null, 2), 'Pretty printed.')} className="px-4 py-1.5 rounded-full bg-accent text-black font-bold text-xs hover:opacity-90">
          Pretty Print
        </button>
        <button onClick={() => run((o) => JSON.stringify(o), 'Minified.')} className="px-4 py-1.5 rounded-full bg-accent text-black font-bold text-xs hover:opacity-90">
          Minify
        </button>
        <button onClick={validate} className="px-4 py-1.5 rounded-full bg-accent text-black font-bold text-xs hover:opacity-90">
          Validate
        </button>
        <button onClick={() => run((o) => JSON.stringify(sortKeysDeep(o), null, 2), 'Sorted.')} className="px-4 py-1.5 rounded-full bg-accent text-black font-bold text-xs hover:opacity-90">
          Sort Keys
        </button>
        <button
          onClick={() => copy(output)}
          disabled={!output}
          className="px-4 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
        >
          <Copy size={12} aria-hidden="true" /> Copy
        </button>
      </div>
      {status && (
        <p className={`mt-2 text-xs font-semibold ${status.ok ? 'text-accent' : 'text-red-500'}`}>{status.msg}</p>
      )}
    </Card>
  );
}
