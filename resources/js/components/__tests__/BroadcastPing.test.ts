import { mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BroadcastPing from '@/components/BroadcastPing.vue';

vi.mock('@inertiajs/vue3', () => ({
    usePage: () => ({
        props: { auth: { user: { id: 1 } } },
    }),
}));

describe('BroadcastPing', () => {
    let listenMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        listenMock = vi.fn();
        window.Echo = {
            channel: vi.fn().mockReturnValue({ listen: listenMock }),
            leaveChannel: vi.fn(),
        } as unknown as Window['Echo'];
        window.axios = {
            post: vi.fn().mockResolvedValue({ data: {} }),
        } as unknown as Window['axios'];
    });

    it("subscribes to the current user's broadcast-ping channel on mount", () => {
        mount(BroadcastPing);

        expect(window.Echo.channel).toHaveBeenCalledWith('broadcast-ping.1');
        expect(listenMock).toHaveBeenCalledWith('.ping', expect.any(Function));
    });

    it('leaves the channel on unmount', () => {
        const wrapper = mount(BroadcastPing);

        wrapper.unmount();

        expect(window.Echo.leaveChannel).toHaveBeenCalledWith(
            'broadcast-ping.1',
        );
    });

    it('posts to the broadcast-ping endpoint and shows a waiting state when pinged', async () => {
        const wrapper = mount(BroadcastPing);

        await wrapper.find('button').trigger('click');

        expect(window.axios.post).toHaveBeenCalledWith(
            '/api/v1/broadcast-ping',
        );
        expect(wrapper.text()).toContain('Waiting for queue + WebSocket');
    });

    it('shows a success state once the ping listener fires', async () => {
        const wrapper = mount(BroadcastPing);
        const onPing = listenMock.mock.calls[0][1] as () => void;

        onPing();
        await wrapper.vm.$nextTick();

        expect(wrapper.text()).toContain('WebSocket OK');
    });
});
