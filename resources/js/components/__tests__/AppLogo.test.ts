import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AppLogo from '@/components/AppLogo.vue';
import AppLogoIcon from '@/components/AppLogoIcon.vue';

describe('AppLogo', () => {
    it('renders the app name', () => {
        const wrapper = mount(AppLogo);

        expect(wrapper.text()).toContain('Wand Game Guide');
    });

    it('renders the logo icon', () => {
        const wrapper = mount(AppLogo);

        expect(wrapper.findComponent(AppLogoIcon).exists()).toBe(true);
        expect(wrapper.find('svg').exists()).toBe(true);
    });
});
