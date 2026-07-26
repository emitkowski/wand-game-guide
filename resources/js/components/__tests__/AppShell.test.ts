import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({
        props: { sidebarOpen: true },
    }),
}));

import AppShell from '@/components/AppShell.vue';

describe('AppShell', () => {
    it('defaults to the sidebar variant, rendering a SidebarProvider', () => {
        const wrapper = mount(AppShell, {
            slots: { default: 'Shell content' },
        });

        expect(
            wrapper.find('[data-slot="sidebar-wrapper"]').exists(),
        ).toBe(true);
        expect(wrapper.text()).toContain('Shell content');
    });

    it('renders a plain full-height flex column for the header variant, without a sidebar wrapper', () => {
        const wrapper = mount(AppShell, {
            props: { variant: 'header' },
            slots: { default: 'Shell content' },
        });

        expect(
            wrapper.find('[data-slot="sidebar-wrapper"]').exists(),
        ).toBe(false);
        const root = wrapper.find('div');
        expect(root.classes()).toEqual(
            expect.arrayContaining(['min-h-screen', 'w-full', 'flex-col']),
        );
        expect(wrapper.text()).toContain('Shell content');
    });
});
