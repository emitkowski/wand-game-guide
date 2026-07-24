import type { AxiosStatic } from 'axios';
import type Echo from 'laravel-echo';
import type Pusher from 'pusher-js';

declare global {
    interface Window {
        axios: AxiosStatic;
        Echo: Echo<'reverb'>;
        Pusher: typeof Pusher;
    }
}
