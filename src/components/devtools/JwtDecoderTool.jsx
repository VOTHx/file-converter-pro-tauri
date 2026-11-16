import { useState } from 'react';
import Card from '../Card.jsx';
import { decodeJwt } from '../../utils/jwt.js';

export default function JwtDecoderTool() {
  const [token, setToken] = useState('');
  const [decoded, setDecoded] = useState(null);
  const [error, setError] = useState('');

  const handleDecode = () => {
    try {
      setDecoded(decodeJwt(token));
      setError('');
    } catch (err) {
      setError(err.message);
      setDecoded(null);
    }
  };

  return (
    <Card>
      <h2 className="font-bold text-sm text-neutral-900 dark:text-white mb-1">JWT Decoder</h2>
      <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-3">
        Decodes the header and payload only — does not verify the signature.
      </p>
      <label htmlFor="jwt-input" className="sr-only">
        JWT token
      </label>
      <textarea
        id="jwt-input"
        value={token}
        onChange={(e) => setToken(e.target.value)}
        placeholder="eyJhbGciOi..."
        className="w-full h-20 font-mono text-sm p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent focus:border-accent focus:outline-none resize-y text-neutral-900 dark:text-neutral-100"
      />
      <button onClick={handleDecode} className="mt-3 px-4 py-1.5 rounded-full bg-accent text-black font-bold text-xs hover:opacity-90">
        Decode
      </button>
      {error && <p className="mt-2 text-xs font-semibold text-red-500">{error}</p>}
      {decoded && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Header</label>
              <textarea
                readOnly
                value={JSON.stringify(decoded.header, null, 2)}
                className="w-full h-28 font-mono text-xs p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent text-neutral-900 dark:text-neutral-100"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mb-1">Payload</label>
              <textarea
                readOnly
                value={JSON.stringify(decoded.payload, null, 2)}
                className="w-full h-28 font-mono text-xs p-3 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent text-neutral-900 dark:text-neutral-100"
              />
            </div>
          </div>
          <label className="text-xs font-bold text-neutral-500 dark:text-neutral-400 block mt-3 mb-1">
            Signature (raw, unverified)
          </label>
          <input
            readOnly
            value={decoded.signature}
            className="w-full font-mono text-xs px-3 py-2 rounded-md bg-neutral-100 dark:bg-neutral-800 border border-transparent text-neutral-900 dark:text-neutral-100"
          />
        </>
      )}
    </Card>
  );
}
