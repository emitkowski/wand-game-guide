import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/vue3', () => ({
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
}));

import Breadcrumbs from '@/components/Breadcrumbs.vue';

describe('Breadcrumbs', () => {
    it('renders the final breadcrumb as the current page, not a link', () => {
        const wrapper = mount(Breadcrumbs, {
            props: {
                breadcrumbs: [
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Game Guide', href: '/game-guide' },
                ],
            },
        });

        const page = wrapper.find('[data-slot="breadcrumb-page"]');
        expect(page.exists()).toBe(true);
        expect(page.text()).toBe('Game Guide');
    });

    it('renders every non-final breadcrumb as a link with its href', () => {
        const wrapper = mount(Breadcrumbs, {
            props: {
                breadcrumbs: [
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Game Guide', href: '/game-guide' },
                ],
            },
        });

        const links = wrapper.findAll('a');
        expect(links).toHaveLength(1);
        expect(links[0].attributes('href')).toBe('/dashboard');
        expect(links[0].text()).toBe('Dashboard');
    });

    it('renders a separator between items but not after the last one', () => {
        const wrapper = mount(Breadcrumbs, {
            props: {
                breadcrumbs: [
                    { title: 'Dashboard', href: '/dashboard' },
                    { title: 'Game Guide', href: '/game-guide' },
                ],
            },
        });

        expect(
            wrapper.findAll('[data-slot="breadcrumb-separator"]'),
        ).toHaveLength(1);
    });

    it('renders a single breadcrumb as the current page with no separator', () => {
        const wrapper = mount(Breadcrumbs, {
            props: {
                breadcrumbs: [{ title: 'Dashboard', href: '/dashboard' }],
            },
        });

        expect(wrapper.find('[data-slot="breadcrumb-page"]').text()).toBe(
            'Dashboard',
        );
        expect(wrapper.findAll('a')).toHaveLength(0);
        expect(
            wrapper.findAll('[data-slot="breadcrumb-separator"]'),
        ).toHaveLength(0);
    });
});
