import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { updateTheme, useAppearance } from '@/composables/useAppearance';

describe('updateTheme', () => {
    afterEach(() => {
        document.documentElement.classList.remove('dark');
    });

    it('adds the dark class when set to dark', () => {
        updateTheme('dark');

        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('removes the dark class when set to light', () => {
        document.documentElement.classList.add('dark');

        updateTheme('light');

        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
});

describe('useAppearance', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.classList.remove('dark');
        document.cookie =
            'appearance=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
    });

    it('persists the chosen appearance to localStorage and a cookie', () => {
        const { updateAppearance, appearance } = useAppearance();

        updateAppearance('dark');

        expect(appearance.value).toBe('dark');
        expect(localStorage.getItem('appearance')).toBe('dark');
        expect(document.cookie).toContain('appearance=dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('resolves "system" against the light theme when the OS has no preference for dark', () => {
        const { updateAppearance, resolvedAppearance } = useAppearance();

        updateAppearance('system');

        expect(resolvedAppearance.value).toBe('light');
    });
});
