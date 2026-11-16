import ExtractZipTool from '../components/zip/ExtractZipTool.jsx';
import BundleZipTool from '../components/zip/BundleZipTool.jsx';

export default function ZipPage() {
  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-1">Zip</h1>
      <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm">
        Extract an archive, or bundle files into a new one. All processing happens locally.
      </p>
      <div className="flex flex-col gap-4">
        <ExtractZipTool />
        <BundleZipTool />
      </div>
    </div>
  );
}
