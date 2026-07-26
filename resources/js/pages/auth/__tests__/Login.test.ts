import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshFormTestState } from '@/test-support/formStub';
import type { FormTestState } from '@/test-support/formStub';

const formTestState: FormTestState = vi.hoisted(() => ({
    errors: {},
    processing: false,
}));

vi.mock('@inertiajs/vue3', async () => {
    const { createFormStub } = await import('@/test-support/formStub');

    return {
        Head: { template: '<head-stub><slot /></head-stub>' },
        Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
        Form: createFormStub(formTestState),
    };
});

vi.mock('@/routes', () => ({
    register: () => '/register',
}));

vi.mock('@/routes/login', () => ({
    store: { form: () => ({ action: '/login', method: 'post' }) },
}));

vi.mock('@/routes/password', () => ({
    request: () => '/forgot-password',
}));

import Login from '@/pages/auth/Login.vue';

describe('auth/Login', () => {
    let wrapper: ReturnType<typeof mount> | undefined;

    beforeEach(() => {
        Object.assign(formTestState, freshFormTestState());
    });

    afterEach(() => {
        wrapper?.unmount();
    });

    it('renders the email and password fields', () => {
        wrapper = mount(Login, { props: { canResetPassword: true } });

        expect(wrapper.find('#email').exists()).toBe(true);
        expect(wrapper.find('#password').exists()).toBe(true);
    });

    it('shows the "forgot your password" link when canResetPassword is true', () => {
        wrapper = mount(Login, { props: { canResetPassword: true } });

        expect(wrapper.text()).toContain('Forgot your password?');
    });

    it('hides the "forgot your password" link when canResetPassword is false', () => {
        wrapper = mount(Login, { props: { canResetPassword: false } });

        expect(wrapper.text()).not.toContain('Forgot your password?');
    });

    it('shows a status message when provided', () => {
        wrapper = mount(Login, {
            props: { canResetPassword: true, status: 'Password reset!' },
        });

        expect(wrapper.text()).toContain('Password reset!');
    });

    it('does not show a status message when absent', () => {
        wrapper = mount(Login, { props: { canResetPassword: true } });

        expect(wrapper.text()).not.toContain('Password reset!');
    });

    it('displays field-level validation errors', () => {
        formTestState.errors = { email: 'These credentials do not match.' };
        wrapper = mount(Login, { props: { canResetPassword: true } });

        expect(wrapper.text()).toContain('These credentials do not match.');
    });

    it('disables the submit button while processing', () => {
        formTestState.processing = true;
        wrapper = mount(Login, { props: { canResetPassword: true } });

        expect(
            wrapper.find('[data-test="login-button"]').attributes('disabled'),
        ).toBeDefined();
    });

    it('links to the registration page', () => {
        wrapper = mount(Login, { props: { canResetPassword: true } });

        const link = wrapper
            .findAll('a')
            .find((a) => a.text() === 'Sign up');

        expect(link?.attributes('href')).toBe('/register');
    });
});
