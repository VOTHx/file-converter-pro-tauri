import JsonFormatterTool from '../components/devtools/JsonFormatterTool.jsx';
import UuidGeneratorTool from '../components/devtools/UuidGeneratorTool.jsx';
import HashGeneratorTool from '../components/devtools/HashGeneratorTool.jsx';
import UrlEncodeTool from '../components/devtools/UrlEncodeTool.jsx';
import ColorConverterTool from '../components/devtools/ColorConverterTool.jsx';
import JwtDecoderTool from '../components/devtools/JwtDecoderTool.jsx';

export default function DevToolsPage() {
  return (
    <div className="p-6 md:p-8 max-w-4xl">
      <h1 className="text-2xl font-extrabold text-neutral-900 dark:text-white mb-1">Dev Tools</h1>
      <p className="text-neutral-500 dark:text-neutral-400 mb-6 text-sm">
        JSON formatting, UUIDs, hashes, URL encoding, color conversion, and JWT decoding — all run
        locally in this window. Nothing here is sent anywhere.
      </p>
      <div className="flex flex-col gap-4">
        <JsonFormatterTool />
        <UuidGeneratorTool />
        <HashGeneratorTool />
        <UrlEncodeTool />
        <ColorConverterTool />
        <JwtDecoderTool />
      </div>
    </div>
  );
}
