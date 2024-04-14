/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  esbuild: {
    target: 'es2020',
  },

  test: {
    watch: false,
    coverage: {
      exclude: [...configDefaults.exclude, 'src/types'],
    },
  },
  plugins: [tsconfigPaths()],
});
