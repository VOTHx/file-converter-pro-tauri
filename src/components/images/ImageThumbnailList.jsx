import { ImageOff } from 'lucide-react';

function fileName(path) {
  return path.split(/[\\/]/).pop();
}

export default function ImageThumbnailList({ files }) {
  if (!files.length) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {files.map((path) => (
        <div
          key={path}
          title={path}
          className="w-16 h-16 rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-800 bg-neutral-100 dark:bg-neutral-800 shrink-0 flex items-center justify-center"
        >
          <img
            src={window.__TAURI__.tauri.convertFileSrc(path)}
            alt={fileName(path)}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.style.display = 'none';
              e.target.nextSibling.style.display = 'flex';
            }}
          />
          <div className="hidden w-full h-full items-center justify-center text-neutral-400">
            <ImageOff size={18} aria-hidden="true" />
          </div>
        </div>
      ))}
    </div>
  );
}
