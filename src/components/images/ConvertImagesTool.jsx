import { useState } from 'react';
import Card from '../Card.jsx';
import ImageThumbnailList from './ImageThumbnailList.jsx';
import { useToast } from '../../hooks/useToast.jsx';

const FORMATS = ['png', 'jpg', 'webp', 'bmp'];

export default function ConvertImagesTool() {
  const [files, setFiles] = useState([]);
  const [format, setFormat] = useState('png');
  const [isRunning, setIsRunning] = useState(false);
  const { showToast } = useToast();

  const pickFiles = async () => {
    const picked = await window.__TAURI__.dialog.open({
      multiple: true,
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] }],
    });
    setFiles(picked ? (Array.isArray(picked) ? picked : [picked]) : []);
  };

  const run = async () => {
    if (!files.length) return showToast('Pick files first.', 'error');
    const outDir = await window.__TAURI__.dialog.open({ directory: true });
    if (!outDir) return;
    setIsRunning(true);
    try {
      const results = await window.__TAURI__.tauri.invoke('convert_images', {
        filePaths: files,
        targetFormat: format,
        outDir,
      });
      const failed = results.filter((r) => !r.ok);
      showToast(
        failed.length === 0
          ? `Converted ${results.length} file(s) to ${outDir}`
          : `${failed.length} of ${results.length} failed.`,
        failed.length === 0 ? 'success' : 'error'
      );
    } catch (err) {
      showToast('Error: ' + err, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <h2 className="font-bold text-sm text-neutral-900 dark:text-white mb-3">Convert Images</h2>
      <button
        onClick={pickFiles}
        className="px-4 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300"
      >
        Choose image files
      </button>
      <ImageThumbnailList files={files} />
      <div className="flex flex-wrap items-center gap-3 mt-3">
        <label htmlFor="convert-format" className="text-xs font-bold text-neutral-500 dark:text-neutral-400">
          Convert to
        </label>
        <select
          id="convert-format"
          value={format}
          onChange={(e) => setFormat(e.target.value)}
          className="px-3 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent text-sm text-neutral-900 dark:text-neutral-100"
        >
          {FORMATS.map((f) => (
            <option key={f} value={f}>
              {f.toUpperCase()}
            </option>
          ))}
        </select>
        <button
          onClick={run}
          disabled={isRunning}
          className="px-4 py-1.5 rounded-full bg-accent text-black font-bold text-xs hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Converting...' : 'Convert All'}
        </button>
      </div>
    </Card>
  );
}
