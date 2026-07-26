import { mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const twoFactorState = vi.hoisted(async () => {
    const { ref } = await import('vue');

    return {
        recoveryCodesList: ref<string[]>([]),
        errors: ref<string[]>([]),
        fetchRecoveryCodes: vi.fn(async () => {}),
    };
});

vi.mock('@/composables/useTwoFactorAuth', async () => {
    const state = await twoFactorState;

    return {
        useTwoFactorAuth: () => ({
            recoveryCodesList: state.recoveryCodesList,
            errors: state.errors,
            fetchRecoveryCodes: state.fetchRecoveryCodes,
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
    regenerateRecoveryCodes: { form: () => ({ action: '/two-factor/recovery-codes', method: 'post' }) },
}));

import TwoFactorRecoveryCodes from '@/components/TwoFactorRecoveryCodes.vue';

describe('TwoFactorRecoveryCodes', () => {
    let wrapper: ReturnType<typeof mount> | undefined;
    let state: Awaited<typeof twoFactorState>;

    beforeEach(async () => {
        state = await twoFactorState;
        state.recoveryCodesList.value = [];
        state.errors.value = [];
        state.fetchRecoveryCodes.mockClear();
    });

    afterEach(() => {
        wrapper?.unmount();
    });

    it('fetches recovery codes on mount when none are loaded yet', () => {
        wrapper = mount(TwoFactorRecoveryCodes);

        expect(state.fetchRecoveryCodes).toHaveBeenCalledTimes(1);
    });

    it('does not re-fetch on mount when codes are already loaded', () => {
        state.recoveryCodesList.value = ['aaaa-bbbb', 'cccc-dddd'];
        wrapper = mount(TwoFactorRecoveryCodes);

        expect(state.fetchRecoveryCodes).not.toHaveBeenCalled();
    });

    it('fetches again when toggled open while still empty (the mount fetch failed silently)', async () => {
        wrapper = mount(TwoFactorRecoveryCodes);
        expect(state.fetchRecoveryCodes).toHaveBeenCalledTimes(1);

        await wrapper.find('button').trigger('click');

        expect(state.fetchRecoveryCodes).toHaveBeenCalledTimes(2);
    });

    it('codes are visually collapsed until the view toggle is clicked', () => {
        // The component keeps codes in the DOM at all times and toggles
        // visibility with a height/opacity transition class, not v-if — see
        // TwoFactorRecoveryCodes.vue's `isRecoveryCodesVisible ? 'h-auto
        // opacity-100' : 'h-0 opacity-0'` binding.
        state.recoveryCodesList.value = ['aaaa-bbbb'];
        wrapper = mount(TwoFactorRecoveryCodes);

        expect(wrapper.text()).toContain('View recovery codes');
        expect(wrapper.find('.h-0.opacity-0').exists()).toBe(true);
    });

    it('reveals codes and switches to a hide toggle when clicked', async () => {
        state.recoveryCodesList.value = ['aaaa-bbbb'];
        wrapper = mount(TwoFactorRecoveryCodes);

        await wrapper.find('button').trigger('click');

        expect(wrapper.text()).toContain('aaaa-bbbb');
        expect(wrapper.text()).toContain('Hide recovery codes');
    });

    it('shows an error state instead of codes when fetching failed', async () => {
        state.recoveryCodesList.value = ['aaaa-bbbb'];
        state.errors.value = ['Failed to fetch recovery codes'];
        wrapper = mount(TwoFactorRecoveryCodes);

        await wrapper.find('button').trigger('click');

        expect(wrapper.text()).toContain('Failed to fetch recovery codes');
        expect(wrapper.text()).not.toContain('aaaa-bbbb');
    });
});
