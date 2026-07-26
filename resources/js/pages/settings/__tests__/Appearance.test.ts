import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/vue3', () => ({
    Head: { template: '<head-stub><slot /></head-stub>' },
}));

vi.mock('@/routes/appearance', () => ({
    edit: () => '/settings/appearance',
}));

import Appearance from '@/pages/settings/Appearance.vue';

describe('settings/Appearance', () => {
    it('renders the appearance settings heading and tabs', () => {
        const wrapper = mount(Appearance, {
            global: { stubs: { AppearanceTabs: true } },
        });

        expect(wrapper.text()).toContain('Appearance settings');
        expect(
            wrapper.findComponent({ name: 'AppearanceTabs' }).exists(),
        ).toBe(true);

        wrapper.unmount();
    });
});
