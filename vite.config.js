import { defineConfig } from 'vite';

// `vite build --mode itch` makes a copy for itch.io: relative paths, because itch serves games from a subfolder.
export default defineConfig(({ mode }) => (mode === 'itch' ? { base: './', build: { outDir: 'dist-itch' } } : {}));
