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
        Form: createFormStub(formTestState),
    };
});

vi.mock('@/routes/password', () => ({
    update: { form: () => ({ action: '/reset-password', method: 'post' }) },
}));

import ResetPassword from '@/pages/auth/ResetPassword.vue';

describe('auth/ResetPassword', () => {
    let wrapper: ReturnType<typeof mount> | undefined;
    const props = {
        token: 'reset-token-123',
        email: 'player@example.com',
        passwordRules: '',
    };

    beforeEach(() => {
        Object.assign(formTestState, freshFormTestState());
    });

    afterEach(() => {
        wrapper?.unmount();
    });

    it('pre-fills the email field from props and renders it read-only', () => {
        wrapper = mount(ResetPassword, { props });

        const email = wrapper.find('#email');
        expect((email.element as HTMLInputElement).value).toBe(
            'player@example.com',
        );
        expect(email.attributes('readonly')).toBeDefined();
    });

    it('renders password and confirmation fields', () => {
        wrapper = mount(ResetPassword, { props });

        expect(wrapper.find('#password').exists()).toBe(true);
        expect(wrapper.find('#password_confirmation').exists()).toBe(true);
    });

    it('displays field-level validation errors', () => {
        formTestState.errors = { password: 'The password is too short.' };
        wrapper = mount(ResetPassword, { props });

        expect(wrapper.text()).toContain('The password is too short.');
    });

    it('disables the submit button while processing', () => {
        formTestState.processing = true;
        wrapper = mount(ResetPassword, { props });

        expect(
            wrapper
                .find('[data-test="reset-password-button"]')
                .attributes('disabled'),
        ).toBeDefined();
    });
});
