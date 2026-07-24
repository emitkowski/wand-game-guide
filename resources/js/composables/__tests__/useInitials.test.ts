import { describe, expect, it } from 'vitest';
import { getInitials } from '@/composables/useInitials';

describe('getInitials', () => {
    it('returns an empty string when no name is given', () => {
        expect(getInitials()).toBe('');
        expect(getInitials('')).toBe('');
    });

    it('returns a single initial for a one-word name', () => {
        expect(getInitials('Madonna')).toBe('M');
    });

    it('returns first and last initials for multi-word names', () => {
        expect(getInitials('Test User')).toBe('TU');
        expect(getInitials('  Jean   Paul   Sartre  ')).toBe('JS');
    });

    it('uppercases the initials', () => {
        expect(getInitials('test user')).toBe('TU');
    });
});
