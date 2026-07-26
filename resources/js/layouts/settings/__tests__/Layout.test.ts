import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/vue3', () => ({
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
    usePage: () => ({ url: '/settings/profile' }),
}));

vi.mock('@/routes/profile', () => ({ edit: () => '/settings/profile' }));
vi.mock('@/routes/security', () => ({ edit: () => '/settings/security' }));
vi.mock('@/routes/appearance', () => ({ edit: () => '/settings/appearance' }));

import SettingsLayout from '@/layouts/settings/Layout.vue';

describe('settings/Layout', () => {
    it('renders a nav link for Profile, Security, and Appearance', () => {
        const wrapper = mount(SettingsLayout);

        const nav = wrapper.find('nav[aria-label="Settings"]');
        const links = nav.findAll('a');
        const hrefs = links.map((link) => link.attributes('href'));
        const titles = links.map((link) => link.text());

        expect(hrefs).toEqual([
            '/settings/profile',
            '/settings/security',
            '/settings/appearance',
        ]);
        expect(titles).toEqual(['Profile', 'Security', 'Appearance']);
    });

    it('highlights the nav item matching the current url', () => {
        const wrapper = mount(SettingsLayout);

        const profileLink = wrapper
            .findAll('a')
            .find((a) => a.text() === 'Profile');
        const securityLink = wrapper
            .findAll('a')
            .find((a) => a.text() === 'Security');

        // Button uses `as-child`, so its classes (including the active
        // `bg-muted` highlight) are merged directly onto the rendered
        // <a> element rather than wrapping it in a <button>.
        expect(profileLink?.classes()).toContain('bg-muted');
        expect(securityLink?.classes()).not.toContain('bg-muted');
    });

    it('renders the Settings heading', () => {
        const wrapper = mount(SettingsLayout);

        expect(wrapper.find('h2').text()).toBe('Settings');
        expect(wrapper.text()).toContain(
            'Manage your profile and account settings',
        );
    });

    it('renders slot content', () => {
        const wrapper = mount(SettingsLayout, {
            slots: { default: '<div>Profile form</div>' },
        });

        expect(wrapper.text()).toContain('Profile form');
    });
});
