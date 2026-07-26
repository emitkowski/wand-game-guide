import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/AppShell.vue', () => ({
    default: {
        props: ['variant'],
        template: '<div data-testid="app-shell" :data-variant="variant"><slot /></div>',
    },
}));

vi.mock('@/components/AppContent.vue', () => ({
    default: {
        props: ['variant', 'class'],
        template:
            '<div data-testid="app-content" :data-variant="variant" :class="$props.class"><slot /></div>',
    },
}));

vi.mock('@/components/AppSidebar.vue', () => ({
    default: { template: '<div data-testid="app-sidebar" />' },
}));

vi.mock('@/components/AppSidebarHeader.vue', () => ({
    default: {
        props: ['breadcrumbs'],
        template:
            '<div data-testid="app-sidebar-header" :data-breadcrumbs="JSON.stringify(breadcrumbs)" />',
    },
}));

vi.mock('@/components/ui/sonner', () => ({
    Toaster: { template: '<div data-testid="toaster" />' },
}));

import AppSidebarLayout from '@/layouts/app/AppSidebarLayout.vue';

describe('AppSidebarLayout', () => {
    it('renders AppShell with the sidebar variant', () => {
        const wrapper = mount(AppSidebarLayout);

        expect(
            wrapper.find('[data-testid="app-shell"]').attributes(
                'data-variant',
            ),
        ).toBe('sidebar');
    });

    it('renders AppSidebar and AppContent (with overflow-x-hidden) inside the shell', () => {
        const wrapper = mount(AppSidebarLayout);

        const shell = wrapper.find('[data-testid="app-shell"]');
        expect(
            shell.find('[data-testid="app-sidebar"]').exists(),
        ).toBe(true);

        const content = shell.find('[data-testid="app-content"]');
        expect(content.exists()).toBe(true);
        expect(content.attributes('data-variant')).toBe('sidebar');
        expect(content.classes()).toContain('overflow-x-hidden');
    });

    it('defaults breadcrumbs to an empty array and forwards them to AppSidebarHeader', () => {
        const wrapper = mount(AppSidebarLayout);

        expect(
            wrapper.find('[data-testid="app-sidebar-header"]').attributes(
                'data-breadcrumbs',
            ),
        ).toBe('[]');
    });

    it('forwards a given breadcrumbs prop to AppSidebarHeader', () => {
        const breadcrumbs = [{ title: 'Game Guide', href: '/game-guide' }];
        const wrapper = mount(AppSidebarLayout, { props: { breadcrumbs } });

        expect(
            wrapper.find('[data-testid="app-sidebar-header"]').attributes(
                'data-breadcrumbs',
            ),
        ).toBe(JSON.stringify(breadcrumbs));
    });

    it('renders the page slot content inside AppContent, after the sidebar header', () => {
        const wrapper = mount(AppSidebarLayout, {
            slots: { default: 'Page body' },
        });

        expect(
            wrapper.find('[data-testid="app-content"]').text(),
        ).toContain('Page body');
    });

    it('renders the Toaster', () => {
        const wrapper = mount(AppSidebarLayout);

        expect(wrapper.find('[data-testid="toaster"]').exists()).toBe(true);
    });
});
