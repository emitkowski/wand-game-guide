import { mount } from '@vue/test-utils';
import { LayoutGrid, MessagesSquare } from '@lucide/vue';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/vue3', () => ({
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
    usePage: () => ({
        url: '/dashboard',
        props: { auth: { user: { id: 1 } } },
    }),
}));

import NavMain from '@/components/NavMain.vue';
import { SidebarProvider } from '@/components/ui/sidebar';
import type { NavItem } from '@/types';

const items: NavItem[] = [
    { title: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { title: 'Game Guide', href: '/game-guide', icon: MessagesSquare },
];

function mountWithSidebar(navItems: NavItem[]) {
    return mount(
        {
            components: { SidebarProvider, NavMain },
            props: ['items'],
            template: '<SidebarProvider><NavMain :items="items" /></SidebarProvider>',
        },
        { props: { items: navItems } },
    );
}

describe('NavMain', () => {
    it('renders the "Platform" group label', () => {
        const wrapper = mountWithSidebar(items);

        expect(wrapper.text()).toContain('Platform');
    });

    it('renders one link per item, with its title and href', () => {
        const wrapper = mountWithSidebar(items);

        const links = wrapper.findAll('a');
        expect(links).toHaveLength(2);
        expect(links[0].attributes('href')).toBe('/dashboard');
        expect(links[0].text()).toContain('Dashboard');
        expect(links[1].attributes('href')).toBe('/game-guide');
        expect(links[1].text()).toContain('Game Guide');
    });

    it('marks the item matching the current URL as active, and others as inactive', () => {
        const wrapper = mountWithSidebar(items);

        const buttons = wrapper.findAll('[data-sidebar="menu-button"]');
        const dashboardButton = buttons.find((button) =>
            button.text().includes('Dashboard'),
        )!;
        const gameGuideButton = buttons.find((button) =>
            button.text().includes('Game Guide'),
        )!;

        expect(dashboardButton.attributes('data-active')).toBe('true');
        expect(gameGuideButton.attributes('data-active')).toBe('false');
    });
});
