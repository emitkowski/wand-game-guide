<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { Head } from '@inertiajs/vue3';
import { Loader2, RotateCw, Send, Sparkles } from '@lucide/vue';
import ConversationMessageController from '@/actions/App/Http/Controllers/Api/V1/ConversationMessageController';
import { Button } from '@/components/ui/button';
import { index as gameGuideIndex } from '@/routes/game-guide';

type SenderType = 'player' | 'assistant' | 'system';
type OriginPlatform = 'desktop' | 'web' | 'overlay';
type MessageStatus = 'queued' | 'sending' | 'sent' | 'failed';

interface Message {
    id: string;
    conversation_id: string;
    sender_type: SenderType;
    body: string;
    origin_platform: OriginPlatform;
    client_message_id: string;
    sequence_number: number;
    client_created_at: string | null;
    created_at: string;
    status?: MessageStatus;
}

interface OutboxEntry {
    clientMessageId: string;
    body: string;
    originPlatform: OriginPlatform;
    queuedAt: string;
}

const props = defineProps<{
    conversationId: string;
}>();

defineOptions({
    layout: {
        breadcrumbs: [{ title: 'Game Guide', href: gameGuideIndex() }],
    },
});

const messages = ref<Message[]>([]);
const olderCursor = ref<string | null>(null);
const loadingOlder = ref(false);
const draft = ref('');
const flushing = ref(false);
const scrollContainer = ref<HTMLElement | null>(null);
const pendingReplyCount = ref(0);

const outboxKey = `game-guide:outbox:${props.conversationId}`;

// Game Guide's reply arrives asynchronously (queued job + broadcast, see
// docs/ARCHITECTURE_HISTORY.md's 2026-07-25 AI-reply entry) — there's no
// explicit "reply failed" signal pushed to the client, so each "thinking"
// indicator clears itself after a timeout as a fallback if no assistant
// message ever shows up (e.g. the Anthropic call errored server-side).
const REPLY_TIMEOUT_MS = 30_000;
let replyTimeouts: ReturnType<typeof setTimeout>[] = [];

// syncMissedMessages()'s default fetch only returns the latest page
// (per_page, currently 50 — see docs/CODE_PATTERNS.md's cursor-pagination
// pattern). If more than a page's worth of messages were missed, this bounds
// how many additional older pages it'll fetch to close the gap, so a truly
// enormous gap can't turn a reconnect into an unbounded fetch loop (see
// BUG-12, docs/BUGS_ARCHIVE.md).
const MAX_BACKFILL_PAGES = 20;

function awaitReply() {
    pendingReplyCount.value++;
    scrollToBottom();
    replyTimeouts.push(
        setTimeout(() => {
            pendingReplyCount.value = Math.max(0, pendingReplyCount.value - 1);
        }, REPLY_TIMEOUT_MS),
    );
}

function receivedReply() {
    if (pendingReplyCount.value > 0) {
        pendingReplyCount.value--;
    }

    const timeout = replyTimeouts.shift();

    if (timeout) {
        clearTimeout(timeout);
    }
}

function loadOutbox(): OutboxEntry[] {
    try {
        const raw = localStorage.getItem(outboxKey);

        return raw ? (JSON.parse(raw) as OutboxEntry[]) : [];
    } catch {
        return [];
    }
}

function saveOutbox(entries: OutboxEntry[]) {
    localStorage.setItem(outboxKey, JSON.stringify(entries));
}

function addToOutbox(entry: OutboxEntry) {
    saveOutbox([...loadOutbox(), entry]);
}

function removeFromOutbox(clientMessageId: string) {
    saveOutbox(
        loadOutbox().filter(
            (entry) => entry.clientMessageId !== clientMessageId,
        ),
    );
}

async function scrollToBottom() {
    await nextTick();

    if (scrollContainer.value) {
        scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
    }
}

/**
 * Re-fetches the latest history and merges in anything this client hasn't
 * seen yet — messages from another device/tab/platform sent while this
 * client was offline never arrive via broadcast (Reverb doesn't replay
 * missed events for a disconnected client) and flushOutbox() only pushes
 * this client's own queued sends, so a reconnect would otherwise silently
 * miss them until a manual reload (see BUG-10, docs/BUGS_ARCHIVE.md).
 */
