import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

/**
 * Separate Vite build for the content script.
 *
 * Content scripts injected via manifest.json are loaded as *classic* scripts,
 * NOT ES modules — so they cannot use `import` statements.
 * We compile to IIFE format here so React, ReactDOM, and all component code
 * is bundled into a single self-contained file.
 */
export default defineConfig({
  plugins: [react()],
  define: {
    'process.env.NODE_ENV': JSON.stringify('production'),
  },
  build: {
    outDir: 'dist',
    emptyOutDir: false,   // main build already created dist/
    target: 'es2022',
    cssCodeSplit: false,
    rollupOptions: {
      input: resolve(__dirname, 'src/content/index.js'),
      output: {
        format: 'iife',
        entryFileNames: 'content.js',
        assetFileNames: 'assets/[name]-[hash][extname]',
        // No code splitting — everything goes into content.js
        inlineDynamicImports: true,
      },
    },
  },
});
