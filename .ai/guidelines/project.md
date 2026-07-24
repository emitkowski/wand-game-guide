# Project

This is a Laravel 13 application. It uses Fortify with Inertia.js, Vue 3, and TypeScript
(Laravel's official Vue starter kit) for the frontend, including a shadcn-vue/Reka UI component
library and typed routes/actions via Wayfinder.

## Development Workflow

- Start the environment: `./vendor/bin/sail up -d`
- Build assets: `npm run dev` (HMR) or `npm run build` (production)
- The app runs at `https://{APP_DOMAIN}` — requires the shared nginx proxy (`~/code/dev-local/proxy`) and a valid mkcert cert in `docker/certs/`
- Auth features (registration, email verification, 2FA, passkeys) can be toggled per project via `./vendor/bin/sail artisan install:features`
- Feature flags: Laravel Pennant is installed (database store). Use `Feature::active('flag-name')` or `$user->features()->active('flag-name')`. See `docs/FEATURE_FLAGS.md` for the active-flag registry this project maintains.
