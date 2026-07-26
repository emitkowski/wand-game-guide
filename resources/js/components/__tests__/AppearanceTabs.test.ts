import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import AppearanceTabs from '@/components/AppearanceTabs.vue';
import { useAppearance } from '@/composables/useAppearance';

describe('AppearanceTabs', () => {
    beforeEach(() => {
        localStorage.clear();
        document.documentElement.classList.remove('dark');
        // useAppearance's `appearance` ref is a module-level singleton, so
        // reset it to a known value before each test (see
        // docs/memory/testing.md pattern of not trusting cross-test state).
        const { updateAppearance } = useAppearance();
        updateAppearance('system');
    });

    afterEach(() => {
        document.documentElement.classList.remove('dark');
        localStorage.clear();
    });

    it('renders a tab for each appearance option', () => {
        const wrapper = mount(AppearanceTabs);

        const buttons = wrapper.findAll('button');
        expect(buttons).toHaveLength(3);
        expect(wrapper.text()).toContain('Light');
        expect(wrapper.text()).toContain('Dark');
        expect(wrapper.text()).toContain('System');
    });

    it('marks the currently selected appearance as active', () => {
        const wrapper = mount(AppearanceTabs);

        const systemButton = wrapper
            .findAll('button')
            .find((button) => button.text().includes('System'))!;

        expect(systemButton.classes()).toContain('bg-white');
    });

    it('updates the appearance, persists it, and re-renders the active tab when a tab is clicked', async () => {
        const wrapper = mount(AppearanceTabs);

        const darkButton = wrapper
            .findAll('button')
            .find((button) => button.text().includes('Dark'))!;

        await darkButton.trigger('click');

        expect(localStorage.getItem('appearance')).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(
            true,
        );
        expect(darkButton.classes()).toContain('bg-white');
    });
});
