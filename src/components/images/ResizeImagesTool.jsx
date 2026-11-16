import { useState } from 'react';
import Card from '../Card.jsx';
import ImageThumbnailList from './ImageThumbnailList.jsx';
import { useToast } from '../../hooks/useToast.jsx';

export default function ResizeImagesTool() {
  const [files, setFiles] = useState([]);
  const [width, setWidth] = useState(800);
  const [height, setHeight] = useState(600);
  const [maintainAspect, setMaintainAspect] = useState(true);
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
      const results = await window.__TAURI__.tauri.invoke('resize_images', {
        filePaths: files,
        width: Number(width),
        height: Number(height),
        maintainAspect,
        outDir,
      });
      const failed = results.filter((r) => !r.ok);
      showToast(
        failed.length === 0
          ? `Resized ${results.length} file(s) to ${outDir}`
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
      <h2 className="font-bold text-sm text-neutral-900 dark:text-white mb-3">Image Resizer</h2>
      <button
        onClick={pickFiles}
        className="px-4 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300"
      >
        Choose image files
      </button>
      <ImageThumbnailList files={files} />
      <div className="flex flex-wrap items-end gap-3 mt-3">
        <div>
          <label htmlFor="resize-width" className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">
            Width (px)
          </label>
          <input
            id="resize-width"
            type="number"
            value={width}
            onChange={(e) => setWidth(e.target.value)}
            className="w-24 px-3 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent text-sm text-neutral-900 dark:text-neutral-100"
          />
        </div>
        <div>
          <label htmlFor="resize-height" className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">
            Height (px)
          </label>
          <input
            id="resize-height"
            type="number"
            value={height}
            onChange={(e) => setHeight(e.target.value)}
            className="w-24 px-3 py-1.5 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent text-sm text-neutral-900 dark:text-neutral-100"
          />
        </div>
        <label className="flex items-center gap-2 text-xs text-neutral-600 dark:text-neutral-300 pb-2">
          <input
            type="checkbox"
            checked={maintainAspect}
            onChange={(e) => setMaintainAspect(e.target.checked)}
            className="w-auto"
          />
          Maintain aspect ratio
        </label>
        <button
          onClick={run}
          disabled={isRunning}
          className="px-4 py-1.5 rounded-full bg-accent text-black font-bold text-xs hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {isRunning ? 'Resizing...' : 'Resize All'}
        </button>
      </div>
    </Card>
  );
}
