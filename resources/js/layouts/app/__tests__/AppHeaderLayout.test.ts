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
        props: ['variant'],
        template:
            '<div data-testid="app-content" :data-variant="variant"><slot /></div>',
    },
}));

vi.mock('@/components/AppHeader.vue', () => ({
    default: {
        props: ['breadcrumbs'],
        template:
            '<div data-testid="app-header" :data-breadcrumbs="JSON.stringify(breadcrumbs)" />',
    },
}));

vi.mock('@/components/ui/sonner', () => ({
    Toaster: { template: '<div data-testid="toaster" />' },
}));

import AppHeaderLayout from '@/layouts/app/AppHeaderLayout.vue';

describe('AppHeaderLayout', () => {
    it('renders AppShell with the header variant', () => {
        const wrapper = mount(AppHeaderLayout);

        expect(
            wrapper.find('[data-testid="app-shell"]').attributes(
                'data-variant',
            ),
        ).toBe('header');
    });

    it('renders AppContent with the header variant, nested inside the shell', () => {
        const wrapper = mount(AppHeaderLayout);

        const content = wrapper.find(
            '[data-testid="app-shell"] [data-testid="app-content"]',
        );
        expect(content.exists()).toBe(true);
        expect(content.attributes('data-variant')).toBe('header');
    });

    it('defaults breadcrumbs to an empty array and forwards them to AppHeader', () => {
        const wrapper = mount(AppHeaderLayout);

        expect(
            wrapper.find('[data-testid="app-header"]').attributes(
                'data-breadcrumbs',
            ),
        ).toBe('[]');
    });

    it('forwards a given breadcrumbs prop to AppHeader', () => {
        const breadcrumbs = [{ title: 'Game Guide', href: '/game-guide' }];
        const wrapper = mount(AppHeaderLayout, { props: { breadcrumbs } });

        expect(
            wrapper.find('[data-testid="app-header"]').attributes(
                'data-breadcrumbs',
            ),
        ).toBe(JSON.stringify(breadcrumbs));
    });

    it('renders the page slot content inside AppContent', () => {
        const wrapper = mount(AppHeaderLayout, {
            slots: { default: 'Page body' },
        });

        expect(
            wrapper.find('[data-testid="app-content"]').text(),
        ).toContain('Page body');
    });

    it('renders the Toaster', () => {
        const wrapper = mount(AppHeaderLayout);

        expect(wrapper.find('[data-testid="toaster"]').exists()).toBe(true);
    });
});
