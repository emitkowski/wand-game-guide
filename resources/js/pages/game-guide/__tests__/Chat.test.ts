import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

function setOnline(value: boolean) {
    Object.defineProperty(navigator, 'onLine', {
        value,
        configurable: true,
    });
}

describe('game-guide/Chat', () => {
    let listenMock: ReturnType<typeof vi.fn>;
    let connectionBindMock: ReturnType<typeof vi.fn>;
    let connectionUnbindMock: ReturnType<typeof vi.fn>;
    // Tracked so afterEach can always unmount — Chat.vue registers a
    // `window.addEventListener('online', ...)` in onMounted, and a wrapper
    // left mounted across tests would leak that listener onto the shared
    // jsdom `window`, causing later tests' `online` dispatches to also
    // trigger earlier tests' (now-stale) flush handlers.
    let wrapper: ReturnType<typeof mount> | undefined;

    function echoConnectedHandler() {
        const call = connectionBindMock.mock.calls.find(
            ([event]) => event === 'connected',
        );

        return call![1] as () => void;
    }

    beforeEach(() => {
        localStorage.clear();
        setOnline(true);
        listenMock = vi.fn();
        connectionBindMock = vi.fn();
        connectionUnbindMock = vi.fn();
        window.Echo = {
            private: vi.fn().mockReturnValue({ listen: listenMock }),
            leaveChannel: vi.fn(),
            connector: {
                pusher: {
                    connection: {
                        bind: connectionBindMock,
                        unbind: connectionUnbindMock,
                    },
                },
            },
        } as unknown as Window['Echo'];
        window.axios = {
            // mockImplementation (not mockResolvedValue) so every call gets a
            // fresh { data: [] } array — mockResolvedValue would resolve every
            // call to the *same* array object, and since Vue's ref() wraps
            // messages.value around whatever loadInitial() assigns it,
            // pushing onto messages.value in one mount reactively mutates that
            // shared array in place, silently contaminating a later mount's
            // own loadInitial() in the same test (bit the reload-persistence
            // test — see docs/memory/testing.md's 2026-07-27 entry).
            get: vi.fn().mockImplementation(() =>
                Promise.resolve({
                    data: { data: [], meta: { next_cursor: null } },
                }),
            ),
            post: vi.fn(),
        } as unknown as Window['axios'];
    });

    afterEach(() => {
        wrapper?.unmount();
        wrapper = undefined;
        localStorage.clear();
        setOnline(true);
        vi.useRealTimers();
    });

    function thinkingIndicator() {
        return wrapper!.find('[data-testid="game-guide-thinking"]');
    }

    it("subscribes to the conversation's private channel on mount and leaves it on unmount", async () => {
        wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        expect(window.Echo.private).toHaveBeenCalledWith(
            `conversation.${conversationId}`,
        );
        expect(listenMock).toHaveBeenCalledWith(
            '.message.created',
            expect.any(Function),
        );
        expect(connectionBindMock).toHaveBeenCalledWith(
            'connected',
            expect.any(Function),
        );

        wrapper.unmount();

        expect(window.Echo.leaveChannel).toHaveBeenCalledWith(
            `conversation.${conversationId}`,
        );
        expect(connectionUnbindMock).toHaveBeenCalledWith(
            'connected',
            expect.any(Function),
        );
    });

    it('loads initial message history on mount', async () => {
        window.axios.get = vi.fn().mockResolvedValue({
            data: { data: [serverMessage()], meta: { next_cursor: null } },
        });

        wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        expect(wrapper.text()).toContain('Which wand suits a Gryffindor?');
    });

    it('sends a message optimistically and reconciles with the server response', async () => {
        window.axios.post = vi.fn().mockResolvedValue({
            data: {
                data: serverMessage({ id: 'server-id-2', sequence_number: 2 }),
            },
        });

        wrapper = mount(Chat, { props: { conversationId } });
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

        // reconciled and cleared from the persisted outbox
        expect(
            JSON.parse(
                localStorage.getItem(`game-guide:outbox:${conversationId}`) ??
                    '[]',
            ),
        ).toHaveLength(0);
    });

    it('shows a retry option when sending fails, and clears it on a successful retry', async () => {
        window.axios.post = vi
            .fn()
            .mockRejectedValueOnce(new Error('network error'))
            .mockResolvedValueOnce({ data: { data: serverMessage() } });

        wrapper = mount(Chat, { props: { conversationId } });
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
        wrapper = mount(Chat, { props: { conversationId } });
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

    it('queues a message while offline instead of attempting to send it', async () => {
        setOnline(false);

        wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        await wrapper.find('textarea').setValue('Sent while offline');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(window.axios.post).not.toHaveBeenCalled();
        expect(wrapper.text()).toContain('Queued — will send when back online');

        const outbox = JSON.parse(
            localStorage.getItem(`game-guide:outbox:${conversationId}`) ?? '[]',
        );
        expect(outbox).toHaveLength(1);
        expect(outbox[0].body).toBe('Sent while offline');
    });

    it('persists a queued message across a reload (unmount/remount)', async () => {
        setOnline(false);

        const first = mount(Chat, { props: { conversationId } });
        await flushPromises();

        await first.find('textarea').setValue('Still here after reload');
        await first.find('form').trigger('submit');
        await flushPromises();

        first.unmount();

        wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        expect(wrapper.text()).toContain('Still here after reload');
        expect(wrapper.text()).toContain('Queued — will send when back online');
    });

    it('automatically flushes the outbox when the browser comes back online', async () => {
        setOnline(false);

        wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        await wrapper.find('textarea').setValue('Sent while offline');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(window.axios.post).not.toHaveBeenCalled();

        window.axios.post = vi
            .fn()
            .mockResolvedValue({ data: { data: serverMessage() } });
        setOnline(true);
        window.dispatchEvent(new Event('online'));
        await flushPromises();

        expect(window.axios.post).toHaveBeenCalledTimes(1);
        expect(wrapper.text()).not.toContain('Queued');
    });

    it('re-fetches history to pick up messages from other sources when the browser comes back online (BUG-10)', async () => {
        wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        expect(window.axios.get).toHaveBeenCalledTimes(1);

        window.axios.get = vi.fn().mockResolvedValue({
            data: {
                data: [serverMessage({ id: 'from-another-device' })],
                meta: { next_cursor: null },
            },
        });

        setOnline(true);
        window.dispatchEvent(new Event('online'));
        await flushPromises();

        expect(window.axios.get).toHaveBeenCalledTimes(1);
        expect(wrapper.text()).toContain('Which wand suits a Gryffindor?');
    });

    it('re-syncs when the WebSocket reconnects, even without a browser online event (BUG-11)', async () => {
        wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        expect(window.axios.get).toHaveBeenCalledTimes(1);

        window.axios.get = vi.fn().mockResolvedValue({
            data: {
                data: [
                    serverMessage({
                        id: 'from-another-device',
                        body: 'Missed via a silent WebSocket drop',
                    }),
                ],
                meta: { next_cursor: null },
            },
        });

        // No 'online' event dispatched here at all — only Pusher-js's own
        // 'connected' event, simulating a WebSocket-level reconnect that
        // never toggled navigator.onLine.
        echoConnectedHandler()();
        await flushPromises();

        expect(window.axios.get).toHaveBeenCalledTimes(1);
        expect(wrapper.text()).toContain('Missed via a silent WebSocket drop');
    });

    it("backfills older pages when more than one page's worth of messages was missed (BUG-12)", async () => {
        window.axios.get = vi.fn().mockResolvedValue({
            data: {
                data: [
                    serverMessage({
                        id: 'seq-1',
                        client_message_id: 'client-id-1',
                        body: 'First message',
                        sequence_number: 1,
                    }),
                ],
                meta: { next_cursor: null },
            },
        });

        wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        expect(wrapper.text()).toContain('First message');

        // The "latest page" now starts at sequence 3, two ahead of what this
        // client already has — a gap that a flat re-fetch would silently
        // drop. The backfill loop should notice and page one older batch to
        // close it.
        window.axios.get = vi
            .fn()
            .mockResolvedValueOnce({
                data: {
                    data: [
                        serverMessage({
                            id: 'seq-3',
                            client_message_id: 'client-id-3',
                            body: 'Third message',
                            sequence_number: 3,
                        }),
                    ],
                    meta: { next_cursor: 'cursor-to-page-2' },
                },
            })
            .mockResolvedValueOnce({
                data: {
                    data: [
                        serverMessage({
                            id: 'seq-2',
                            client_message_id: 'client-id-2',
                            body: 'Second message',
                            sequence_number: 2,
                        }),
                    ],
                    meta: { next_cursor: null },
                },
            });

        window.dispatchEvent(new Event('online'));
        await flushPromises();

        expect(window.axios.get).toHaveBeenNthCalledWith(
            1,
            expect.stringContaining(conversationId),
        );
        expect(window.axios.get).toHaveBeenNthCalledWith(
            2,
            expect.stringContaining('cursor-to-page-2'),
        );

        const text = wrapper.text();
        expect(text).toContain('First message');
        expect(text).toContain('Second message');
        expect(text).toContain('Third message');
        expect(text.indexOf('First message')).toBeLessThan(
            text.indexOf('Second message'),
        );
        expect(text.indexOf('Second message')).toBeLessThan(
            text.indexOf('Third message'),
        );
    });

    it('ignores a synced message it already knows about via the outbox reconciliation, and does not re-add it', async () => {
        const fixedClientMessageId = 'fixed-client-message-id';
        vi.spyOn(crypto, 'randomUUID').mockReturnValue(
            fixedClientMessageId as `${string}-${string}-${string}-${string}-${string}`,
        );

        setOnline(false);

        wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        await wrapper.find('textarea').setValue('Sent while offline');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        const reconciled = serverMessage({
            id: 'server-id-9',
            body: 'Sent while offline',
            sequence_number: 5,
            client_message_id: fixedClientMessageId,
        });
        window.axios.post = vi
            .fn()
            .mockResolvedValue({ status: 201, data: { data: reconciled } });
        window.axios.get = vi.fn().mockResolvedValue({
            data: { data: [reconciled], meta: { next_cursor: null } },
        });

        setOnline(true);
        window.dispatchEvent(new Event('online'));
        await flushPromises();

        expect(wrapper.text().match(/Sent while offline/g)).toHaveLength(1);

        vi.restoreAllMocks();
    });

    it('orders a message synced from another source ahead of a message still queued locally', async () => {
        setOnline(false);

        wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        await wrapper.find('textarea').setValue('My queued message');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        // Never resolves during this test — the locally-queued message stays
        // pending (sequence_number 0) throughout, so the sync's sort has to
        // place the other source's real-sequence message ahead of it.
        window.axios.post = vi.fn().mockReturnValue(new Promise(() => {}));
        window.axios.get = vi.fn().mockResolvedValue({
            data: {
                data: [
                    serverMessage({
                        id: 'from-another-device',
                        body: 'From another device',
                        sequence_number: 7,
                    }),
                ],
                meta: { next_cursor: null },
            },
        });

        setOnline(true);
        window.dispatchEvent(new Event('online'));
        await flushPromises();

        const text = wrapper.text();
        expect(text).toContain('From another device');
        expect(text).toContain('My queued message');
        expect(text.indexOf('From another device')).toBeLessThan(
            text.indexOf('My queued message'),
        );
    });

    it('reorders two real messages by sequence_number when a missed earlier message syncs in after a later one', async () => {
        window.axios.get = vi.fn().mockResolvedValue({
            data: {
                data: [
                    serverMessage({
                        id: 'seq-2',
                        client_message_id: 'client-id-2',
                        body: 'Second message',
                        sequence_number: 2,
                    }),
                ],
                meta: { next_cursor: null },
            },
        });

        wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        expect(wrapper.text()).toContain('Second message');

        window.axios.get = vi.fn().mockResolvedValue({
            data: {
                data: [
                    serverMessage({
                        id: 'seq-1',
                        client_message_id: 'client-id-1-distinct',
                        body: 'First message',
                        sequence_number: 1,
                    }),
                    serverMessage({
                        id: 'seq-2',
                        client_message_id: 'client-id-2',
                        body: 'Second message',
                        sequence_number: 2,
                    }),
                ],
                meta: { next_cursor: null },
            },
        });

        window.dispatchEvent(new Event('online'));
        await flushPromises();

        const text = wrapper.text();
        expect(text).toContain('First message');
        expect(text).toContain('Second message');
        expect(text.indexOf('First message')).toBeLessThan(
            text.indexOf('Second message'),
        );
    });

    it('replays multiple queued messages in order, one at a time', async () => {
        setOnline(false);

        wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        await wrapper.find('textarea').setValue('First');
        await wrapper.find('form').trigger('submit');
        await wrapper.find('textarea').setValue('Second');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(window.axios.post).not.toHaveBeenCalled();

        let resolveFirst: (value: unknown) => void = () => {};
        const firstRequest = new Promise((resolve) => {
            resolveFirst = resolve;
        });
        const postMock = vi
            .fn()
            .mockReturnValueOnce(firstRequest)
            .mockResolvedValueOnce({
                data: {
                    data: serverMessage({ id: 'server-2', body: 'Second' }),
                },
            });
        window.axios.post = postMock;

        setOnline(true);
        window.dispatchEvent(new Event('online'));
        await flushPromises();

        expect(postMock).toHaveBeenCalledTimes(1);

        resolveFirst({
            data: { data: serverMessage({ id: 'server-1', body: 'First' }) },
        });
        await flushPromises();

        expect(postMock).toHaveBeenCalledTimes(2);
    });

    it("shows a thinking indicator after sending a message, and clears it when Game Guide's reply broadcasts in", async () => {
        window.axios.post = vi.fn().mockResolvedValue({
            status: 201,
            data: { data: serverMessage({ id: 'server-id-2' }) },
        });

        wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        expect(thinkingIndicator().exists()).toBe(false);

        await wrapper
            .find('textarea')
            .setValue('Which wand suits a Gryffindor?');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(thinkingIndicator().exists()).toBe(true);

        const onMessageCreated = listenMock.mock.calls[0][1] as (
            message: unknown,
        ) => void;
        onMessageCreated(
            serverMessage({ id: 'reply-1', sender_type: 'assistant' }),
        );
        await wrapper.vm.$nextTick();

        expect(thinkingIndicator().exists()).toBe(false);
    });

    it('does not show a thinking indicator for an idempotent replay (200 response)', async () => {
        window.axios.post = vi.fn().mockResolvedValue({
            status: 200,
            data: { data: serverMessage() },
        });

        wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        await wrapper
            .find('textarea')
            .setValue('Which wand suits a Gryffindor?');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(thinkingIndicator().exists()).toBe(false);
    });

    it('clears the thinking indicator on its own if no reply arrives within the timeout', async () => {
        vi.useFakeTimers();

        window.axios.post = vi.fn().mockResolvedValue({
            status: 201,
            data: { data: serverMessage({ id: 'server-id-2' }) },
        });

        wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        await wrapper
            .find('textarea')
            .setValue('Which wand suits a Gryffindor?');
        await wrapper.find('form').trigger('submit');
        await flushPromises();

        expect(thinkingIndicator().exists()).toBe(true);

        await vi.advanceTimersByTimeAsync(30_000);
        await wrapper.vm.$nextTick();

        expect(thinkingIndicator().exists()).toBe(false);
    });

    it('shows a thinking indicator on load when the most recent message is still an unanswered player message', async () => {
        window.axios.get = vi.fn().mockResolvedValue({
            data: {
                data: [serverMessage({ sender_type: 'player' })],
                meta: { next_cursor: null },
            },
        });

        wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        expect(thinkingIndicator().exists()).toBe(true);
    });

    it('does not show a thinking indicator on load when the most recent message already has an assistant reply', async () => {
        window.axios.get = vi.fn().mockResolvedValue({
            data: {
                data: [serverMessage({ sender_type: 'assistant' })],
                meta: { next_cursor: null },
            },
        });

        wrapper = mount(Chat, { props: { conversationId } });
        await flushPromises();

        expect(thinkingIndicator().exists()).toBe(false);
    });
});
