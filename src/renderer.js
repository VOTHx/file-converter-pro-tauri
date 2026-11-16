const { invoke } = window.__TAURI__.tauri;
const { open: openDialog, save: saveDialog } = window.__TAURI__.dialog;
const { listen } = window.__TAURI__.event;

document.querySelectorAll('nav .tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('nav .tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('main .panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.panel).classList.add('active');
  });
});

function setStatus(el, ok, msg) {
  el.textContent = msg;
  el.className = 'status ' + (ok ? 'ok' : 'err');
}

function toArray(picked) {
  if (!picked) return [];
  return Array.isArray(picked) ? picked : [picked];
}

// Renders a list of file paths as plain text, never as HTML. File paths are
// untrusted strings (they can contain arbitrary characters on some OSes), so
// this must never go through innerHTML/template-string concatenation.
function renderFileList(elementId, paths) {
  const el = document.getElementById(elementId);
  el.innerHTML = '';
  paths.forEach(p => {
    const div = document.createElement('div');
    div.textContent = p;
    el.appendChild(div);
  });
}

// ---- Text / data converter ----
document.getElementById('text-convert-btn').addEventListener('click', async () => {
  const mode = document.getElementById('text-mode').value;
  const input = document.getElementById('text-input').value;
  const statusEl = document.getElementById('text-status');
  const outEl = document.getElementById('text-output');
  try {
    const output = await invoke('convert_text', { mode, input });
    outEl.value = output;
    setStatus(statusEl, true, 'Done.');
    addHistoryEntry(mode);
  } catch (err) {
    outEl.value = '';
    setStatus(statusEl, false, 'Error: ' + err);
  }
});

const TEXT_MODE_EXTENSIONS = {
  'text-to-json': 'json', 'json-to-text': 'txt', 'csv-to-json': 'json',
  'json-to-csv': 'csv', 'json-to-xml': 'xml', 'xml-to-json': 'json',
  'text-to-base64': 'txt', 'base64-to-text': 'txt',
  'json-to-yaml': 'yaml', 'yaml-to-json': 'json',
};

document.getElementById('text-copy-btn').addEventListener('click', () => {
  copyToClipboard(document.getElementById('text-output').value, 'text-toast');
});
document.getElementById('text-download-btn').addEventListener('click', () => {
  const ext = TEXT_MODE_EXTENSIONS[document.getElementById('text-mode').value] || 'txt';
  downloadText(document.getElementById('text-output').value, `output.${ext}`, document.getElementById('text-status'));
});

// ---- Image converter ----
let imageFiles = [];
document.getElementById('image-pick-btn').addEventListener('click', async () => {
  const picked = await openDialog({
    multiple: true,
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] }],
  });
  imageFiles = toArray(picked);
  renderFileList('image-filelist', imageFiles);
});

// ---- Image → Base64 ----
let b64File = [];
document.getElementById('b64-pick-btn').addEventListener('click', async () => {
  const picked = await openDialog({ filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] }] });
  b64File = toArray(picked);
  renderFileList('b64-filelist', b64File);
});

document.getElementById('b64-generate-btn').addEventListener('click', async () => {
  const statusEl = document.getElementById('b64-status');
  if (!b64File.length) return setStatus(statusEl, false, 'Pick an image first.');
  try {
    const result = await invoke('image_to_base64', { path: b64File[0] });
    document.getElementById('b64-output').value = result;
    setStatus(statusEl, true, 'Done.');
  } catch (err) {
    setStatus(statusEl, false, 'Error: ' + err);
  }
});

document.getElementById('b64-copy-btn').addEventListener('click', () => {
  copyToClipboard(document.getElementById('b64-output').value, 'b64-toast');
});

