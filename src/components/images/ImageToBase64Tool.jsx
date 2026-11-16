import { useState } from 'react';
import { Copy } from 'lucide-react';
import Card from '../Card.jsx';
import ImageThumbnailList from './ImageThumbnailList.jsx';
import { useCopyToClipboard } from '../../hooks/useCopyToClipboard.js';
import { useToast } from '../../hooks/useToast.jsx';

const MIME_BY_EXT = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', bmp: 'image/bmp' };

export default function ImageToBase64Tool() {
  const [file, setFile] = useState(null);
  const [output, setOutput] = useState('');
  const copy = useCopyToClipboard();
  const { showToast } = useToast();

  const pickFile = async () => {
    const picked = await window.__TAURI__.dialog.open({
      filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] }],
    });
    setFile(picked || null);
    setOutput('');
  };

  const generate = async () => {
    if (!file) return showToast('Pick an image first.', 'error');
    try {
      const result = await window.__TAURI__.tauri.invoke('image_to_base64', { path: file });
      setOutput(result);
    } catch (err) {
      showToast('Error: ' + err, 'error');
    }
  };

  const copyDataUri = () => {
    if (!output || !file) return;
    const ext = file.split('.').pop().toLowerCase();
    const mime = MIME_BY_EXT[ext] || 'application/octet-stream';
    copy(`data:${mime};base64,${output}`);
  };

  return (
    <Card>
      <h2 className="font-bold text-sm text-neutral-900 dark:text-white mb-3">Image → Base64</h2>
      <button
        onClick={pickFile}
        className="px-4 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300"
      >
        Choose one image
      </button>
      <ImageThumbnailList files={file ? [file] : []} />
      <label htmlFor="b64-output" className="sr-only">
        Base64 result
      </label>
      <textarea
        id="b64-output"
        value={output}
        readOnly
        placeholder="Base64 string appears here..."
        className="w-full h-24 font-mono text-xs p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent resize-y text-neutral-900 dark:text-neutral-100 mt-3"
      />
      <div className="flex flex-wrap gap-2 mt-3">
        <button onClick={generate} className="px-4 py-1.5 rounded-full bg-accent text-black font-bold text-xs hover:opacity-90">
          Convert
        </button>
        <button
          onClick={() => copy(output)}
          disabled={!output}
          className="px-4 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed inline-flex items-center gap-1"
        >
          <Copy size={12} aria-hidden="true" /> Copy
        </button>
        <button
          onClick={copyDataUri}
          disabled={!output}
          className="px-4 py-1.5 rounded-full border border-neutral-300 dark:border-neutral-700 text-xs font-semibold text-neutral-700 dark:text-neutral-300 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          Copy as Data URI
        </button>
      </div>
    </Card>
  );
}
