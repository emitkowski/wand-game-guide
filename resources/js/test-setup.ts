import { config } from '@vue/test-utils';
import { vi } from 'vitest';

// Make $page available inside every Vue template under test, matching the
// shared props HandleInertiaRequests::share() sends on every request.
config.global.mocks = {
    $page: {
        props: {
            name: 'Test App',
            auth: {
                user: {
                    id: 1,
                    name: 'Test User',
                    email: 'test@example.com',
                    email_verified_at: '2024-01-01T00:00:00.000000Z',
                    two_factor_enabled: false,
                    created_at: '2024-01-01T00:00:00.000000Z',
                    updated_at: '2024-01-01T00:00:00.000000Z',
                },
            },
            sidebarOpen: true,
        },
    },
};

// Clipboard API
Object.defineProperty(navigator, 'clipboard', {
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
    writable: true,
});

// Stable window.location.origin
Object.defineProperty(window, 'location', {
    value: { origin: 'https://example.com', href: 'https://example.com' },
    writable: true,
});

// jsdom doesn't implement HTMLDialogElement.showModal() / close()
if (typeof HTMLDialogElement !== 'undefined') {
    HTMLDialogElement.prototype.showModal = vi.fn();
    HTMLDialogElement.prototype.close = vi.fn();
}

// jsdom doesn't implement matchMedia
Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
        matches: false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
    })),
});

// window.axios / window.Echo — set by bootstrap.ts at runtime, stubbed here for components under test
window.axios = {
    post: vi.fn().mockResolvedValue({ data: {} }),
} as unknown as Window['axios'];
window.Echo = {
    channel: vi.fn().mockReturnValue({ listen: vi.fn() }),
    leaveChannel: vi.fn(),
} as unknown as Window['Echo'];