document.getElementById('b64-copy-datauri-btn').addEventListener('click', () => {
  const b64 = document.getElementById('b64-output').value;
  if (!b64 || !b64File.length) return;
  const ext = b64File[0].split('.').pop().toLowerCase();
  const mime = { png: 'image/png', jpg: 'image/jpeg', jpeg: 'image/jpeg', webp: 'image/webp', bmp: 'image/bmp' }[ext]
    || 'application/octet-stream';
  copyToClipboard(`data:${mime};base64,${b64}`, 'b64-toast');
});

// ---- Image Resizer ----
let resizeFiles = [];
document.getElementById('resize-pick-btn').addEventListener('click', async () => {
  const picked = await openDialog({
    multiple: true,
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] }],
  });
  resizeFiles = toArray(picked);
  renderFileList('resize-filelist', resizeFiles);
});

document.getElementById('resize-run-btn').addEventListener('click', async () => {
  const statusEl = document.getElementById('resize-status');
  if (!resizeFiles.length) return setStatus(statusEl, false, 'Pick files first.');
  const width = parseInt(document.getElementById('resize-width').value, 10);
  const height = parseInt(document.getElementById('resize-height').value, 10);
  const maintainAspect = document.getElementById('resize-aspect').checked;
  const outDir = await openDialog({ directory: true });
  if (!outDir) return;
  setStatus(statusEl, true, 'Resizing...');
  const results = await invoke('resize_images', { filePaths: resizeFiles, width, height, maintainAspect, outDir });
  const failed = results.filter(r => !r.ok);
  setStatus(statusEl, failed.length === 0,
    failed.length === 0
      ? `Resized ${results.length} file(s) to ${outDir}`
      : `${failed.length} of ${results.length} failed.`);
});

