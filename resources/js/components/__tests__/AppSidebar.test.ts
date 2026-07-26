import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/vue3', () => ({
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
    usePage: () => ({ props: { auth: { user: { id: 1 } } } }),
}));

vi.mock('@/routes', () => ({
    dashboard: () => '/dashboard',
}));

vi.mock('@/routes/game-guide', () => ({
    index: () => '/game-guide',
}));

// NavMain and NavUser are not owned by this test file (they're covered, if
// at all, by their own dedicated tests) — stub them so this test can focus
// purely on how AppSidebar composes the sidebar shell, its logo link, and
// which nav items it hands off to NavMain.
vi.mock('@/components/NavMain.vue', () => ({
    default: {
        props: ['items'],
        template:
            '<div data-testid="nav-main"><a v-for="item in items" :key="item.title" :href="item.href">{{ item.title }}</a></div>',
    },
}));

vi.mock('@/components/NavUser.vue', () => ({
    default: { template: '<div data-testid="nav-user" />' },
}));

import AppSidebar from '@/components/AppSidebar.vue';
import { SidebarProvider } from '@/components/ui/sidebar';

// AppSidebar renders a real `ui/sidebar` `<Sidebar>` internally, which (like
// NavUser) calls `useSidebar()` and throws if not rendered inside a real
// SidebarProvider — so it's mounted through one here, same as production.
function mountAppSidebar() {
    const Harness = defineComponent({
        components: { SidebarProvider, AppSidebar },
        template: '<SidebarProvider><AppSidebar /></SidebarProvider>',
    });

    return mount(Harness);
}

describe('AppSidebar', () => {
    it('links the logo to the dashboard', () => {
        const wrapper = mountAppSidebar();

        const logoLink = wrapper
            .findAll('a')
            .find((a) => a.text().includes('Wand Game Guide'));

        expect(logoLink?.attributes('href')).toBe('/dashboard');
    });

    it('passes Dashboard and Game Guide nav items to NavMain', () => {
        const wrapper = mountAppSidebar();

        const navMain = wrapper.find('[data-testid="nav-main"]');
        const items = navMain.findAll('a');

        expect(items.map((a) => a.text())).toEqual([
            'Dashboard',
            'Game Guide',
        ]);
        expect(items.map((a) => a.attributes('href'))).toEqual([
            '/dashboard',
            '/game-guide',
        ]);
    });

    it('renders NavUser in the sidebar footer', () => {
        const wrapper = mountAppSidebar();

        expect(wrapper.find('[data-testid="nav-user"]').exists()).toBe(true);
    });

    it('renders its default slot after the sidebar', () => {
        const Harness = defineComponent({
            components: { SidebarProvider, AppSidebar },
            template:
                '<SidebarProvider><AppSidebar>Slot content</AppSidebar></SidebarProvider>',
        });
        const wrapper = mount(Harness);

        expect(wrapper.text()).toContain('Slot content');
    });
});
