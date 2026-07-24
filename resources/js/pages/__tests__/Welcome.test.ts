import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/vue3', () => ({
    Head: { template: '<head-stub><slot /></head-stub>' },
    Link: { template: '<a><slot /></a>', props: ['href'] },
}));

vi.mock('@/routes', () => ({
    dashboard: () => '/dashboard',
    login: () => '/login',
    register: () => '/register',
}));

import Welcome from '@/pages/Welcome.vue';

describe('Welcome', () => {
    it('shows login and register links for guests', () => {
        const wrapper = mount(Welcome, {
            global: { mocks: { $page: { props: { auth: {} } } } },
        });

        expect(wrapper.text()).toContain('Log in');
    });

    it('shows a dashboard link for authenticated users', () => {
        const wrapper = mount(Welcome, {
            global: {
                mocks: { $page: { props: { auth: { user: { id: 1 } } } } },
            },
        });

        expect(wrapper.text()).toContain('Dashboard');
    });
});
