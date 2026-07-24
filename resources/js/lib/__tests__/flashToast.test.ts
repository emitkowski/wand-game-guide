import { beforeEach, describe, expect, it, vi } from 'vitest';
import { toast } from 'vue-sonner';
import { initializeFlashToast } from '@/lib/flashToast';

vi.mock('vue-sonner', () => ({
    toast: {
        success: vi.fn(),
        error: vi.fn(),
        info: vi.fn(),
        warning: vi.fn(),
    },
}));

// Inertia's router.on('flash', ...) subscribes to a real DOM CustomEvent
// dispatched on `document` — see @inertiajs/core's fireFlashEvent().
function dispatchFlash(flash: Record<string, unknown>) {
    document.dispatchEvent(
        new CustomEvent('inertia:flash', { detail: { flash } }),
    );
}

describe('initializeFlashToast', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows a toast matching the flashed type and message', () => {
        initializeFlashToast();

        dispatchFlash({
            toast: { type: 'success', message: 'Profile updated.' },
        });

        expect(toast.success).toHaveBeenCalledWith('Profile updated.');
    });

    it('does nothing when no toast payload is flashed', () => {
        initializeFlashToast();

        dispatchFlash({});

        expect(toast.success).not.toHaveBeenCalled();
        expect(toast.error).not.toHaveBeenCalled();
    });
});
