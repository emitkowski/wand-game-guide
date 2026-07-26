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
        setLayoutProps: vi.fn(),
    };
});

vi.mock('@/routes/two-factor/login', () => ({
    store: { form: () => ({ action: '/two-factor-challenge', method: 'post' }) },
}));

import TwoFactorChallenge from '@/pages/auth/TwoFactorChallenge.vue';

describe('auth/TwoFactorChallenge', () => {
    let wrapper: ReturnType<typeof mount> | undefined;

    beforeEach(() => {
        Object.assign(formTestState, freshFormTestState());
    });

    afterEach(() => {
        wrapper?.unmount();
    });

    it('starts on the authentication-code step with a hidden code input', () => {
        wrapper = mount(TwoFactorChallenge);

        expect(wrapper.find('input[name="code"]').exists()).toBe(true);
        expect(wrapper.find('input[name="recovery_code"]').exists()).toBe(
            false,
        );
        expect(wrapper.text()).toContain(
            'login using a recovery code',
        );
    });

    it('switches to the recovery-code step when toggled', async () => {
        wrapper = mount(TwoFactorChallenge);

        await wrapper.find('button[type="button"]').trigger('click');

        expect(wrapper.find('input[name="recovery_code"]').exists()).toBe(
            true,
        );
        expect(wrapper.text()).toContain(
            'login using an authentication code',
        );
    });

    it('switches back to the authentication-code step when toggled again', async () => {
        wrapper = mount(TwoFactorChallenge);

        await wrapper.find('button[type="button"]').trigger('click');
        await wrapper.find('button[type="button"]').trigger('click');

        expect(wrapper.find('input[name="code"]').exists()).toBe(true);
    });

    it('displays a validation error on the authentication-code step', () => {
        formTestState.errors = { code: 'The code is invalid.' };
        wrapper = mount(TwoFactorChallenge);

        expect(wrapper.text()).toContain('The code is invalid.');
    });

    it('displays a validation error on the recovery-code step', async () => {
        formTestState.errors = { recovery_code: 'The recovery code is invalid.' };
        wrapper = mount(TwoFactorChallenge);

        await wrapper.find('button[type="button"]').trigger('click');

        expect(wrapper.text()).toContain('The recovery code is invalid.');
    });
});
