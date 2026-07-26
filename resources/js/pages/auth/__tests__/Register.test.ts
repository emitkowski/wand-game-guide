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

vi.mock('@/routes/register', () => ({
    store: { form: () => ({ action: '/register', method: 'post' }) },
}));

import Register from '@/pages/auth/Register.vue';

describe('auth/Register', () => {
    let wrapper: ReturnType<typeof mount> | undefined;

    beforeEach(() => {
        Object.assign(formTestState, freshFormTestState());
    });

    afterEach(() => {
        wrapper?.unmount();
    });

    it('renders name, email, and password fields', () => {
        wrapper = mount(Register, { props: { passwordRules: '' } });

        expect(wrapper.find('#name').exists()).toBe(true);
        expect(wrapper.find('#email').exists()).toBe(true);
        expect(wrapper.find('#password').exists()).toBe(true);
        expect(wrapper.find('#password_confirmation').exists()).toBe(true);
    });

    it('displays field-level validation errors', () => {
        formTestState.errors = { email: 'The email has already been taken.' };
        wrapper = mount(Register, { props: { passwordRules: '' } });

        expect(wrapper.text()).toContain('The email has already been taken.');
    });

    it('disables the submit button while processing', () => {
        formTestState.processing = true;
        wrapper = mount(Register, { props: { passwordRules: '' } });

        expect(
            wrapper
                .find('[data-test="register-user-button"]')
                .attributes('disabled'),
        ).toBeDefined();
    });

    it('links to the login page', () => {
        wrapper = mount(Register, { props: { passwordRules: '' } });

        const link = wrapper.findAll('a').find((a) => a.text() === 'Log in');

        expect(link?.attributes('href')).toBe('/login');
    });
});
