import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync, readdirSync } from 'fs';

function copyExtensionAssets() {
  return {
    name: 'copy-extension-assets',
    closeBundle() {
      const outDir = resolve(__dirname, 'dist');
      const iconsOutDir = resolve(outDir, 'icons');

      mkdirSync(iconsOutDir, { recursive: true });
      copyFileSync(resolve(__dirname, 'manifest.json'), resolve(outDir, 'manifest.json'));
      copyFileSync(resolve(__dirname, 'src/content/contentStyles.css'), resolve(outDir, 'content.css'));

      for (const icon of readdirSync(resolve(__dirname, 'icons'))) {
        copyFileSync(resolve(__dirname, 'icons', icon), resolve(iconsOutDir, icon));
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), copyExtensionAssets()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    target: 'es2022',
    cssCodeSplit: false,
    rollupOptions: {
      input: {
        popup:            resolve(__dirname, 'popup.html'),
        options:          resolve(__dirname, 'options.html'),
        sidepanel:        resolve(__dirname, 'sidepanel.html'),
        // content script is built separately (vite.content.config.js) as IIFE
        'service-worker': resolve(__dirname, 'src/background/service-worker.js'),
      },
      output: {
        entryFileNames: (chunk) => {
          if (chunk.name === 'service-worker') return 'service-worker.js';
          return 'assets/[name]-[hash].js';
        },
        chunkFileNames: 'assets/[name]-[hash].js',
        assetFileNames: (asset) => {
          if (asset.name === 'content.css') return 'content.css';
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
  },
});
