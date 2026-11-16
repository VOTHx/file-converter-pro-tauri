import { useState, useCallback, useEffect } from 'react';
import { Copy, Download, Loader2 } from 'lucide-react';
import { useConversionStats } from '../hooks/useConversionStats.js';
import { useConversionHistory } from '../hooks/useConversionHistory.js';
import { useToast } from '../hooks/useToast.jsx';
import SplitPanel from '../components/SplitPanel.jsx';

const MODES = [
  { value: 'text-to-json', label: 'Text → JSON' },
  { value: 'json-to-text', label: 'JSON → Text' },
  { value: 'csv-to-json', label: 'CSV → JSON' },
  { value: 'json-to-csv', label: 'JSON → CSV' },
  { value: 'json-to-xml', label: 'JSON → XML' },
  { value: 'xml-to-json', label: 'XML → JSON' },
  { value: 'text-to-base64', label: 'Text → Base64' },
  { value: 'base64-to-text', label: 'Base64 → Text' },
  { value: 'json-to-yaml', label: 'JSON → YAML' },
  { value: 'yaml-to-json', label: 'YAML → JSON' },
];

const EXTENSIONS = {
  'text-to-json': 'json', 'json-to-text': 'txt', 'csv-to-json': 'json',
  'json-to-csv': 'csv', 'json-to-xml': 'xml', 'xml-to-json': 'json',
  'text-to-base64': 'txt', 'base64-to-text': 'txt',
  'json-to-yaml': 'yaml', 'yaml-to-json': 'json',
};

const JSON_OUTPUT_MODES = new Set(['text-to-json', 'csv-to-json', 'xml-to-json', 'yaml-to-json']);

// Minimal indenter for our generated XML — the Rust backend emits it on one
// line, this is purely a display nicety, not a full XML formatter.
function formatXml(xml) {
  const PADDING = '  ';
  let pad = 0;
  return xml
    .replace(/>\s*</g, '><')
    .split(/(?=<)/)
    .map((node) => {
      if (/^<\//.test(node)) pad = Math.max(pad - 1, 0);
      const line = PADDING.repeat(pad) + node;
      if (/^<[^/!?][^>]*[^/]>$/.test(node)) pad += 1;
      return line;
    })
    .join('\n')
    .trim();
}

function autoFormatOutput(raw, mode) {
  if (!raw) return raw;
  if (JSON_OUTPUT_MODES.has(mode)) {
    try {
      return JSON.stringify(JSON.parse(raw), null, 2);
    } catch {
      return raw;
    }
  }
  if (mode === 'json-to-xml') {
    try {
      return formatXml(raw);
    } catch {
      return raw;
    }
  }
  return raw;
}

export default function TextDataPage() {
  const [mode, setMode] = useState('text-to-json');
  const [input, setInput] = useState('');
  const [output, setOutput] = useState('');
  const [isConverting, setIsConverting] = useState(false);
  const { recordConversion } = useConversionStats();
  const { addEntry } = useConversionHistory();
  const { showToast } = useToast();

  const handleConvert = useCallback(async () => {
    setIsConverting(true);
    try {
      const result = await window.__TAURI__.tauri.invoke('convert_text', { mode, input });
      setOutput(autoFormatOutput(result, mode));
      recordConversion('text');
      addEntry('text', MODES.find((m) => m.value === mode)?.label);
      showToast('Conversion complete');
    } catch (err) {
      setOutput('');
      showToast('Error: ' + err, 'error');
    } finally {
      setIsConverting(false);
    }
  }, [mode, input, recordConversion, addEntry, showToast]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    try {
      await navigator.clipboard.writeText(output);
      showToast('Copied to clipboard');
    } catch (err) {
      showToast('Copy failed: ' + err, 'error');
    }
  }, [output, showToast]);

  const handleDownload = useCallback(async () => {
    if (!output) return;
    try {
      const ext = EXTENSIONS[mode] || 'txt';
      const path = await window.__TAURI__.dialog.save({ defaultPath: `output.${ext}` });
      if (!path) return;
      await window.__TAURI__.tauri.invoke('write_text_file', { path, content: output });
      showToast('Saved to ' + path);
    } catch (err) {
      showToast('Save failed: ' + err, 'error');
    }
  }, [output, mode, showToast]);

  // Scoped to this page via mount/unmount — no need to check which section
  // is active, since the listener only exists while this component is rendered.
  useEffect(() => {
    const handler = (e) => {
      const ctrlOrCmd = e.ctrlKey || e.metaKey;
      if (ctrlOrCmd && e.key === 'Enter') {
        e.preventDefault();
        handleConvert();
      } else if (ctrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleConvert, handleCopy]);

  return (
    <div className="p-6 md:p-8">
      <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-1">
        Text & Data Converter
      </h1>
      <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm">
        Drag the divider between panels to resize. Auto-detect and the legacy history list still
        aren't ported — this phase was about the workspace itself, not new conversions.
      </p>

      <select
        value={mode}
        onChange={(e) => setMode(e.target.value)}
        className="mb-4 px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-accent focus:outline-none text-sm text-neutral-900 dark:text-neutral-100"
      >
        {MODES.map((m) => (
          <option key={m.value} value={m.value}>
            {m.label}
          </option>
        ))}
      </select>

      <SplitPanel
        left={
          <div>
            <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-2">
              Input
            </label>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Paste content here..."
              className="w-full h-64 font-mono text-sm p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-accent focus:outline-none resize-y text-neutral-900 dark:text-neutral-100"
            />
          </div>
        }
        right={
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
                Output
              </label>
              <div className="flex gap-1">
                <button
                  onClick={handleCopy}
                  disabled={!output}
                  title="Copy (Ctrl+Shift+C)"
                  className="p-1.5 rounded-md text-neutral-500 dark:text-neutral-400 hover:text-accent hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Copy size={15} />
                </button>
                <button
                  onClick={handleDownload}
                  disabled={!output}
                  title="Download"
                  className="p-1.5 rounded-md text-neutral-500 dark:text-neutral-400 hover:text-accent hover:bg-neutral-100 dark:hover:bg-neutral-800 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <Download size={15} />
                </button>
              </div>
            </div>
            <textarea
              value={output}
              readOnly
              placeholder="Result appears here..."
              className="w-full h-64 font-mono text-sm p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent resize-y text-neutral-900 dark:text-neutral-100"
            />
          </div>
        }
      />

      <div className="flex items-center gap-3 mt-4">
        <button
          onClick={handleConvert}
          disabled={isConverting}
          className="px-6 py-2 rounded-full bg-accent text-black font-bold text-sm hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
        >
          {isConverting && <Loader2 size={14} className="animate-spin" />}
          {isConverting ? 'Converting...' : 'Convert'}
        </button>
        <span className="text-xs text-neutral-400 dark:text-neutral-500">
          Ctrl+Enter to convert · Ctrl+Shift+C to copy
        </span>
      </div>
    </div>
  );
}
