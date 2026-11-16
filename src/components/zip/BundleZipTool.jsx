import { useState } from 'react';
import Card from '../Card.jsx';
import { useToast } from '../../hooks/useToast.jsx';

export default function BundleZipTool() {
  const [files, setFiles] = useState([]);
  const [zipName, setZipName] = useState('bundle.zip');
  const [isRunning, setIsRunning] = useState(false);
  const { showToast } = useToast();

  const pickFiles = async () => {
    const picked = await window.__TAURI__.dialog.open({ multiple: true });
    setFiles(picked ? (Array.isArray(picked) ? picked : [picked]) : []);
  };

  const run = async () => {
    if (!files.length) return showToast('Pick files to bundle first.', 'error');
    const outDir = await window.__TAURI__.dialog.open({ directory: true });
    if (!outDir) return;
    setIsRunning(true);
    try {
      const outPath = await window.__TAURI__.tauri.invoke('files_to_zip', {
        filePaths: files,
        outDir,
        zipName: zipName || 'bundle.zip',
      });
      showToast(`Created ${outPath}`);
    } catch (err) {
      showToast('Error: ' + err, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <h2 className="font-bold text-sm text-neutral-900 dark:text-white mb-3">Bundle files into a .zip</h2>
      <button
        onClick={pickFiles}
        className="px-4 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300"
      >
        Choose files to bundle
      </button>
      {files.length > 0 && (
        <ul className="text-xs text-neutral-500 dark:text-neutral-400 mt-2 max-h-24 overflow-y-auto">
          {files.map((f) => (
            <li key={f} className="truncate">
              {f}
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-center gap-2 mt-3">
        <label htmlFor="zip-name" className="sr-only">
          Output zip file name
        </label>
        <input
          id="zip-name"
          value={zipName}
          onChange={(e) => setZipName(e.target.value)}
          placeholder="output-name.zip"
          className="w-48 px-3 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent text-sm text-neutral-900 dark:text-neutral-100"
        />
        <button
          onClick={run}
          disabled={isRunning}
          className="px-4 py-1.5 rounded-full bg-accent text-black font-bold text-xs hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Creating...' : 'Create Zip'}
        </button>
      </div>
    </Card>
  );
}
