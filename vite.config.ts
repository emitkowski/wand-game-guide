import fs from 'fs';
import inertia from '@inertiajs/vite';
import { wayfinder } from '@laravel/vite-plugin-wayfinder';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const port = parseInt(env.VITE_PORT || '5173');
    const domain = env.APP_DOMAIN || 'localhost';
    const certPath = './docker/certs/cert.pem';
    const keyPath = './docker/certs/key.pem';
    const hasCerts = fs.existsSync(certPath) && fs.existsSync(keyPath);

    return {
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.ts'],
                refresh: true,
                fonts: [
                    bunny('Instrument Sans', {
                        weights: [400, 500, 600],
                    }),
                ],
            }),
            inertia(),
            tailwindcss(),
            vue({
                template: {
                    transformAssetUrls: {
                        base: null,
                        includeAbsolute: false,
                    },
                },
            }),
            wayfinder({
                formVariants: true,
            }),
        ],
        server: {
            https: hasCerts ? { key: keyPath, cert: certPath } : false,
            host: '0.0.0.0',
            port,
            strictPort: true,
            hmr: {
                host: domain,
                port,
            },
        },
    };
});
