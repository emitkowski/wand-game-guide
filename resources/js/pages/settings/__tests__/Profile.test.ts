import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { freshFormTestState  } from '@/test-support/formStub';
import type {FormTestState} from '@/test-support/formStub';

const formTestState: FormTestState = vi.hoisted(() => ({
    errors: {},
    processing: false,
}));

const pageProps = vi.hoisted(() => ({
    auth: {
        user: { name: 'Test User', email: 'test@example.com', email_verified_at: '2024-01-01T00:00:00.000000Z' },
    },
    mustVerifyEmail: false,
    status: null as string | null,
}));

vi.mock('@inertiajs/vue3', async () => {
    const { createFormStub } = await import('@/test-support/formStub');

    return {
        Head: { template: '<head-stub><slot /></head-stub>' },
        Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
        Form: createFormStub(formTestState),
        usePage: () => ({ props: pageProps }),
    };
});

vi.mock('@/actions/App/Http/Controllers/Settings/ProfileController', () => ({
    default: { update: { form: () => ({ action: '/settings/profile', method: 'patch' }) } },
}));

vi.mock('@/routes/profile', () => ({
    edit: () => '/settings/profile',
}));

vi.mock('@/routes/verification', () => ({
    send: () => '/email/verification-notification',
}));

import Profile from '@/pages/settings/Profile.vue';

describe('settings/Profile', () => {
    let wrapper: ReturnType<typeof mount> | undefined;

    beforeEach(() => {
        Object.assign(formTestState, freshFormTestState());
        pageProps.mustVerifyEmail = false;
        pageProps.status = null;
        pageProps.auth.user = {
            name: 'Test User',
            email: 'test@example.com',
            email_verified_at: '2024-01-01T00:00:00.000000Z',
        };
    });

    afterEach(() => {
        wrapper?.unmount();
    });

    function mountProfile() {
        return mount(Profile, {
            global: { stubs: { DeleteUser: true } },
        });
    }

    it('pre-fills the name and email fields from the current user', () => {
        wrapper = mountProfile();

        expect(
            (wrapper.find('#name').element as HTMLInputElement).value,
        ).toBe('Test User');
        expect(
            (wrapper.find('#email').element as HTMLInputElement).value,
        ).toBe('test@example.com');
    });

    it('displays field-level validation errors', () => {
        formTestState.errors = { email: 'The email has already been taken.' };
        wrapper = mountProfile();

        expect(wrapper.text()).toContain('The email has already been taken.');
    });

    it('disables the save button while processing', () => {
        formTestState.processing = true;
        wrapper = mountProfile();

        expect(
            wrapper
                .find('[data-test="update-profile-button"]')
                .attributes('disabled'),
        ).toBeDefined();
    });

    it('shows an unverified-email notice when the email needs verification', () => {
        pageProps.mustVerifyEmail = true;
        pageProps.auth.user = {
            ...pageProps.auth.user,
            email_verified_at: '',
        };
        wrapper = mountProfile();

        expect(wrapper.text()).toContain('Your email address is unverified.');
    });

    it('does not show the unverified-email notice when the email is verified', () => {
        pageProps.mustVerifyEmail = true;
        wrapper = mountProfile();

        expect(wrapper.text()).not.toContain(
            'Your email address is unverified.',
        );
    });

    it('shows a confirmation once a new verification link has been sent', () => {
        pageProps.mustVerifyEmail = true;
        pageProps.auth.user = { ...pageProps.auth.user, email_verified_at: '' };
        pageProps.status = 'verification-link-sent';
        wrapper = mountProfile();

        expect(wrapper.text()).toContain(
            'A new verification link has been sent',
        );
    });

    it('renders the delete-account section', () => {
        wrapper = mountProfile();

        expect(wrapper.findComponent({ name: 'DeleteUser' }).exists()).toBe(
            true,
        );
    });
});
