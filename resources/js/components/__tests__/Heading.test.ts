import { mount } from '@vue/test-utils';
import { describe, expect, it } from 'vitest';
import Heading from '@/components/Heading.vue';

describe('Heading', () => {
    it('renders the title and description with default (large) styling', () => {
        const wrapper = mount(Heading, {
            props: { title: 'Settings', description: 'Manage your account' },
        });

        expect(wrapper.find('h2').text()).toBe('Settings');
        expect(wrapper.find('h2').classes()).toContain(
            'text-xl',
        );
        expect(wrapper.find('p').text()).toBe('Manage your account');
    });

    it('does not render a description paragraph when none is provided', () => {
        const wrapper = mount(Heading, { props: { title: 'Settings' } });

        expect(wrapper.find('p').exists()).toBe(false);
    });

    it('applies the small variant styling', () => {
        const wrapper = mount(Heading, {
            props: { title: 'Settings', variant: 'small' },
        });

        expect(wrapper.find('h2').classes()).toContain('text-base');
        expect(wrapper.find('header').classes()).not.toContain('mb-8');
    });
});