// ---- Image Compressor ----
let compressFiles = [];
document.getElementById('compress-pick-btn').addEventListener('click', async () => {
  const picked = await openDialog({
    multiple: true,
    filters: [{ name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp', 'bmp'] }],
  });
  compressFiles = toArray(picked);
  renderFileList('compress-filelist', compressFiles);
});

function formatBytes(n) {
  if (n == null) return '?';
  if (n < 1024) return n + ' B';
  if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
  return (n / (1024 * 1024)).toFixed(2) + ' MB';
}

document.getElementById('compress-run-btn').addEventListener('click', async () => {
  const statusEl = document.getElementById('compress-status');
  if (!compressFiles.length) return setStatus(statusEl, false, 'Pick files first.');
  const quality = Math.max(1, Math.min(100, parseInt(document.getElementById('compress-quality').value, 10) || 75));
  const outDir = await openDialog({ directory: true });
  if (!outDir) return;
  setStatus(statusEl, true, 'Compressing...');
  const results = await invoke('compress_images', { filePaths: compressFiles, quality, outDir });
  const failed = results.filter(r => !r.ok);
  if (failed.length) {
    setStatus(statusEl, false, `${failed.length} of ${results.length} failed.`);
    return;
  }
  const summary = results.map(r => `${formatBytes(r.original_size)} → ${formatBytes(r.compressed_size)}`).join(', ');
  setStatus(statusEl, true, `Compressed ${results.length} file(s): ${summary}`);
});

document.getElementById('image-convert-btn').addEventListener('click', async () => {
  const statusEl = document.getElementById('image-status');
  if (!imageFiles.length) return setStatus(statusEl, false, 'Pick files first.');
  const outDir = await openDialog({ directory: true });
  if (!outDir) return;
  const targetFormat = document.getElementById('image-format').value;
  setStatus(statusEl, true, 'Converting...');
  const results = await invoke('convert_images', { filePaths: imageFiles, targetFormat, outDir });
  const failed = results.filter(r => !r.ok);
  setStatus(statusEl, failed.length === 0,
    failed.length === 0
      ? `Converted ${results.length} file(s) to ${outDir}`
      : `${failed.length} of ${results.length} failed.`);
});

// ---- Zip extract ----
let zipFile = [];
document.getElementById('zip-pick-btn').addEventListener('click', async () => {
  const picked = await openDialog({ filters: [{ name: 'Zip', extensions: ['zip'] }] });
  zipFile = toArray(picked);
  renderFileList('zip-filelist', zipFile);
});

document.getElementById('zip-extract-btn').addEventListener('click', async () => {
  const statusEl = document.getElementById('zip-status');
  if (!zipFile.length) return setStatus(statusEl, false, 'Pick a .zip first.');
  const outDir = await openDialog({ directory: true });
  if (!outDir) return;
  try {
    const result = await invoke('extract_zip', { zipPath: zipFile[0], outDir });
    setStatus(statusEl, true, `Extracted to ${result.out_path}`);
  } catch (err) {
    setStatus(statusEl, false, 'Error: ' + err);
  }
});

// ---- Bundle to zip ----
let bundleFiles = [];
document.getElementById('bundle-pick-btn').addEventListener('click', async () => {
  const picked = await openDialog({ multiple: true });
  bundleFiles = toArray(picked);
  document.getElementById('bundle-filelist').innerHTML = bundleFiles.map(f => `<div>${f}</div>`).join('');
});

document.getElementById('bundle-btn').addEventListener('click', async () => {
  const statusEl = document.getElementById('zip-status');
  if (!bundleFiles.length) return setStatus(statusEl, false, 'Pick files to bundle first.');
  const zipName = document.getElementById('bundle-name').value || 'bundle.zip';
  const outDir = await openDialog({ directory: true });
  if (!outDir) return;
  try {
    const outPath = await invoke('files_to_zip', { filePaths: bundleFiles, outDir, zipName });
    setStatus(statusEl, true, `Created ${outPath}`);
  } catch (err) {
    setStatus(statusEl, false, 'Error: ' + err);
  }
});

// ---- Drag and drop ----
// Tauri intercepts real file drops at the OS level (the browser never sees File
// objects), so: (1) we still listen for plain dragenter/dragover to know which
// dropzone the cursor is over, purely for highlighting + routing, and (2) the
// actual file paths arrive via Tauri's own 'tauri://file-drop' event.

let activeDropzone = null;
const dropzones = document.querySelectorAll('.dropzone');

dropzones.forEach(zone => {
  zone.addEventListener('dragenter', e => {
    e.preventDefault();
    dropzones.forEach(z => z.classList.remove('hover'));
    zone.classList.add('hover');
    activeDropzone = zone.dataset.dropzone;
  });
  zone.addEventListener('dragover', e => e.preventDefault());
  zone.addEventListener('dragleave', () => {
    zone.classList.remove('hover');
  });
});

// Fallback so the whole window doesn't try to "open" a dropped file if it
// lands outside any dropzone.
document.addEventListener('dragover', e => e.preventDefault());
document.addEventListener('drop', e => e.preventDefault());

function clearDropHighlights() {
  dropzones.forEach(z => z.classList.remove('hover'));
}

listen('tauri://file-drop', event => {
  const paths = event.payload || [];
  clearDropHighlights();
  if (!paths.length || !activeDropzone) return;

  if (activeDropzone === 'text') {
    invoke('read_text_file', { path: paths[0] })
      .then(content => {
        document.getElementById('text-input').value = content;
        setStatus(document.getElementById('text-status'), true, `Loaded ${paths[0]}`);
      })
      .catch(err => setStatus(document.getElementById('text-status'), false, 'Error: ' + err));
  } else if (activeDropzone === 'image') {
    imageFiles = paths.filter(p => /\.(png|jpe?g|webp|bmp)$/i.test(p));
    document.getElementById('image-filelist').innerHTML =
      imageFiles.map(f => `<div>${f}</div>`).join('');
    if (!imageFiles.length) {
      setStatus(document.getElementById('image-status'), false, 'No supported image files in that drop.');
    }
  } else if (activeDropzone === 'zip-extract') {
    zipFile = paths.filter(p => p.toLowerCase().endsWith('.zip')).slice(0, 1);
    document.getElementById('zip-filelist').innerHTML = zipFile.map(f => `<div>${f}</div>`).join('');
    if (!zipFile.length) {
      setStatus(document.getElementById('zip-status'), false, 'Drop a .zip file here.');
    }
  } else if (activeDropzone === 'bundle') {
    bundleFiles = paths;
    document.getElementById('bundle-filelist').innerHTML =
      bundleFiles.map(f => `<div>${f}</div>`).join('');
  }

  activeDropzone = null;
});

listen('tauri://file-drop-cancelled', () => {
  clearDropHighlights();
  activeDropzone = null;
});

// ---- Shared Copy / Download helpers ----

function showToast(toastId) {
  const t = document.getElementById(toastId);
  if (!t) return;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1500);
}

async function copyToClipboard(text, toastId) {
  if (!text) return;
  try {
    await navigator.clipboard.writeText(text);
    showToast(toastId);
  } catch (err) {
    console.error('Copy failed', err);
  }
}

async function downloadText(text, defaultName, statusEl) {
  if (!text) return;
  const path = await saveDialog({ defaultPath: defaultName });
  if (!path) return;
  try {
    await invoke('write_text_file', { path, content: text });
    if (statusEl) setStatus(statusEl, true, `Saved to ${path}`);
  } catch (err) {
    if (statusEl) setStatus(statusEl, false, 'Save failed: ' + err);
  }
}

// ---- Keyboard shortcuts (scoped to Text & Data, the primary converter) ----

document.addEventListener('keydown', e => {
  if (!document.getElementById('text-panel').classList.contains('active')) return;
  const ctrlOrCmd = e.ctrlKey || e.metaKey;
  if (ctrlOrCmd && e.key === 'Enter') {
    e.preventDefault();
    document.getElementById('text-convert-btn').click();
  } else if (ctrlOrCmd && e.shiftKey && e.key.toLowerCase() === 'c') {
    e.preventDefault();
    document.getElementById('text-copy-btn').click();
  }
});

// ---- JSON Formatter ----

function sortKeysDeep(value) {
  if (Array.isArray(value)) return value.map(sortKeysDeep);
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((acc, k) => {
      acc[k] = sortKeysDeep(value[k]);
      return acc;
    }, {});
  }
  return value;
}

