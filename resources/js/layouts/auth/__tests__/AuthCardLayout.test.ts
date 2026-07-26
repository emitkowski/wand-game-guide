import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/vue3', () => ({
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
}));

vi.mock('@/routes', () => ({
    home: () => '/',
}));

import AuthCardLayout from '@/layouts/auth/AuthCardLayout.vue';

describe('AuthCardLayout', () => {
    it('links the logo to the home route', () => {
        const wrapper = mount(AuthCardLayout);

        expect(wrapper.find('a').attributes('href')).toBe('/');
    });

    it('renders the title and description inside the card header', () => {
        const wrapper = mount(AuthCardLayout, {
            props: { title: 'Log in', description: 'Welcome back' },
        });

        expect(
            wrapper.find('[data-slot="card-title"]').text(),
        ).toBe('Log in');
        expect(
            wrapper.find('[data-slot="card-description"]').text(),
        ).toBe('Welcome back');
    });

    it('renders slot content inside the card content area', () => {
        const wrapper = mount(AuthCardLayout, {
            slots: { default: '<button>Submit</button>' },
        });

        expect(
            wrapper.find('[data-slot="card-content"] button').text(),
        ).toBe('Submit');
    });
});
