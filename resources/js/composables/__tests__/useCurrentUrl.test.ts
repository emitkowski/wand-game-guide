import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({ url: '/settings/profile?tab=general' }),
}));

import { useCurrentUrl } from '@/composables/useCurrentUrl';

describe('useCurrentUrl', () => {
    it('exposes the current pathname (query string stripped) as currentUrl', () => {
        const { currentUrl } = useCurrentUrl();

        expect(currentUrl.value).toBe('/settings/profile');
    });

    it('isCurrentUrl matches the current page for a plain string href', () => {
        const { isCurrentUrl } = useCurrentUrl();

        expect(isCurrentUrl('/settings/profile')).toBe(true);
        expect(isCurrentUrl('/settings/security')).toBe(false);
    });

    it('isCurrentUrl matches an object href via its url property', () => {
        const { isCurrentUrl } = useCurrentUrl();

        expect(
            isCurrentUrl({ url: '/settings/profile', method: 'get' }),
        ).toBe(true);
    });

    it('isCurrentUrl compares against an explicit currentUrl override instead of the page url', () => {
        const { isCurrentUrl } = useCurrentUrl();

        expect(isCurrentUrl('/dashboard', '/dashboard')).toBe(true);
        expect(isCurrentUrl('/dashboard', '/settings/profile')).toBe(false);
    });

    it('isCurrentUrl only matches an exact path by default (startsWith=false)', () => {
        const { isCurrentUrl } = useCurrentUrl();

        expect(isCurrentUrl('/settings', undefined, false)).toBe(false);
    });

    it('isCurrentOrParentUrl matches a parent path prefix', () => {
        const { isCurrentOrParentUrl } = useCurrentUrl();

        expect(isCurrentOrParentUrl('/settings')).toBe(true);
        expect(isCurrentOrParentUrl('/settings/profile')).toBe(true);
        expect(isCurrentOrParentUrl('/game-guide')).toBe(false);
    });

    it('isCurrentUrl compares the pathname of an absolute URL href', () => {
        const { isCurrentUrl } = useCurrentUrl();

        expect(
            isCurrentUrl('https://example.com/settings/profile'),
        ).toBe(true);
        expect(
            isCurrentUrl('https://example.com/settings/security'),
        ).toBe(false);
    });

    it('isCurrentUrl returns false for a malformed absolute URL instead of throwing', () => {
        const { isCurrentUrl } = useCurrentUrl();

        expect(isCurrentUrl('http://')).toBe(false);
    });

    it('whenCurrentUrl returns the "true" value when on the given url, "false"/null value otherwise', () => {
        const { whenCurrentUrl } = useCurrentUrl();

        expect(whenCurrentUrl('/settings/profile', 'active')).toBe('active');
        expect(whenCurrentUrl('/dashboard', 'active')).toBeNull();
        expect(whenCurrentUrl('/dashboard', 'active', 'inactive')).toBe(
            'inactive',
        );
    });
});
