import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const twoFactorState = vi.hoisted(async () => {
    const { ref, computed } = await import('vue');
    const qrCodeSvg = ref<string | null>(null);
    const manualSetupKey = ref<string | null>(null);

    return {
        qrCodeSvg,
        manualSetupKey,
        hasSetupData: computed(
            () => qrCodeSvg.value !== null && manualSetupKey.value !== null,
        ),
        clearTwoFactorAuthData: vi.fn(),
    };
});

vi.mock('@/composables/useTwoFactorAuth', async () => {
    const state = await twoFactorState;

    return {
        useTwoFactorAuth: () => ({
            hasSetupData: state.hasSetupData,
            clearTwoFactorAuthData: state.clearTwoFactorAuthData,
        }),
    };
});

vi.mock('@inertiajs/vue3', () => ({
    Form: {
        name: 'Form',
        template: '<form><slot :processing="false" /></form>',
    },
}));

vi.mock('@/routes/two-factor', () => ({
    enable: { form: () => ({ action: '/two-factor/enable', method: 'post' }) },
    disable: { form: () => ({ action: '/two-factor/disable', method: 'delete' }) },
}));

import ManageTwoFactor from '@/components/ManageTwoFactor.vue';

describe('ManageTwoFactor', () => {
    let wrapper: ReturnType<typeof mount> | undefined;
    let state: Awaited<typeof twoFactorState>;

    beforeEach(async () => {
        state = await twoFactorState;
        state.qrCodeSvg.value = null;
        state.manualSetupKey.value = null;
        state.clearTwoFactorAuthData.mockClear();
    });

    afterEach(() => {
        wrapper?.unmount();
    });

    function mountManage(props: Record<string, unknown> = {}) {
        return mount(ManageTwoFactor, {
            props,
            global: {
                stubs: {
                    TwoFactorRecoveryCodes: true,
                    TwoFactorSetupModal: true,
                },
            },
        });
    }

    it('renders nothing when the user cannot manage two-factor auth', () => {
        wrapper = mountManage({ canManageTwoFactor: false });

        expect(wrapper.text()).toBe('');
    });

    it('shows an "Enable 2FA" form when 2FA is off and no setup is in progress', () => {
        wrapper = mountManage({ canManageTwoFactor: true, twoFactorEnabled: false });

        expect(wrapper.text()).toContain('Enable 2FA');
        expect(wrapper.text()).not.toContain('Continue setup');
    });

    it('shows a "Continue setup" button when setup data is already present', () => {
        state.qrCodeSvg.value = '<svg></svg>';
        state.manualSetupKey.value = 'ABCD-1234';
        wrapper = mountManage({ canManageTwoFactor: true, twoFactorEnabled: false });

        expect(wrapper.text()).toContain('Continue setup');
    });

    it('reopens the setup modal when "Continue setup" is clicked', async () => {
        state.qrCodeSvg.value = '<svg></svg>';
        state.manualSetupKey.value = 'ABCD-1234';
        wrapper = mountManage({ canManageTwoFactor: true, twoFactorEnabled: false });

        await wrapper.find('button').trigger('click');

        expect(
            wrapper.findComponent({ name: 'TwoFactorSetupModal' }).props(
                'isOpen',
            ),
        ).toBe(true);
    });

    it('shows a "Disable 2FA" form and recovery codes when 2FA is on', () => {
        wrapper = mountManage({ canManageTwoFactor: true, twoFactorEnabled: true });

        expect(wrapper.text()).toContain('Disable 2FA');
        expect(
            wrapper.findComponent({ name: 'TwoFactorRecoveryCodes' }).exists(),
        ).toBe(true);
    });

    it('clears two-factor auth data on unmount', () => {
        wrapper = mountManage({ canManageTwoFactor: true, twoFactorEnabled: false });
        wrapper.unmount();
        wrapper = undefined;

        expect(state.clearTwoFactorAuthData).toHaveBeenCalledTimes(1);
    });
});
