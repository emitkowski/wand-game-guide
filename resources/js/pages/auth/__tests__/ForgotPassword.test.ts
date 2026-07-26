import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshFormTestState  } from '@/test-support/formStub';
import type {FormTestState} from '@/test-support/formStub';

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
    login: () => '/login',
}));

vi.mock('@/routes/password', () => ({
    email: { form: () => ({ action: '/forgot-password', method: 'post' }) },
}));

import ForgotPassword from '@/pages/auth/ForgotPassword.vue';

describe('auth/ForgotPassword', () => {
    let wrapper: ReturnType<typeof mount> | undefined;

    beforeEach(() => {
        Object.assign(formTestState, freshFormTestState());
    });

    afterEach(() => {
        wrapper?.unmount();
    });

    it('renders the email field', () => {
        wrapper = mount(ForgotPassword);

        expect(wrapper.find('#email').exists()).toBe(true);
    });

    it('shows a status message when provided', () => {
        wrapper = mount(ForgotPassword, {
            props: { status: 'We have emailed your password reset link.' },
        });

        expect(wrapper.text()).toContain(
            'We have emailed your password reset link.',
        );
    });

    it('does not show a status message when absent', () => {
        wrapper = mount(ForgotPassword);

        expect(wrapper.text()).not.toContain('emailed your password reset');
    });

    it('displays field-level validation errors', () => {
        formTestState.errors = { email: 'We could not find that email.' };
        wrapper = mount(ForgotPassword);

        expect(wrapper.text()).toContain('We could not find that email.');
    });

    it('disables the submit button while processing', () => {
        formTestState.processing = true;
        wrapper = mount(ForgotPassword);

        expect(
            wrapper
                .find('[data-test="email-password-reset-link-button"]')
                .attributes('disabled'),
        ).toBeDefined();
    });

    it('links back to the login page', () => {
        wrapper = mount(ForgotPassword);

        const link = wrapper.findAll('a').find((a) => a.text() === 'log in');

        expect(link?.attributes('href')).toBe('/login');
    });
});
