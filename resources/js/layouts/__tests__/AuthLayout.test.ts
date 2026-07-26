import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@/layouts/auth/AuthSimpleLayout.vue', () => ({
    default: {
        props: ['title', 'description'],
        template:
            '<div data-testid="auth-simple-layout" :data-title="title" :data-description="description"><slot /></div>',
    },
}));

import AuthLayout from '@/layouts/AuthLayout.vue';

describe('AuthLayout', () => {
    it('renders its slot content through the simple auth layout', () => {
        const wrapper = mount(AuthLayout, {
            slots: { default: 'Form fields' },
        });

        expect(wrapper.text()).toContain('Form fields');
    });

    it('defaults title and description to empty strings', () => {
        const wrapper = mount(AuthLayout);
        const inner = wrapper.find('[data-testid="auth-simple-layout"]');

        expect(inner.attributes('data-title')).toBe('');
        expect(inner.attributes('data-description')).toBe('');
    });

    it('forwards the title and description props', () => {
        const wrapper = mount(AuthLayout, {
            props: { title: 'Log in', description: 'Welcome back' },
        });
        const inner = wrapper.find('[data-testid="auth-simple-layout"]');

        expect(inner.attributes('data-title')).toBe('Log in');
        expect(inner.attributes('data-description')).toBe('Welcome back');
    });
});
