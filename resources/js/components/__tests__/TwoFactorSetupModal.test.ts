import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type * as VueUseCore from '@vueuse/core';

const twoFactorState = vi.hoisted(async () => {
    const { ref } = await import('vue');

    return {
        qrCodeSvg: ref<string | null>(null),
        manualSetupKey: ref<string | null>(null),
        errors: ref<string[]>([]),
        clearSetupData: vi.fn(),
        fetchSetupData: vi.fn(async () => {}),
    };
});

vi.mock('@/composables/useTwoFactorAuth', async () => {
    const state = await twoFactorState;

    return {
        useTwoFactorAuth: () => ({
            qrCodeSvg: state.qrCodeSvg,
            manualSetupKey: state.manualSetupKey,
            clearSetupData: state.clearSetupData,
            fetchSetupData: state.fetchSetupData,
            errors: state.errors,
        }),
    };
});

vi.mock('@/composables/useAppearance', () => ({
    useAppearance: () => ({ resolvedAppearance: { value: 'light' } }),
}));

vi.mock('@vueuse/core', async (importOriginal) => {
    const actual = await importOriginal<typeof VueUseCore>();

    return {
        ...actual,
        useClipboard: () => ({ copy: vi.fn(), copied: { value: false } }),
    };
});

vi.mock('@inertiajs/vue3', () => ({
    Form: {
        name: 'Form',
        template: '<form><slot :errors="{}" :processing="false" /></form>',
    },
}));

vi.mock('@/routes/two-factor', () => ({
    confirm: { form: () => ({ action: '/two-factor/confirm', method: 'post' }) },
}));

import TwoFactorSetupModal from '@/components/TwoFactorSetupModal.vue';

describe('TwoFactorSetupModal', () => {
    let wrapper: ReturnType<typeof mount> | undefined;
    let state: Awaited<typeof twoFactorState>;

    beforeEach(async () => {
        state = await twoFactorState;
        state.qrCodeSvg.value = null;
        state.manualSetupKey.value = null;
        state.errors.value = [];
        state.clearSetupData.mockClear();
        state.fetchSetupData.mockClear();
    });

    afterEach(() => {
        wrapper?.unmount();
        wrapper = undefined;
    });

    async function mountModal(props: Record<string, unknown> = {}) {
        const w = mount(TwoFactorSetupModal, {
            props: {
                isOpen: true,
                requiresConfirmation: false,
                twoFactorEnabled: false,
                ...props,
            },
            attachTo: document.body,
        });

        // Reka UI's Dialog teleports DialogContent and doesn't render it
        // synchronously on mount even when `open` starts true.
        await w.vm.$nextTick();

        return w;
    }

    function findButtonByText(text: string): HTMLElement | undefined {
        return [...document.querySelectorAll('button')].find(
            (b) => b.textContent?.trim() === text,
        );
    }

    it('fetches setup data when opened with no QR code loaded yet', async () => {
        wrapper = await mountModal({ isOpen: false });

        await wrapper.setProps({ isOpen: true });

        expect(state.fetchSetupData).toHaveBeenCalledTimes(1);
    });

    it('does not re-fetch setup data if a QR code is already loaded', async () => {
        state.qrCodeSvg.value = '<svg></svg>';
        wrapper = await mountModal({ isOpen: false });

        await wrapper.setProps({ isOpen: true });

        expect(state.fetchSetupData).not.toHaveBeenCalled();
    });

    it('shows the "enable" title before verification and while not yet enabled', async () => {
        wrapper = await mountModal();

        expect(document.body.textContent).toContain(
            'Enable two-factor authentication',
        );
    });

    it('shows the "enabled" title once two-factor auth is on', async () => {
        wrapper = await mountModal({ twoFactorEnabled: true });

        expect(document.body.textContent).toContain(
            'Two-factor authentication enabled',
        );
    });

    it('shows an error state instead of the QR code when fetching setup data failed', async () => {
        state.errors.value = ['Failed to fetch a setup key'];
        wrapper = await mountModal();

        expect(document.body.textContent).toContain(
            'Failed to fetch a setup key',
        );
    });

    it('closes immediately on Continue when confirmation is not required', async () => {
        wrapper = await mountModal({ requiresConfirmation: false });

        await findButtonByText('Continue')?.dispatchEvent(
            new Event('click', { bubbles: true }),
        );
        await wrapper.vm.$nextTick();

        expect(state.clearSetupData).toHaveBeenCalledTimes(1);
        expect(wrapper.emitted('update:isOpen')).toEqual([[false]]);
    });

    it('advances to the verification step on Continue when confirmation is required', async () => {
        wrapper = await mountModal({ requiresConfirmation: true });

        await findButtonByText('Continue')?.dispatchEvent(
            new Event('click', { bubbles: true }),
        );
        await wrapper.vm.$nextTick();

        expect(document.body.textContent).toContain(
            'Verify authentication code',
        );
        expect(state.clearSetupData).not.toHaveBeenCalled();
    });

    it('resets the verification step when closed', async () => {
        wrapper = await mountModal({ requiresConfirmation: true });

        await findButtonByText('Continue')?.dispatchEvent(
            new Event('click', { bubbles: true }),
        );
        await wrapper.vm.$nextTick();
        expect(document.body.textContent).toContain(
            'Verify authentication code',
        );

        await wrapper.setProps({ isOpen: false });
        await wrapper.setProps({ isOpen: true });

        expect(document.body.textContent).toContain(
            'Enable two-factor authentication',
        );
    });
});