async function syncMissedMessages() {
    const previousMaxSequence = messages.value.reduce(
        (max, m) => Math.max(max, m.sequence_number),
        0,
    );

    const { data } = await window.axios.get(
        ConversationMessageController.index.url(props.conversationId),
    );

    let fetched = data.data as Message[];
    let cursor: string | null = data.meta?.next_cursor ?? null;
    let backfilled = false;
    let guard = 0;

    // The default fetch only returns the latest page — if the oldest message
    // in it is still newer than what this client already had, more than one
    // page's worth of messages was missed while disconnected. Keep paging
    // older via the same cursor `loadOlder()` uses until the gap closes or
    // history runs out (see BUG-12, docs/BUGS_ARCHIVE.md).
    while (
        cursor &&
        fetched.length > 0 &&
        fetched[0].sequence_number > previousMaxSequence + 1 &&
        guard < MAX_BACKFILL_PAGES
    ) {
        const older = await window.axios.get(
            ConversationMessageController.index.url(props.conversationId, {
                query: { cursor },
            }),
        );
        fetched = [...(older.data.data as Message[]), ...fetched];
        cursor = older.data.meta?.next_cursor ?? null;
        backfilled = true;
        guard++;
    }

    if (backfilled) {
        // The effective "oldest loaded" boundary moved further back than
        // whatever loadInitial()/a prior loadOlder() had already set — keep
        // it in sync so a subsequent manual "load older" continues from the
        // right place instead of re-fetching (and re-prepending, since
        // loadOlder() has no dedup) a page that overlaps what was just
        // backfilled here.
        olderCursor.value = cursor;
    }

    let addedAny = false;

    for (const message of fetched) {
        const alreadyKnown = messages.value.some(
            (m) =>
                m.id === message.id ||
                m.client_message_id === message.client_message_id,
        );

        if (!alreadyKnown) {
            messages.value.push(message);
            addedAny = true;
        }
    }

    if (addedAny) {
        // Stable sort: real sequence numbers ascend as usual; any
        // still-unconfirmed local sends (sequence_number 0, from this
        // client's own outbox) keep their relative order and stay last.
        messages.value.sort((a, b) => {
            if (a.sequence_number === 0 && b.sequence_number === 0) {
                return 0;
            }

            if (a.sequence_number === 0) {
                return 1;
            }

            if (b.sequence_number === 0) {
                return -1;
            }

            return a.sequence_number - b.sequence_number;
        });

        await scrollToBottom();
    }
}

async function loadInitial() {
    const { data } = await window.axios.get(
        ConversationMessageController.index.url(props.conversationId),
    );
    messages.value = data.data;
    olderCursor.value = data.meta?.next_cursor ?? null;

    // Heuristic for "still thinking" across a reload: if the newest loaded
    // message is player-authored, an assistant reply is presumably still in
    // flight (or failed silently) — show the indicator until either a reply
    // arrives or the timeout above clears it.
    const newest = messages.value[messages.value.length - 1];

    if (newest?.sender_type === 'player') {
        awaitReply();
    }

    await scrollToBottom();
}

function hydrateOutbox() {
    for (const entry of loadOutbox()) {
        const alreadyFetched = messages.value.some(
            (m) => m.client_message_id === entry.clientMessageId,
        );

        if (alreadyFetched) {
            continue;
        }

        messages.value.push({
            id: entry.clientMessageId,
            conversation_id: props.conversationId,
            sender_type: 'player',
            body: entry.body,
            origin_platform: entry.originPlatform,
            client_message_id: entry.clientMessageId,
            sequence_number: 0,
            client_created_at: entry.queuedAt,
            created_at: entry.queuedAt,
            status: 'queued',
        });
    }
}

