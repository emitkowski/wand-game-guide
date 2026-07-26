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

vi.mock('@/actions/App/Http/Controllers/Settings/SecurityController', () => ({
    default: { update: { form: () => ({ action: '/settings/security', method: 'put' }) } },
}));

vi.mock('@/routes/security', () => ({
    edit: () => '/settings/security',
}));

import Security from '@/pages/settings/Security.vue';

describe('settings/Security', () => {
    let wrapper: ReturnType<typeof mount> | undefined;

    beforeEach(() => {
        Object.assign(formTestState, freshFormTestState());
    });

    afterEach(() => {
        wrapper?.unmount();
    });

    function mountSecurity(props: Record<string, unknown> = {}) {
        return mount(Security, {
            props: { passwordRules: '', ...props },
            global: { stubs: { ManageTwoFactor: true } },
        });
    }

    it('renders current, new, and confirmation password fields', () => {
        wrapper = mountSecurity();

        expect(wrapper.find('#current_password').exists()).toBe(true);
        expect(wrapper.find('#password').exists()).toBe(true);
        expect(wrapper.find('#password_confirmation').exists()).toBe(true);
    });

    it('displays field-level validation errors', () => {
        formTestState.errors = {
            current_password: 'The current password is incorrect.',
        };
        wrapper = mountSecurity();

        expect(wrapper.text()).toContain(
            'The current password is incorrect.',
        );
    });

    it('disables the save button while processing', () => {
        formTestState.processing = true;
        wrapper = mountSecurity();

        expect(
            wrapper
                .find('[data-test="update-password-button"]')
                .attributes('disabled'),
        ).toBeDefined();
    });

    it('renders the two-factor management section', () => {
        wrapper = mountSecurity({ canManageTwoFactor: true });

        expect(
            wrapper.findComponent({ name: 'ManageTwoFactor' }).exists(),
        ).toBe(true);
    });
});
