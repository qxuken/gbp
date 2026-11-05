import babel from '@rolldown/plugin-babel';
import { reactCompilerPreset } from '@vitejs/plugin-react';
import path from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  plugins: [
    babel({
      presets: [
        reactCompilerPreset({
          sources: (filename: string) => filename.indexOf('src') !== -1,
        }),
      ],
    }),
  ],
  resolve: { alias: { '@': path.resolve(import.meta.dirname, 'src') } },
  test: { environment: 'jsdom', restoreMocks: true },
});