async function loadOlder() {
    if (!olderCursor.value || loadingOlder.value) {
        return;
    }

    loadingOlder.value = true;
    const previousHeight = scrollContainer.value?.scrollHeight ?? 0;

    try {
        const { data } = await window.axios.get(
            ConversationMessageController.index.url(props.conversationId, {
                query: { cursor: olderCursor.value },
            }),
        );
        messages.value = [...data.data, ...messages.value];
        olderCursor.value = data.meta?.next_cursor ?? null;

        await nextTick();

        if (scrollContainer.value) {
            scrollContainer.value.scrollTop =
                scrollContainer.value.scrollHeight - previousHeight;
        }
    } finally {
        loadingOlder.value = false;
    }
}

/**
 * Replays the persisted outbox sequentially, one message at a time, so a
 * later message never reaches the server ahead of an earlier one that's
 * still failing/offline — matches docs/game-guide-chat-spec.md §4.3.
 */
async function flushOutbox() {
    if (flushing.value) {
        return;
    }

    flushing.value = true;

    try {
        while (navigator.onLine) {
            const entry = loadOutbox()[0];

            if (!entry) {
                break;
            }

            const message = messages.value.find(
                (m) => m.client_message_id === entry.clientMessageId,
            );

            if (message) {
                message.status = 'sending';
            }

            try {
                const response = await window.axios.post(
                    ConversationMessageController.store.url(
                        props.conversationId,
                    ),
                    {
                        body: entry.body,
                        client_message_id: entry.clientMessageId,
                        origin_platform: entry.originPlatform,
                    },
                );
                const { data } = response;

                removeFromOutbox(entry.clientMessageId);

                const index = messages.value.findIndex(
                    (m) => m.client_message_id === entry.clientMessageId,
                );

                if (index !== -1) {
                    messages.value[index] = { ...data.data, status: 'sent' };
                }

                // A 200 (not 201) means this was an idempotent replay of an
                // already-recorded message — no new Game Guide reply job was
                // dispatched for it server-side (RecordConversationMessage
                // only does that for genuinely new messages), so don't show
                // a "thinking" indicator that would never resolve on its own.
                if (response.status === 201) {
                    awaitReply();
                }
            } catch {
                if (message) {
                    message.status = navigator.onLine ? 'failed' : 'queued';
                }

                break;
            }
        }
    } finally {
        flushing.value = false;
    }
}

async function sendDraft() {
    const body = draft.value.trim();

    if (!body || flushing.value) {
        return;
    }

    const clientMessageId = crypto.randomUUID();
    const now = new Date().toISOString();

    addToOutbox({
        clientMessageId,
        body,
        originPlatform: 'web',
        queuedAt: now,
    });

    messages.value.push({
        id: clientMessageId,
        conversation_id: props.conversationId,
        sender_type: 'player',
        body,
        origin_platform: 'web',
        client_message_id: clientMessageId,
        sequence_number: 0,
        client_created_at: now,
        created_at: now,
        status: navigator.onLine ? 'sending' : 'queued',
    });

    draft.value = '';
    await scrollToBottom();
    await flushOutbox();
}

function retry(message: Message) {
    message.status = 'sending';
    flushOutbox();
}

function onComposerKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendDraft();
    }
}

onMounted(async () => {
    await loadInitial();
    hydrateOutbox();
    await flushOutbox();

    window.Echo.private(`conversation.${props.conversationId}`).listen(
        '.message.created',
        (event: Message) => {
            if (!messages.value.some((m) => m.id === event.id)) {
                messages.value.push(event);

                if (event.sender_type === 'assistant') {
                    receivedReply();
                }

                scrollToBottom();
            }
        },
    );

    window.addEventListener('online', handleReconnect);

    // The browser's `online` event only tells us the network interface came
    // back — it doesn't fire for a WebSocket-level drop/reconnect that never
    // toggles navigator.onLine (a Reverb restart, an idle-timeout disconnect,
    // laptop sleep/wake). Pusher-js's own 'connected' event fires on every
    // successful (re)connection regardless of cause, so it's a more reliable
    // signal for "I might have missed broadcasts" (see BUG-11, docs/BUGS_ARCHIVE.md).
    window.Echo.connector.pusher.connection.bind('connected', handleReconnect);
});

async function handleReconnect() {
    await syncMissedMessages();
    await flushOutbox();
}

