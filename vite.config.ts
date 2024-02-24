/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';

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
});
