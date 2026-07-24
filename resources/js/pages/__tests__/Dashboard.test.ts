import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/vue3', () => ({
    Head: { template: '<head-stub><slot /></head-stub>' },
    usePage: () => ({ props: { auth: { user: { id: 1 } } } }),
}));

vi.mock('@/routes', () => ({
    dashboard: () => '/dashboard',
}));

import Dashboard from '@/pages/Dashboard.vue';

describe('Dashboard', () => {
    it('renders the BroadcastPing demo tile', () => {
        window.Echo = {
            channel: vi.fn().mockReturnValue({ listen: vi.fn() }),
            leaveChannel: vi.fn(),
        } as unknown as Window['Echo'];

        const wrapper = mount(Dashboard);

        expect(wrapper.text()).toContain('WebSocket Ping');
    });
});
