import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@inertiajs/vue3', () => ({
    Head: { template: '<head-stub><slot /></head-stub>' },
}));

vi.mock('@/routes/game-guide', () => ({
    index: () => '/game-guide',
}));

import Chat from '@/pages/game-guide/Chat.vue';

const conversationId = 'conversation-1';

function serverMessage(overrides: Record<string, unknown> = {}) {
    return {
        id: 'server-id-1',
        conversation_id: conversationId,
        sender_type: 'player',
        body: 'Which wand suits a Gryffindor?',
        origin_platform: 'web',
        client_message_id: 'client-id-1',
        sequence_number: 1,
        client_created_at: null,
        created_at: '2026-07-24T00:00:00.000Z',
        ...overrides,
    };
}

describe('game-guide/Chat', () => {
    let listenMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        listenMock = vi.fn();
        window.Echo = {
            private: vi.fn().mockReturnValue({ listen: listenMock }),
            leaveChannel: vi.fn(),
        } as unknown as Window['Echo'];
        window.axios = {
            get: vi.fn().mockResolvedValue({
                data: { data: [], meta: { prev_cursor: null } },
            }),
            post: vi.fn(),
        } as unknown as Window['axios'];
    });

    it("subscribes to the conversation's private channel on mount and leaves it on unmount", async () => {
        const wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        expect(window.Echo.private).toHaveBeenCalledWith(
            `conversation.${conversationId}`,
        );
        expect(listenMock).toHaveBeenCalledWith(
            '.message.created',
            expect.any(Function),
        );

        wrapper.unmount();

        expect(window.Echo.leaveChannel).toHaveBeenCalledWith(
            `conversation.${conversationId}`,
        );
    });

    it('loads initial message history on mount', async () => {
        window.axios.get = vi.fn().mockResolvedValue({
            data: { data: [serverMessage()], meta: { prev_cursor: null } },
        });

        const wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        expect(wrapper.text()).toContain('Which wand suits a Gryffindor?');
    });

    it('sends a message optimistically and reconciles with the server response', async () => {
        window.axios.post = vi.fn().mockResolvedValue({
            data: {
                data: serverMessage({ id: 'server-id-2', sequence_number: 2 }),
            },
        });

        const wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        await wrapper
            .find('textarea')
            .setValue('Which wand suits a Gryffindor?');
        await wrapper.find('form').trigger('submit');

        expect(wrapper.text()).toContain('Which wand suits a Gryffindor?');

        await flushPromises();

        expect(window.axios.post).toHaveBeenCalledWith(
            expect.stringContaining(conversationId),
            expect.objectContaining({
                body: 'Which wand suits a Gryffindor?',
                origin_platform: 'web',
            }),
        );
        expect(wrapper.text()).not.toContain('Failed to send');
    });

    it('shows a retry option when sending fails, and clears it on a successful retry', async () => {
        window.axios.post = vi
            .fn()
            .mockRejectedValueOnce(new Error('network error'))
            .mockResolvedValueOnce({ data: { data: serverMessage() } });

        const wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        await wrapper
            .find('textarea')
            .setValue('Which wand suits a Gryffindor?');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(wrapper.text()).toContain('Failed to send');

        await wrapper.find('button.underline').trigger('click');
        await flushPromises();

        expect(window.axios.post).toHaveBeenCalledTimes(2);
        expect(wrapper.text()).not.toContain('Failed to send');
    });

    it('appends a broadcast message it has not seen yet, and ignores one already present', async () => {
        const wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        const onMessageCreated = listenMock.mock.calls[0][1] as (
            message: unknown,
        ) => void;
        const incoming = serverMessage({
            id: 'broadcast-1',
            sender_type: 'assistant',
        });

        onMessageCreated(incoming);
        await wrapper.vm.$nextTick();

        expect(wrapper.text()).toContain('Which wand suits a Gryffindor?');

        const textLengthAfterFirst = wrapper.text().length;
        onMessageCreated(incoming);
        await wrapper.vm.$nextTick();

        expect(wrapper.text().length).toBe(textLengthAfterFirst);
    });
});
