import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      // Without this, Vite also watches src-tauri/target (Cargo's build
      // output) and crashes with EBUSY on Windows when Cargo is mid-write
      // to a .exe in there — unrelated to the frontend, should never be watched.
      ignored: ['**/src-tauri/**'],
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
});
