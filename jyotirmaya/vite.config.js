import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Single-file build: everything (JS, CSS) is inlined into one index.html
// with a classic (non-module) script, so the app opens by double-clicking
// index.html directly (file://) — no dev server, no build step, no CORS
// issues with ES module chunks under the file:// origin.
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), viteSingleFile()],
  build: {
    target: 'es2018',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    outDir: 'run',
  },
})
