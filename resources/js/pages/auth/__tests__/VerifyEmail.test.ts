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
    logout: () => '/logout',
}));

vi.mock('@/routes/verification', () => ({
    send: { form: () => ({ action: '/email/verification-notification', method: 'post' }) },
}));

import VerifyEmail from '@/pages/auth/VerifyEmail.vue';

describe('auth/VerifyEmail', () => {
    let wrapper: ReturnType<typeof mount> | undefined;

    beforeEach(() => {
        Object.assign(formTestState, freshFormTestState());
    });

    afterEach(() => {
        wrapper?.unmount();
    });

    it('shows the resend confirmation message when status is verification-link-sent', () => {
        wrapper = mount(VerifyEmail, {
            props: { status: 'verification-link-sent' },
        });

        expect(wrapper.text()).toContain(
            'A new verification link has been sent',
        );
    });

    it('does not show the confirmation message otherwise', () => {
        wrapper = mount(VerifyEmail);

        expect(wrapper.text()).not.toContain(
            'A new verification link has been sent',
        );
    });

    it('renders a resend button and a logout link', () => {
        wrapper = mount(VerifyEmail);

        expect(wrapper.text()).toContain('Resend verification email');
        const logout = wrapper.findAll('a').find((a) => a.text() === 'Log out');
        expect(logout?.attributes('href')).toBe('/logout');
    });

    it('disables the resend button while processing', () => {
        formTestState.processing = true;
        wrapper = mount(VerifyEmail);

        expect(wrapper.find('button').attributes('disabled')).toBeDefined();
    });
});
