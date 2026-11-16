import { useState } from 'react';
import Card from '../Card.jsx';
import ImageThumbnailList from './ImageThumbnailList.jsx';
import { useToast } from '../../hooks/useToast.jsx';

function formatBytes(n) {
  if (n == null) return '?';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

export default function CompressImagesTool() {
  const [files, setFiles] = useState([]);
  const [quality, setQuality] = useState(75);
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
      const results = await window.__TAURI__.tauri.invoke('compress_images', {
        filePaths: files,
        quality: Math.max(1, Math.min(100, Number(quality) || 75)),
        outDir,
      });
      const failed = results.filter((r) => !r.ok);
      if (failed.length) {
        showToast(`${failed.length} of ${results.length} failed.`, 'error');
        return;
      }
      const summary = results.map((r) => `${formatBytes(r.original_size)} → ${formatBytes(r.compressed_size)}`).join(', ');
      showToast(`Compressed ${results.length} file(s): ${summary}`);
    } catch (err) {
      showToast('Error: ' + err, 'error');
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <Card>
      <h2 className="font-bold text-sm text-neutral-900 dark:text-white mb-1">Image Compressor</h2>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
        Always outputs JPEG — the only format here with a real quality/size tradeoff.
      </p>
      <button
        onClick={pickFiles}
        className="px-4 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300"
      >
        Choose image files
      </button>
      <ImageThumbnailList files={files} />
      <div className="flex items-end gap-3 mt-3">
        <div>
          <label htmlFor="compress-quality" className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">
            Quality (1–100)
          </label>
          <input
            id="compress-quality"
            type="number"
            min="1"
            max="100"
            value={quality}
            onChange={(e) => setQuality(e.target.value)}
            className="w-24 px-3 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent text-sm text-neutral-900 dark:text-neutral-100"
          />
        </div>
        <button
          onClick={run}
          disabled={isRunning}
          className="px-4 py-1.5 rounded-full bg-accent text-black font-bold text-xs hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Compressing...' : 'Compress All'}
        </button>
      </div>
    </Card>
  );
}
