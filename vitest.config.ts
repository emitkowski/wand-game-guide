import { resolve } from 'path';
import vue from '@vitejs/plugin-vue';
import { defineConfig } from 'vitest/config';

export default defineConfig({
    plugins: [vue()],
    test: {
        environment: 'jsdom',
        globals: true,
        setupFiles: ['./resources/js/test-setup.ts'],
        include: ['resources/js/**/*.{test,spec}.{js,ts}'],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'html'],
            include: ['resources/js/**/*.{ts,vue}'],
            exclude: [
                'resources/js/app.ts',
                'resources/js/bootstrap.ts',
                'resources/js/components/ui/**',
                'resources/js/actions/**',
                'resources/js/routes/**',
                'resources/js/wayfinder/**',
                'resources/js/test-support/**',
            ],
        },
    },
    resolve: {
        alias: {
            '@': resolve(__dirname, 'resources/js'),
        },
    },
});