function jsonStatus(ok, msg) {
  setStatus(document.getElementById('json-status'), ok, msg);
}

document.getElementById('json-pretty-btn').addEventListener('click', () => {
  try {
    const obj = JSON.parse(document.getElementById('json-input').value);
    document.getElementById('json-output').value = JSON.stringify(obj, null, 2);
    jsonStatus(true, 'Pretty printed.');
  } catch (err) { jsonStatus(false, 'Invalid JSON: ' + err.message); }
});

document.getElementById('json-minify-btn').addEventListener('click', () => {
  try {
    const obj = JSON.parse(document.getElementById('json-input').value);
    document.getElementById('json-output').value = JSON.stringify(obj);
    jsonStatus(true, 'Minified.');
  } catch (err) { jsonStatus(false, 'Invalid JSON: ' + err.message); }
});

document.getElementById('json-validate-btn').addEventListener('click', () => {
  try {
    JSON.parse(document.getElementById('json-input').value);
    jsonStatus(true, 'Valid JSON.');
  } catch (err) { jsonStatus(false, 'Invalid JSON: ' + err.message); }
});

document.getElementById('json-sort-btn').addEventListener('click', () => {
  try {
    const obj = JSON.parse(document.getElementById('json-input').value);
    document.getElementById('json-output').value = JSON.stringify(sortKeysDeep(obj), null, 2);
    jsonStatus(true, 'Sorted.');
  } catch (err) { jsonStatus(false, 'Invalid JSON: ' + err.message); }
});

