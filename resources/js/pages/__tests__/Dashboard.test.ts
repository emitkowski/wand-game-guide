import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/vue3', () => ({
    Head: { template: '<head-stub><slot /></head-stub>' },
    Link: { props: ['href'], template: '<a :href="href"><slot /></a>' },
    usePage: () => ({ props: { auth: { user: { id: 1 } } } }),
}));

vi.mock('@/routes', () => ({
    dashboard: () => '/dashboard',
}));

vi.mock('@/routes/game-guide', () => ({
    index: () => '/game-guide',
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

    it('links to the Game Guide chat', () => {
        window.Echo = {
            channel: vi.fn().mockReturnValue({ listen: vi.fn() }),
            leaveChannel: vi.fn(),
        } as unknown as Window['Echo'];

        const wrapper = mount(Dashboard);
        const link = wrapper
            .findAll('a')
            .find((a) => a.text().includes('Game Guide'));

        expect(link).toBeTruthy();
        expect(link?.attributes('href')).toBe('/game-guide');
    });
});
