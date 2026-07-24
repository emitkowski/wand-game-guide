import { describe, expect, it } from 'vitest';
import { cn, toUrl } from '@/lib/utils';

describe('cn', () => {
    it('merges class names and resolves tailwind conflicts', () => {
        expect(cn('px-2 py-1', 'px-4')).toBe('py-1 px-4');
    });

    it('drops falsy values', () => {
        expect(cn('foo', false, undefined, null, 'bar')).toBe('foo bar');
    });
});

describe('toUrl', () => {
    it('returns string hrefs unchanged', () => {
        expect(toUrl('/dashboard')).toBe('/dashboard');
    });

    it('extracts the url from an object href', () => {
        expect(toUrl({ url: '/settings/profile', method: 'get' })).toBe(
            '/settings/profile',
        );
    });
});
