import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/vue3', () => ({
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
    usePage: () => ({ props: { name: 'Wand Game Guide' } }),
}));

vi.mock('@/routes', () => ({
    home: () => '/',
}));

import AuthSplitLayout from '@/layouts/auth/AuthSplitLayout.vue';

describe('AuthSplitLayout', () => {
    it("links the logo to the home route and shows the app name from the page's shared props", () => {
        const wrapper = mount(AuthSplitLayout);

        const link = wrapper.find('a');
        expect(link.attributes('href')).toBe('/');
        expect(link.text()).toContain('Wand Game Guide');
    });

    it('renders the title and description when provided', () => {
        const wrapper = mount(AuthSplitLayout, {
            props: { title: 'Log in', description: 'Welcome back' },
        });

        expect(wrapper.find('h1').exists()).toBe(true);
        expect(wrapper.find('h1').text()).toBe('Log in');
        expect(wrapper.text()).toContain('Welcome back');
    });

    it('omits the title and description headings entirely when not provided', () => {
        const wrapper = mount(AuthSplitLayout);

        expect(wrapper.find('h1').exists()).toBe(false);
    });

    it('renders slot content', () => {
        const wrapper = mount(AuthSplitLayout, {
            slots: { default: '<button>Submit</button>' },
        });

        expect(wrapper.find('button').text()).toBe('Submit');
    });
});
