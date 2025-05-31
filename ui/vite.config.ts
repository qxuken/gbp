import tailwindcss from '@tailwindcss/vite';
import { TanStackRouterVite } from '@tanstack/router-plugin/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig } from 'vite';

const ReactCompilerConfig = {
  sources: (filename: string) => filename.indexOf('src') !== -1,
};

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    TanStackRouterVite({ target: 'react', autoCodeSplitting: true }),
    react({
      babel: {
        plugins: [['babel-plugin-react-compiler', ReactCompilerConfig]],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          tanstack: ['@tanstack/react-router', '@tanstack/react-query'],
          dexie: ['dexie', 'dexie-react-hooks'],
          pocketbase: ['pocketbase'],
          zod: ['zod/v4-mini'],
          motion: ['motion'],
          'dnd-kit': [
            '@dnd-kit/core',
            '@dnd-kit/sortable',
            '@dnd-kit/utilities',
          ],
          icons: ['lucide-react'],
          sonner: ['sonner'],
          zustand: ['zustand'],
          fuzzysearch: ['fuzzysearch'],
          immer: ['immer'],
          tailwind: ['tailwind-merge', 'clsx'],
          radix: [
            '@radix-ui/react-alert-dialog',
            '@radix-ui/react-avatar',
            '@radix-ui/react-collapsible',
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-label',
            '@radix-ui/react-popover',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-select',
            '@radix-ui/react-separator',
            '@radix-ui/react-slot',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
        },
      },
    },
  },
});
