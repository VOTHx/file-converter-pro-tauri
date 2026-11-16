import { FileJson, Image as ImageIcon, Archive, Wrench } from 'lucide-react';

export const TOOLS = [
  {
    id: 'text',
    title: 'Text & Data',
    description: 'JSON, CSV, XML, YAML, and Base64 conversions, plus a JSON formatter.',
    icon: FileJson,
  },
  {
    id: 'images',
    title: 'Images',
    description: 'Convert, resize, compress, and Base64-encode image files.',
    icon: ImageIcon,
  },
  {
    id: 'zip',
    title: 'Zip',
    description: 'Extract an archive, or bundle files into a new .zip.',
    icon: Archive,
  },
  {
    id: 'devtools',
    title: 'Dev Tools',
    description: 'JSON formatter, hash generator, UUIDs, JWT decoder, color converter, URL encode/decode.',
    icon: Wrench,
  },
];

export const TOOL_LABELS = Object.fromEntries(TOOLS.map((t) => [t.id, t.title]));
export const TOOL_ICONS = Object.fromEntries(TOOLS.map((t) => [t.id, t.icon]));
