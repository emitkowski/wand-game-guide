import { beforeEach, describe, expect, it, vi } from 'vitest';

const submitMock = vi.fn();

vi.mock('@inertiajs/vue3', () => ({
    useHttp: () => ({ submit: submitMock }),
}));

vi.mock('@/routes/two-factor', () => ({
    qrCode: () => ({ url: '/two-factor/qr-code', method: 'get' }),
    secretKey: () => ({ url: '/two-factor/secret-key', method: 'get' }),
    recoveryCodes: () => ({ url: '/two-factor/recovery-codes', method: 'get' }),
}));

import { useTwoFactorAuth } from '@/composables/useTwoFactorAuth';

describe('useTwoFactorAuth', () => {
    beforeEach(() => {
        submitMock.mockReset();
        // State lives in module-level refs shared across every call to
        // useTwoFactorAuth() (a deliberate singleton) — reset it before
        // each test so tests don't leak state into one another.
        useTwoFactorAuth().clearTwoFactorAuthData();
    });

    it('fetches and stores the QR code SVG', async () => {
        submitMock.mockResolvedValueOnce({ svg: '<svg>qr</svg>', url: 'otpauth://x' });
        const { fetchQrCode, qrCodeSvg, errors } = useTwoFactorAuth();

        await fetchQrCode();

        expect(qrCodeSvg.value).toBe('<svg>qr</svg>');
        expect(errors.value).toHaveLength(0);
    });

    it('records an error and clears the QR code on fetch failure', async () => {
        submitMock.mockRejectedValueOnce(new Error('network error'));
        const { fetchQrCode, qrCodeSvg, errors } = useTwoFactorAuth();

        await fetchQrCode();

        expect(qrCodeSvg.value).toBeNull();
        expect(errors.value).toContain('Failed to fetch QR code');
    });

    it('fetches and stores the manual setup key', async () => {
        submitMock.mockResolvedValueOnce({ secretKey: 'ABCD-1234' });
        const { fetchSetupKey, manualSetupKey, errors } = useTwoFactorAuth();

        await fetchSetupKey();

        expect(manualSetupKey.value).toBe('ABCD-1234');
        expect(errors.value).toHaveLength(0);
    });

    it('records an error and clears the setup key on fetch failure', async () => {
        submitMock.mockRejectedValueOnce(new Error('network error'));
        const { fetchSetupKey, manualSetupKey, errors } = useTwoFactorAuth();

        await fetchSetupKey();

        expect(manualSetupKey.value).toBeNull();
        expect(errors.value).toContain('Failed to fetch a setup key');
    });

    it('hasSetupData is true only once both the QR code and setup key are present', async () => {
        submitMock
            .mockResolvedValueOnce({ svg: '<svg>qr</svg>', url: 'otpauth://x' })
            .mockResolvedValueOnce({ secretKey: 'ABCD-1234' });
        const { fetchQrCode, fetchSetupKey, hasSetupData } = useTwoFactorAuth();

        expect(hasSetupData.value).toBe(false);

        await fetchQrCode();
        expect(hasSetupData.value).toBe(false);

        await fetchSetupKey();
        expect(hasSetupData.value).toBe(true);
    });

    it('fetchSetupData fetches the QR code and setup key together', async () => {
        submitMock
            .mockResolvedValueOnce({ svg: '<svg>qr</svg>', url: 'otpauth://x' })
            .mockResolvedValueOnce({ secretKey: 'ABCD-1234' });
        const { fetchSetupData, qrCodeSvg, manualSetupKey } =
            useTwoFactorAuth();

        await fetchSetupData();

        expect(qrCodeSvg.value).toBe('<svg>qr</svg>');
        expect(manualSetupKey.value).toBe('ABCD-1234');
        expect(submitMock).toHaveBeenCalledTimes(2);
    });

    it('clearSetupData nulls the QR code and setup key and clears errors', async () => {
        submitMock.mockRejectedValueOnce(new Error('network error'));
        const {
            fetchQrCode,
            clearSetupData,
            qrCodeSvg,
            manualSetupKey,
            errors,
        } = useTwoFactorAuth();

        await fetchQrCode();
        expect(errors.value).toHaveLength(1);

        clearSetupData();

        expect(qrCodeSvg.value).toBeNull();
        expect(manualSetupKey.value).toBeNull();
        expect(errors.value).toHaveLength(0);
    });

    it('fetches and stores recovery codes, clearing prior errors first', async () => {
        submitMock.mockResolvedValueOnce(['code-1', 'code-2']);
        const { fetchRecoveryCodes, recoveryCodesList, errors } =
            useTwoFactorAuth();

        await fetchRecoveryCodes();

        expect(recoveryCodesList.value).toEqual(['code-1', 'code-2']);
        expect(errors.value).toHaveLength(0);
    });

    it('records an error and empties recovery codes on fetch failure', async () => {
        submitMock.mockRejectedValueOnce(new Error('network error'));
        const { fetchRecoveryCodes, recoveryCodesList, errors } =
            useTwoFactorAuth();

        await fetchRecoveryCodes();

        expect(recoveryCodesList.value).toHaveLength(0);
        expect(errors.value).toContain('Failed to fetch recovery codes');
    });

    it('clearTwoFactorAuthData resets setup data, errors, and recovery codes', async () => {
        submitMock
            .mockResolvedValueOnce({ svg: '<svg>qr</svg>', url: 'otpauth://x' })
            .mockResolvedValueOnce(['code-1']);
        const {
            fetchQrCode,
            fetchRecoveryCodes,
            clearTwoFactorAuthData,
            qrCodeSvg,
            recoveryCodesList,
            errors,
        } = useTwoFactorAuth();

        await fetchQrCode();
        await fetchRecoveryCodes();

        clearTwoFactorAuthData();

        expect(qrCodeSvg.value).toBeNull();
        expect(recoveryCodesList.value).toHaveLength(0);
        expect(errors.value).toHaveLength(0);
    });
});
