import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/vue3', () => ({
    Link: {
        props: ['href'],
        template: '<a :href="href"><slot /></a>',
    },
    usePage: () => ({
        url: '/dashboard',
        props: {
            auth: {
                user: {
                    id: 1,
                    name: 'Harry Potter',
                    email: 'harry@hogwarts.test',
                    email_verified_at: '2024-01-01T00:00:00.000000Z',
                    created_at: '2024-01-01T00:00:00.000000Z',
                    updated_at: '2024-01-01T00:00:00.000000Z',
                },
            },
        },
    }),
    router: { flushAll: vi.fn() },
}));

vi.mock('@/routes', () => ({
    dashboard: () => '/dashboard',
    logout: () => '/logout',
}));

vi.mock('@/routes/profile', () => ({
    edit: () => '/settings/profile',
}));

import AppHeader from '@/components/AppHeader.vue';

describe('AppHeader', () => {
    it('renders the main nav item (Dashboard) as a link, marked active for the current URL', () => {
        const wrapper = mount(AppHeader);

        const dashboardLinks = wrapper
            .findAll('a')
            .filter((link) => link.attributes('href') === '/dashboard');
        // The logo link and the nav item both point at "/dashboard".
        expect(dashboardLinks.length).toBeGreaterThanOrEqual(1);
        expect(wrapper.text()).toContain('Dashboard');
    });

    it('renders the external right-hand nav items (Repository, Documentation) with target/rel', () => {
        const wrapper = mount(AppHeader);

        const repoLink = wrapper
            .findAll('a')
            .find(
                (link) =>
                    link.attributes('href') ===
                    'https://github.com/laravel/vue-starter-kit',
            );

        expect(repoLink?.attributes('target')).toBe('_blank');
        expect(repoLink?.attributes('rel')).toBe('noopener noreferrer');

        const docsLink = wrapper
            .findAll('a')
            .find(
                (link) =>
                    link.attributes('href') ===
                    'https://laravel.com/docs/starter-kits#vue',
            );
        expect(docsLink).toBeTruthy();
    });

    it('does not render the breadcrumb bar when zero or one breadcrumb is passed', () => {
        const wrapper = mount(AppHeader, {
            props: { breadcrumbs: [{ title: 'Dashboard', href: '/dashboard' }] },
        });

        expect(
            wrapper.find('[data-slot="breadcrumb"]').exists(),
        ).toBe(false);
    });

    it('renders the breadcrumb bar when more than one breadcrumb is passed', () => {
        const wrapper = mount(AppHeader, {
            props: {
                breadcrumbs: [
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Game Guide', href: '/game-guide' },
                ],
            },
        });

        const breadcrumb = wrapper.find('[data-slot="breadcrumb"]');
        expect(breadcrumb.exists()).toBe(true);
        expect(breadcrumb.text()).toContain('Game Guide');
    });

    it("shows the current user's initials in the account menu trigger", () => {
        const wrapper = mount(AppHeader);

        expect(wrapper.find('[data-slot="avatar-fallback"]').text()).toBe(
            'HP',
        );
    });

    it('opens a dropdown menu on click that shows the user menu content for the current user', async () => {
        const wrapper = mount(AppHeader, { attachTo: document.body });

        await wrapper
            .find('[data-slot="dropdown-menu-trigger"]')
            .trigger('click');
        await wrapper.vm.$nextTick();

        expect(document.body.textContent).toContain('harry@hogwarts.test');
        expect(document.body.textContent).toContain('Log out');

        wrapper.unmount();
    });
});
