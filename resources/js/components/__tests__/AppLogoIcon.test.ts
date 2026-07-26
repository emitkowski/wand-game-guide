import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import AppLogoIcon from '@/components/AppLogoIcon.vue';

describe('AppLogoIcon', () => {
    it('renders an svg with the wand logo path', () => {
        const wrapper = mount(AppLogoIcon);

        const svg = wrapper.find('svg');
        expect(svg.exists()).toBe(true);
        expect(svg.find('path').exists()).toBe(true);
    });

    it('applies the className prop to the svg element', () => {
        const wrapper = mount(AppLogoIcon, {
            props: { className: 'size-9 text-white' },
        });

        expect(wrapper.find('svg').classes()).toEqual(
            expect.arrayContaining(['size-9', 'text-white']),
        );
    });

    it('forwards extra attributes to the svg element via $attrs (inheritAttrs is disabled)', () => {
        const wrapper = mount(AppLogoIcon, {
            attrs: { 'data-testid': 'logo-icon' },
        });

        expect(wrapper.find('svg').attributes('data-testid')).toBe(
            'logo-icon',
        );
    });
});