document.getElementById('json-copy-btn').addEventListener('click', () => {
  copyToClipboard(document.getElementById('json-output').value, 'json-toast');
});
document.getElementById('json-download-btn').addEventListener('click', () => {
  downloadText(document.getElementById('json-output').value, 'output.json', document.getElementById('json-status'));
});

// ---- UUID Generator ----
// crypto.randomUUID() is built into the WebView2 runtime itself — no library needed.

document.getElementById('uuid-generate-btn').addEventListener('click', () => {
  document.getElementById('uuid-output').value = crypto.randomUUID();
});
document.getElementById('uuid-copy-btn').addEventListener('click', () => {
  copyToClipboard(document.getElementById('uuid-output').value, 'uuid-toast');
});

// ---- Hash Generator ----
// SHA-256/512 use the browser's built-in crypto.subtle (no dependency). MD5 has
// no browser API (it's deprecated for security use), so it's hand-implemented
// below per the standard RFC 1321 algorithm — still just arithmetic, no library.

function md5(str) {
  function rotl(x, c) { return (x << c) | (x >>> (32 - c)); }
  function toHexLE(n) {
    let s = '';
    for (let i = 0; i < 4; i++) s += ((n >>> (i * 8)) & 0xff).toString(16).padStart(2, '0');
    return s;
  }
  const K = new Uint32Array(64);
  for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 2 ** 32);
  const S = [
    7,12,17,22, 7,12,17,22, 7,12,17,22, 7,12,17,22,
    5, 9,14,20, 5, 9,14,20, 5, 9,14,20, 5, 9,14,20,
    4,11,16,23, 4,11,16,23, 4,11,16,23, 4,11,16,23,
    6,10,15,21, 6,10,15,21, 6,10,15,21, 6,10,15,21,
  ];
  const bytes = new TextEncoder().encode(str);
  const bitLen = bytes.length * 8;
  const padded = new Uint8Array(((bytes.length + 8) >> 6) * 64 + 64);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const dv = new DataView(padded.buffer);
  dv.setUint32(padded.length - 8, bitLen >>> 0, true);
  dv.setUint32(padded.length - 4, Math.floor(bitLen / 2 ** 32), true);

  let a0 = 0x67452301, b0 = 0xefcdab89, c0 = 0x98badcfe, d0 = 0x10325476;

  for (let chunkStart = 0; chunkStart < padded.length; chunkStart += 64) {
    const M = new Uint32Array(16);
    for (let j = 0; j < 16; j++) M[j] = dv.getUint32(chunkStart + j * 4, true);
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; }
      else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) % 16; }
      else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) % 16; }
      else { F = C ^ (B | ~D); g = (7 * i) % 16; }
      F = (F + A + K[i] + M[g]) >>> 0;
      A = D; D = C; C = B;
      B = (B + rotl(F, S[i])) >>> 0;
    }
    a0 = (a0 + A) >>> 0; b0 = (b0 + B) >>> 0; c0 = (c0 + C) >>> 0; d0 = (d0 + D) >>> 0;
  }
  return toHexLE(a0) + toHexLE(b0) + toHexLE(c0) + toHexLE(d0);
}

async function subtleHash(algo, text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest(algo, data);
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

document.getElementById('hash-generate-btn').addEventListener('click', async () => {
  const text = document.getElementById('hash-input').value;
  const algo = document.getElementById('hash-algo').value;
  const result = algo === 'MD5' ? md5(text) : await subtleHash(algo, text);
  document.getElementById('hash-output').value = result;
});
document.getElementById('hash-copy-btn').addEventListener('click', () => {
  copyToClipboard(document.getElementById('hash-output').value, 'hash-toast');
});

// ---- URL Encode / Decode ----

document.getElementById('url-encode-btn').addEventListener('click', () => {
  document.getElementById('url-output').value = encodeURIComponent(document.getElementById('url-input').value);
});
document.getElementById('url-decode-btn').addEventListener('click', () => {
  try {
    document.getElementById('url-output').value = decodeURIComponent(document.getElementById('url-input').value);
  } catch (err) {
    document.getElementById('url-output').value = '';
  }
});
document.getElementById('url-copy-btn').addEventListener('click', () => {
  copyToClipboard(document.getElementById('url-output').value, 'url-toast');
});

// ---- Color Converter ----

function hslToRgb(h, s, l) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) { r = g = b = l; }
  else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) };
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;
  if (max === min) { h = s = 0; }
  else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      default: h = (r - g) / d + 4;
    }
    h /= 6;
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function rgbToHex(r, g, b) {
  return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
}

