import { mount } from '@vue/test-utils';
import { defineComponent } from 'vue';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/components/Breadcrumbs.vue', () => ({
    default: {
        props: ['breadcrumbs'],
        template:
            '<nav data-testid="breadcrumbs"><span v-for="item in breadcrumbs" :key="item.title">{{ item.title }}</span></nav>',
    },
}));

import AppSidebarHeader from '@/components/AppSidebarHeader.vue';
import { SidebarProvider } from '@/components/ui/sidebar';

// SidebarTrigger (a real ui/sidebar component used here) calls useSidebar()
// and throws unless rendered inside a real SidebarProvider.
function mountHeader(props: Record<string, unknown> = {}) {
    const Harness = defineComponent({
        components: { SidebarProvider, AppSidebarHeader },
        props: ['breadcrumbs'],
        template:
            '<SidebarProvider><AppSidebarHeader :breadcrumbs="breadcrumbs" /></SidebarProvider>',
    });

    return mount(Harness, { props });
}

describe('AppSidebarHeader', () => {
    it('renders the sidebar trigger button', () => {
        const wrapper = mountHeader();

        expect(
            wrapper.find('[data-slot="sidebar-trigger"]').exists(),
        ).toBe(true);
    });

    it('does not render Breadcrumbs when the breadcrumbs list is empty', () => {
        const wrapper = mountHeader({ breadcrumbs: [] });

        expect(wrapper.find('[data-testid="breadcrumbs"]').exists()).toBe(
            false,
        );
    });

    it('does not render Breadcrumbs when no breadcrumbs prop is given (default)', () => {
        const wrapper = mountHeader();

        expect(wrapper.find('[data-testid="breadcrumbs"]').exists()).toBe(
            false,
        );
    });

    it('renders Breadcrumbs with the given items when non-empty', () => {
        const breadcrumbs = [
            { title: 'Dashboard', href: '/dashboard' },
            { title: 'Game Guide', href: '/game-guide' },
        ];
        const wrapper = mountHeader({ breadcrumbs });

        const rendered = wrapper.find('[data-testid="breadcrumbs"]');
        expect(rendered.exists()).toBe(true);
        expect(rendered.text()).toContain('Dashboard');
        expect(rendered.text()).toContain('Game Guide');
    });
});
