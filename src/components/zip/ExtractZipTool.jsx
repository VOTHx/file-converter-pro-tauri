import { useState } from 'react';
import Card from '../Card.jsx';
import { useToast } from '../../hooks/useToast.jsx';

export default function ExtractZipTool() {
  const [file, setFile] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const { showToast } = useToast();

  const pickFile = async () => {
    const picked = await window.__TAURI__.dialog.open({
      filters: [{ name: 'Zip', extensions: ['zip'] }],
    });
    setFile(picked || null);
  };

  const run = async () => {
    if (!file) return showToast('Pick a .zip file first.', 'error');
    const outDir = await window.__TAURI__.dialog.open({ directory: true });
    if (!outDir) return;
    setIsRunning(true);
    try {
      const result = await window.__TAURI__.tauri.invoke('extract_zip', { zipPath: file, outDir });
      showToast(`Extracted ${result.entries.length} item(s) to ${result.out_path}`);
    } catch (err) {
      showToast('Error: ' + err, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <h2 className="font-bold text-sm text-neutral-900 dark:text-white mb-3">Extract a .zip</h2>
      <button
        onClick={pickFile}
        className="px-4 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300"
      >
        Choose .zip file
      </button>
      {file && <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 truncate">{file}</p>}
      <button
        onClick={run}
        disabled={isRunning}
        className="mt-3 px-4 py-1.5 rounded-full bg-accent text-black font-bold text-xs hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isRunning ? 'Extracting...' : 'Extract'}
      </button>
    </Card>
  );
}