function parseColorInput(raw) {
  const s = raw.trim();
  if (s.startsWith('#')) {
    const hex = s.slice(1);
    const full = hex.length === 3 ? hex.split('').map(c => c + c).join('') : hex;
    if (full.length !== 6) return null;
    return {
      r: parseInt(full.slice(0, 2), 16),
      g: parseInt(full.slice(2, 4), 16),
      b: parseInt(full.slice(4, 6), 16),
    };
  }
  const rgbMatch = s.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)/i);
  if (rgbMatch) return { r: +rgbMatch[1], g: +rgbMatch[2], b: +rgbMatch[3] };
  const hslMatch = s.match(/hsl\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%\s*\)/i);
  if (hslMatch) return hslToRgb(+hslMatch[1], +hslMatch[2], +hslMatch[3]);
  return null;
}

document.getElementById('color-convert-btn').addEventListener('click', () => {
  const rgb = parseColorInput(document.getElementById('color-input').value);
  const statusEl = document.getElementById('color-status');
  const outEl = document.getElementById('color-output');
  if (!rgb) {
    setStatus(statusEl, false, 'Could not parse that color.');
    outEl.style.display = 'none';
    return;
  }
  const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
  const hsl = rgbToHsl(rgb.r, rgb.g, rgb.b);
  document.getElementById('color-swatch').style.background = hex;
  document.getElementById('color-hex').textContent = 'HEX: ' + hex;
  document.getElementById('color-rgb').textContent = `RGB: rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`;
  document.getElementById('color-hsl').textContent = `HSL: hsl(${hsl.h}, ${hsl.s}%, ${hsl.l}%)`;
  outEl.style.display = 'block';
  setStatus(statusEl, true, 'Converted.');
});

// ---- Theme toggle ----
// localStorage here is fine — this is a real desktop app with its own
// persistent webview profile, not a published web page.

const THEME_KEY = 'fcp-theme';

function applyTheme(theme) {
  if (theme === 'light') {
    document.documentElement.setAttribute('data-theme', 'light');
    document.getElementById('theme-label').textContent = 'Light mode';
  } else {
    document.documentElement.removeAttribute('data-theme');
    document.getElementById('theme-label').textContent = 'Dark mode';
  }
}

applyTheme(localStorage.getItem(THEME_KEY) || 'dark');

document.getElementById('theme-toggle-btn').addEventListener('click', () => {
  const current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  const next = current === 'light' ? 'dark' : 'light';
  localStorage.setItem(THEME_KEY, next);
  applyTheme(next);
});

// ---- Auto-detect format ----
// Heuristic only, not a guarantee — purely to help the user pick a mode faster.

function detectFormat(text) {
  const s = text.trim();
  if (!s) return '';
  if (s.startsWith('{') || s.startsWith('[')) {
    try { JSON.parse(s); return 'JSON'; } catch { /* fall through */ }
  }
  if (s.startsWith('<')) return 'XML';
  const lines = s.split('\n');
  if (lines.length > 1 && lines[0].includes(',')) return 'CSV (probably)';
  if (/^[A-Za-z0-9+/=\s]+$/.test(s) && s.replace(/\s/g, '').length % 4 === 0 && s.length > 16) {
    return 'Base64 (probably)';
  }
  return 'Plain text';
}

