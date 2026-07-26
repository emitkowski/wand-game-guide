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
        Form: createFormStub(formTestState),
    };
});

vi.mock('@/actions/App/Http/Controllers/Settings/ProfileController', () => ({
    default: { destroy: { form: () => ({ action: '/settings/profile', method: 'delete' }) } },
}));

import DeleteUser from '@/components/DeleteUser.vue';

describe('DeleteUser', () => {
    let wrapper: ReturnType<typeof mount> | undefined;

    beforeEach(() => {
        Object.assign(formTestState, freshFormTestState());
    });

    afterEach(() => {
        wrapper?.unmount();
    });

    it('renders a warning and a delete-account trigger', () => {
        wrapper = mount(DeleteUser);

        expect(wrapper.text()).toContain('Please proceed with caution');
        expect(
            wrapper.find('[data-test="delete-user-button"]').exists(),
        ).toBe(true);
    });

    it('renders the confirmation dialog contents, including the password field, once opened', async () => {
        wrapper = mount(DeleteUser, { attachTo: document.body });

        await wrapper.find('[data-test="delete-user-button"]').trigger('click');

        expect(
            document.body.textContent,
        ).toContain('Are you sure you want to delete your account?');
        expect(document.querySelector('#password')).not.toBeNull();
    });

    it('displays a validation error for the confirmation password', async () => {
        formTestState.errors = { password: 'The password is incorrect.' };
        wrapper = mount(DeleteUser, { attachTo: document.body });

        await wrapper.find('[data-test="delete-user-button"]').trigger('click');

        expect(document.body.textContent).toContain(
            'The password is incorrect.',
        );
    });

    it('disables the confirm button while processing', async () => {
        formTestState.processing = true;
        wrapper = mount(DeleteUser, { attachTo: document.body });

        await wrapper.find('[data-test="delete-user-button"]').trigger('click');

        const confirmButton = document.querySelector(
            '[data-test="confirm-delete-user-button"]',
        );

        expect(confirmButton?.hasAttribute('disabled')).toBe(true);
    });
});
