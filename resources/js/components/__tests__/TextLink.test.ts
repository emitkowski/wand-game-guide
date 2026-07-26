import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/vue3', () => ({
    Link: {
        props: ['href', 'tabindex', 'method', 'as'],
        template:
            '<a :href="href" :tabindex="tabindex" :data-method="method" :data-as="as"><slot /></a>',
    },
}));

import TextLink from '@/components/TextLink.vue';

describe('TextLink', () => {
    it('renders the slot content inside a Link with the given href', () => {
        const wrapper = mount(TextLink, {
            props: { href: '/login' },
            slots: { default: 'Log in' },
        });

        const link = wrapper.find('a');
        expect(link.attributes('href')).toBe('/login');
        expect(link.text()).toBe('Log in');
    });

    it('forwards tabindex, method, and as props through to the Link', () => {
        const wrapper = mount(TextLink, {
            props: {
                href: '/logout',
                tabindex: 3,
                method: 'post',
                as: 'button',
            },
            slots: { default: 'Log out' },
        });

        const link = wrapper.find('a');
        expect(link.attributes('tabindex')).toBe('3');
        expect(link.attributes('data-method')).toBe('post');
        expect(link.attributes('data-as')).toBe('button');
    });
});
