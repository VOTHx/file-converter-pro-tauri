import ConvertImagesTool from '../components/images/ConvertImagesTool.jsx';
import ImageToBase64Tool from '../components/images/ImageToBase64Tool.jsx';
import ResizeImagesTool from '../components/images/ResizeImagesTool.jsx';
import CompressImagesTool from '../components/images/CompressImagesTool.jsx';

export default function ImagesPage() {
  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-1">Images</h1>
      <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm">
        Convert, resize, compress, and Base64-encode image files. All processing happens locally.
      </p>
      <div className="flex flex-col gap-4">
        <ConvertImagesTool />
        <ImageToBase64Tool />
        <ResizeImagesTool />
        <CompressImagesTool />
      </div>
    </div>
  );
}