document.getElementById('text-input').addEventListener('input', () => {
  const detected = detectFormat(document.getElementById('text-input').value);
  document.getElementById('detect-line').innerHTML = detected ? `Detected: <b>${detected}</b>` : '';
});

// ---- Conversion history ----

const HISTORY_KEY = 'fcp-history';
const MODE_LABELS = {
  'text-to-json': 'Text → JSON', 'json-to-text': 'JSON → Text', 'csv-to-json': 'CSV → JSON',
  'json-to-csv': 'JSON → CSV', 'json-to-xml': 'JSON → XML', 'xml-to-json': 'XML → JSON',
  'text-to-base64': 'Text → Base64', 'base64-to-text': 'Base64 → Text',
  'json-to-yaml': 'JSON → YAML', 'yaml-to-json': 'YAML → JSON',
};

function loadHistory() {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || '[]'); } catch { return []; }
}
function saveHistoryList(list) {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(list));
}
function formatRelativeTime(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60) return 'just now';
  if (diff < 3600) { const m = Math.floor(diff / 60); return `${m} min${m === 1 ? '' : 's'} ago`; }
  if (diff < 86400) { const h = Math.floor(diff / 3600); return `${h} hour${h === 1 ? '' : 's'} ago`; }
  const d = Math.floor(diff / 86400);
  return `${d} day${d === 1 ? '' : 's'} ago`;
}

function renderHistory() {
  const list = loadHistory();
  const el = document.getElementById('history-list');
  el.innerHTML = '';
  if (!list.length) {
    const empty = document.createElement('div');
    empty.className = 'sub';
    empty.textContent = 'No conversions yet.';
    el.appendChild(empty);
    return;
  }
  list.forEach(item => {
    const row = document.createElement('div');
    row.className = 'history-item';
    const label = document.createElement('span');
    label.textContent = MODE_LABELS[item.mode] || item.mode;
    const time = document.createElement('span');
    time.className = 'history-time';
    time.textContent = formatRelativeTime(item.ts);
    row.appendChild(label);
    row.appendChild(time);
    el.appendChild(row);
  });
}

function addHistoryEntry(mode) {
  const list = loadHistory();
  list.unshift({ mode, ts: Date.now() });
  saveHistoryList(list.slice(0, 10));
  renderHistory();
}

document.getElementById('history-clear-btn').addEventListener('click', () => {
  saveHistoryList([]);
  renderHistory();
});

renderHistory();
setInterval(renderHistory, 30000); // keeps "X mins ago" labels current

// ---- JWT Decoder ----
// Decodes header + payload only. Verifying the signature would need the
// secret/public key, which this tool never has — it's read-only inspection.

function base64UrlDecodeToString(str) {
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  const binary = atob(base64);
  const bytes = Uint8Array.from(binary, c => c.charCodeAt(0));
  return new TextDecoder('utf-8').decode(bytes);
}

document.getElementById('jwt-decode-btn').addEventListener('click', () => {
  const token = document.getElementById('jwt-input').value.trim();
  const statusEl = document.getElementById('jwt-status');
  const parts = token.split('.');
  if (parts.length !== 3) {
    setStatus(statusEl, false, 'Not a valid JWT (expected 3 dot-separated parts).');
    return;
  }
  try {
    const header = JSON.parse(base64UrlDecodeToString(parts[0]));
    const payload = JSON.parse(base64UrlDecodeToString(parts[1]));
    document.getElementById('jwt-header').value = JSON.stringify(header, null, 2);
    document.getElementById('jwt-payload').value = JSON.stringify(payload, null, 2);
    document.getElementById('jwt-signature').value = parts[2];
    setStatus(statusEl, true, 'Decoded (signature not verified).');
  } catch (err) {
    setStatus(statusEl, false, 'Could not decode: ' + err.message);
  }
});
