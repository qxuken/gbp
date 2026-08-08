import babel from '@rolldown/plugin-babel';
import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import tanstackRouter from '@tanstack/router-plugin/vite';
import react, { reactCompilerPreset } from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const reactCompiler = reactCompilerPreset({
  sources: (filename: string) => filename.indexOf('src') !== -1,
});

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackRouter({ target: 'react', autoCodeSplitting: true }),
    react(),
    babel({ presets: [reactCompiler] }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  build: {
    sourcemap: true,
    rolldownOptions: {
      input: {
        main: path.resolve(import.meta.dirname, 'index.html'),
        monitor: path.resolve(import.meta.dirname, 'monitor.html'),
      },
      output: {
        codeSplitting: {
          groups: [
            {
              name: 'tanstack',
              test: /node_modules[\\/]@tanstack[\\/]react-(router|query)(?:[\\/]|$)/,
            },
            {
              name: 'dexie',
              test: /node_modules[\\/]dexie(?:-react-hooks)?(?:[\\/]|$)/,
            },
            {
              name: 'pocketbase',
              test: /node_modules[\\/]pocketbase(?:[\\/]|$)/,
            },
            { name: 'zod', test: /node_modules[\\/]zod(?:[\\/]|$)/ },
            { name: 'motion', test: /node_modules[\\/]motion(?:[\\/]|$)/ },
            { name: 'dnd-kit', test: /node_modules[\\/]@dnd-kit[\\/]/ },
            { name: 'icons', test: /node_modules[\\/]lucide-react(?:[\\/]|$)/ },
            { name: 'sonner', test: /node_modules[\\/]sonner(?:[\\/]|$)/ },
            { name: 'zustand', test: /node_modules[\\/]zustand(?:[\\/]|$)/ },
            {
              name: 'fuzzysearch',
              test: /node_modules[\\/]fuzzysearch(?:[\\/]|$)/,
            },
            { name: 'immer', test: /node_modules[\\/]immer(?:[\\/]|$)/ },
            {
              name: 'tailwind',
              test: /node_modules[\\/](tailwind-merge|clsx)(?:[\\/]|$)/,
            },
            { name: 'radix', test: /node_modules[\\/]@radix-ui[\\/]/ },
          ],
        },
      },
    },
  },
});
