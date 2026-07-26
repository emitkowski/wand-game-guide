import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AppContent from '@/components/AppContent.vue';

describe('AppContent', () => {
    it('defaults to the sidebar variant, rendering a SidebarInset (main[data-slot=sidebar-inset])', () => {
        const wrapper = mount(AppContent, {
            slots: { default: 'Page content' },
        });

        const main = wrapper.find('main');
        expect(main.exists()).toBe(true);
        expect(main.attributes('data-slot')).toBe('sidebar-inset');
        expect(wrapper.text()).toContain('Page content');
    });

    it('renders a plain constrained <main> for the header variant', () => {
        const wrapper = mount(AppContent, {
            props: { variant: 'header' },
            slots: { default: 'Page content' },
        });

        const main = wrapper.find('main');
        expect(main.exists()).toBe(true);
        expect(main.attributes('data-slot')).toBeUndefined();
        expect(main.classes()).toEqual(
            expect.arrayContaining(['mx-auto', 'max-w-7xl']),
        );
        expect(wrapper.text()).toContain('Page content');
    });

    it('applies the class prop in both variants', () => {
        const sidebarWrapper = mount(AppContent, {
            props: { variant: 'sidebar', class: 'overflow-x-hidden' },
        });
        expect(sidebarWrapper.find('main').classes()).toContain(
            'overflow-x-hidden',
        );

        const headerWrapper = mount(AppContent, {
            props: { variant: 'header', class: 'overflow-x-hidden' },
        });
        expect(headerWrapper.find('main').classes()).toContain(
            'overflow-x-hidden',
        );
    });
});
