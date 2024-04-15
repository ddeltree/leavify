/// <reference types="vitest" />
import { defineConfig } from 'vite';
import { configDefaults } from 'vitest/config';
import dts from 'vite-plugin-dts';
import tsconfigPaths from 'vite-tsconfig-paths';
import pkg from './package.json' assert { type: 'json' };

export default defineConfig({
  esbuild: {
    target: 'es2020',
  },
  build: {
    lib: {
      entry: './src/index.ts',
      formats: ['es'], // pure ESM package
    },
    rollupOptions: {
      external: [
        ...Object.keys(pkg.dependencies), // don't bundle dependencies
        /^node:.*/, // don't bundle built-in Node.js modules (use protocol imports!)
      ],
      output: {
        entryFileNames: '[name].js',
      },
    },
    target: 'esnext', // transpile as little as possible
  },
  test: {
    watch: false,
    coverage: {
      exclude: [...configDefaults.exclude, 'src/types'],
    },
  },
  plugins: [
    tsconfigPaths({
      configNames: ['tsconfig.build.json'],
    }),
    dts({ tsconfigPath: 'tsconfig.build.json' }),
  ],
});
