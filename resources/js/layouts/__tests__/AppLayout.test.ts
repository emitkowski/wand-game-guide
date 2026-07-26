import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/layouts/app/AppSidebarLayout.vue', () => ({
    default: {
        props: ['breadcrumbs'],
        template:
            '<div data-testid="app-sidebar-layout" :data-breadcrumbs="JSON.stringify(breadcrumbs)"><slot /></div>',
    },
}));

import AppLayout from '@/layouts/AppLayout.vue';

describe('AppLayout', () => {
    it('renders its slot content through the sidebar layout', () => {
        const wrapper = mount(AppLayout, {
            slots: { default: 'Page body' },
        });

        expect(wrapper.text()).toContain('Page body');
    });

    it('defaults breadcrumbs to an empty array when none are passed', () => {
        const wrapper = mount(AppLayout);

        expect(
            wrapper.find('[data-testid="app-sidebar-layout"]').attributes(
                'data-breadcrumbs',
            ),
        ).toBe('[]');
    });

    it('forwards the breadcrumbs prop to the sidebar layout', () => {
        const breadcrumbs = [{ title: 'Game Guide', href: '/game-guide' }];
        const wrapper = mount(AppLayout, { props: { breadcrumbs } });

        expect(
            wrapper.find('[data-testid="app-sidebar-layout"]').attributes(
                'data-breadcrumbs',
            ),
        ).toBe(JSON.stringify(breadcrumbs));
    });
});
