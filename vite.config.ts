import { defineConfig } from 'vite';

export default defineConfig({
    build: {
        lib: {
            entry: 'src/guardian-alerts-card.ts',
            formats: ['es'],
            fileName: () => 'guardian-alerts-card.js',
        },
        rollupOptions: {
            // Inline all dependencies so it runs stand-alone in Lovelace
            external: [],
        },
    },
});