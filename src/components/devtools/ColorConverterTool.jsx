import { useState } from 'react';
import Card from '../Card.jsx';
import { parseColorInput, rgbToHex, rgbToHsl } from '../../utils/color.js';

export default function ColorConverterTool() {
  const [input, setInput] = useState('');
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const convert = () => {
    const rgb = parseColorInput(input);
    if (!rgb) {
      setError('Could not parse that color.');
      setResult(null);
      return;
    }
    setError('');
    setResult({ hex: rgbToHex(rgb.r, rgb.g, rgb.b), rgb, hsl: rgbToHsl(rgb.r, rgb.g, rgb.b) });
  };

  return (
    <Card>
      <h2 className="font-bold text-sm text-neutral-900 dark:text-white mb-1">Color Converter</h2>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
        Paste a HEX (#rrggbb), rgb(r,g,b), or hsl(h,s%,l%) value.
      </p>
      <div className="flex gap-2">
        <label htmlFor="color-input" className="sr-only">
          Color value
        </label>
        <input
          id="color-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="#1ed760"
          className="flex-1 font-mono text-sm px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-accent focus:outline-none text-neutral-900 dark:text-neutral-100"
        />
        <button onClick={convert} className="px-4 py-2 rounded-full bg-accent text-black font-bold text-xs hover:opacity-90">
          Convert
        </button>
      </div>
      {error && <p className="mt-2 text-xs font-semibold text-red-500">{error}</p>}
      {result && (
        <div className="mt-3 flex items-center gap-3 font-mono text-sm">
          <div
            className="w-9 h-9 rounded-md border border-neutral-300 dark:border-neutral-700 shrink-0"
            style={{ background: result.hex }}
            aria-hidden="true"
          />
          <div className="text-neutral-900 dark:text-neutral-100">
            <div>HEX: {result.hex}</div>
            <div>
              RGB: rgb({result.rgb.r}, {result.rgb.g}, {result.rgb.b})
            </div>
            <div>
              HSL: hsl({result.hsl.h}, {result.hsl.s}%, {result.hsl.l}%)
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