onUnmounted(() => {
    window.Echo.leaveChannel(`conversation.${props.conversationId}`);
    window.removeEventListener('online', handleReconnect);
    window.Echo.connector.pusher.connection.unbind('connected', handleReconnect);
    replyTimeouts.forEach(clearTimeout);
    replyTimeouts = [];
});
</script>

<template>
    <Head title="Game Guide" />

    <div
        class="mx-auto flex h-[calc(100dvh-4rem)] w-full max-w-7xl flex-col p-4 sm:p-6 md:h-[calc(100dvh-5rem)] lg:p-8"
    >
        <div class="mb-4 shrink-0">
            <h1 class="text-lg font-semibold">Game Guide</h1>
            <p class="text-sm text-muted-foreground">
                Ask for tips, boss strategies, item locations, or anything
                else you're stuck on — Game Guide remembers your conversation
                across sessions and devices.
            </p>
        </div>

        <div
            class="flex flex-1 flex-col overflow-hidden rounded-xl bg-background shadow-xl"
        >
            <div
                ref="scrollContainer"
                class="flex-1 space-y-4 overflow-y-auto p-4"
            >
                <div v-if="olderCursor" class="flex justify-center">
                    <Button
                        variant="ghost"
                        size="sm"
                        :disabled="loadingOlder"
                        @click="loadOlder"
                    >
                        <Loader2
                            v-if="loadingOlder"
                            class="size-4 animate-spin"
                        />
                        Load older messages
                    </Button>
                </div>

                <div
                    v-for="message in messages"
                    :key="message.id"
                    class="flex items-end gap-2"
                    :class="
                        message.sender_type === 'player'
                            ? 'justify-end'
                            : 'justify-start'
                    "
                >
                    <div
                        v-if="message.sender_type !== 'player'"
                        class="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground"
                    >
                        <Sparkles class="size-4" />
                    </div>

                    <div
                        class="max-w-[80%] rounded-2xl px-4 py-2 text-sm"
                        :class="
                            message.sender_type === 'player'
                                ? 'rounded-br-sm bg-primary text-primary-foreground'
                                : 'rounded-bl-sm bg-muted text-muted-foreground'
                        "
                    >
                        <p class="whitespace-pre-wrap">{{ message.body }}</p>
                        <div
                            v-if="
                                message.status === 'sending' ||
                                message.status === 'queued' ||
                                message.status === 'failed'
                            "
                            class="mt-1 flex items-center gap-1 text-xs opacity-80"
                        >
                            <Loader2
                                v-if="message.status === 'sending'"
                                class="size-3 animate-spin"
                            />
                            <span v-else-if="message.status === 'queued'">
                                Queued — will send when back online
                            </span>
                            <template v-else>
                                <span>Failed to send</span>
                                <button
                                    type="button"
                                    class="inline-flex items-center gap-0.5 underline"
                                    @click="retry(message)"
                                >
                                    <RotateCw class="size-3" />
                                    Retry
                                </button>
                            </template>
                        </div>
                    </div>
                </div>

                <div
                    v-if="pendingReplyCount > 0"
                    data-testid="game-guide-thinking"
                    class="flex items-end justify-start gap-2"
                >
                    <div
                        class="flex size-7 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-sidebar-primary-foreground"
                    >
                        <Sparkles class="size-4" />
                    </div>

                    <div
                        class="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-muted px-4 py-3"
                    >
                        <span
                            class="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.3s]"
                        />
                        <span
                            class="size-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.15s]"
                        />
                        <span
                            class="size-1.5 animate-bounce rounded-full bg-muted-foreground"
                        />
                    </div>
                </div>
            </div>

            <form
                class="flex items-end gap-2 border-t border-sidebar-border bg-muted/30 p-3"
                @submit.prevent="sendDraft"
            >
                <textarea
                    v-model="draft"
                    rows="1"
                    placeholder="Ask Game Guide anything…"
                    class="max-h-32 flex-1 resize-none rounded-3xl border border-input bg-background px-4 py-2.5 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    @keydown="onComposerKeydown"
                />
                <Button
                    type="submit"
                    size="icon"
                    class="shrink-0 rounded-full"
                    :disabled="flushing || !draft.trim()"
                >
                    <Send class="size-4" />
                </Button>
            </form>
        </div>
    </div>
</template>
