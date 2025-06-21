import { defineConfig } from 'vite';
import { resolve } from 'path';
import { fileURLToPath, URL } from 'node:url';
import react from '@vitejs/plugin-react';
import { copyFileSync } from 'fs';

export default defineConfig({
  base: './',
  plugins: [
    react(),
    {
      name: 'copy-manifest',
      writeBundle() {
        copyFileSync('src/manifest.json', 'dist/manifest.json');
      },
    },
  ],
  build: {
    rollupOptions: {
      input: {
        popup: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/popup/popup.html'),
        background: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/background/background.ts'),
        content: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/content/content.ts'),
        options: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/options/options.html'),
        warning: resolve(fileURLToPath(new URL('.', import.meta.url)), 'src/warning/warning.html'),
      },
      output: {
        entryFileNames: '[name].js',
        chunkFileNames: '[name].js',
        assetFileNames: '[name].[ext]',
      },
    },
    outDir: 'dist',
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(fileURLToPath(new URL('.', import.meta.url)), 'src'),
    },
  },
}); 