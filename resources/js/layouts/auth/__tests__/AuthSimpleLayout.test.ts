import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/vue3', () => ({
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
}));

vi.mock('@/routes', () => ({
    home: () => '/',
}));

import AuthSimpleLayout from '@/layouts/auth/AuthSimpleLayout.vue';

describe('AuthSimpleLayout', () => {
    it('links the logo to the home route', () => {
        const wrapper = mount(AuthSimpleLayout);

        expect(wrapper.find('a').attributes('href')).toBe('/');
    });

    it('renders the title as a heading and the description below it', () => {
        const wrapper = mount(AuthSimpleLayout, {
            props: { title: 'Log in', description: 'Welcome back' },
        });

        expect(wrapper.find('h1').text()).toBe('Log in');
        expect(wrapper.text()).toContain('Welcome back');
    });

    it('renders slot content', () => {
        const wrapper = mount(AuthSimpleLayout, {
            slots: { default: '<button>Submit</button>' },
        });

        expect(wrapper.find('button').text()).toBe('Submit');
    });
});
