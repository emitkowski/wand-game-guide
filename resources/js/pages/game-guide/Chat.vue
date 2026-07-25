<script setup lang="ts">
import { nextTick, onMounted, onUnmounted, ref } from 'vue';
import { Head } from '@inertiajs/vue3';
import { Loader2, RotateCw, Send } from '@lucide/vue';
import ConversationMessageController from '@/actions/App/Http/Controllers/Api/V1/ConversationMessageController';
import { Button } from '@/components/ui/button';
import { index as gameGuideIndex } from '@/routes/game-guide';

type SenderType = 'player' | 'assistant' | 'system';
type OriginPlatform = 'desktop' | 'web' | 'overlay';
type MessageStatus = 'sending' | 'sent' | 'failed';

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

const props = defineProps<{
    conversationId: string;
}>();

defineOptions({
    layout: {
        breadcrumbs: [{ title: 'Game Guide', href: gameGuideIndex() }],
    },
});

const messages = ref<Message[]>([]);
const prevCursor = ref<string | null>(null);
const loadingOlder = ref(false);
const draft = ref('');
const sending = ref(false);
const scrollContainer = ref<HTMLElement | null>(null);

async function scrollToBottom() {
    await nextTick();

    if (scrollContainer.value) {
        scrollContainer.value.scrollTop = scrollContainer.value.scrollHeight;
    }
}

async function loadInitial() {
    const { data } = await window.axios.get(
        ConversationMessageController.index.url(props.conversationId, {
            query: { limit: 30 },
        }),
    );
    messages.value = data.data;
    prevCursor.value = data.meta?.prev_cursor ?? null;
    await scrollToBottom();
}

async function loadOlder() {
    if (!prevCursor.value || loadingOlder.value) {
        return;
    }

    loadingOlder.value = true;
    const previousHeight = scrollContainer.value?.scrollHeight ?? 0;

    try {
        const { data } = await window.axios.get(
            ConversationMessageController.index.url(props.conversationId, {
                query: { cursor: prevCursor.value, limit: 30 },
            }),
        );
        messages.value = [...data.data, ...messages.value];
        prevCursor.value = data.meta?.prev_cursor ?? null;

        await nextTick();

        if (scrollContainer.value) {
            scrollContainer.value.scrollTop =
                scrollContainer.value.scrollHeight - previousHeight;
        }
    } finally {
        loadingOlder.value = false;
    }
}

async function send(message: Message) {
    sending.value = true;

    try {
        const { data } = await window.axios.post(
            ConversationMessageController.store.url(props.conversationId),
            {
                body: message.body,
                client_message_id: message.client_message_id,
                origin_platform: message.origin_platform,
            },
        );

        const index = messages.value.findIndex(
            (m) => m.client_message_id === message.client_message_id,
        );

        if (index !== -1) {
            messages.value[index] = { ...data.data, status: 'sent' };
        }
    } catch {
        const index = messages.value.findIndex(
            (m) => m.client_message_id === message.client_message_id,
        );

        if (index !== -1) {
            messages.value[index] = {
                ...messages.value[index],
                status: 'failed',
            };
        }
    } finally {
        sending.value = false;
    }
}

async function sendDraft() {
    const body = draft.value.trim();

    if (!body || sending.value) {
        return;
    }

    const clientMessageId = crypto.randomUUID();
    const now = new Date().toISOString();

    const optimistic: Message = {
        id: clientMessageId,
        conversation_id: props.conversationId,
        sender_type: 'player',
        body,
        origin_platform: 'web',
        client_message_id: clientMessageId,
        sequence_number: 0,
        client_created_at: now,
        created_at: now,
        status: 'sending',
    };

    messages.value.push(optimistic);
    draft.value = '';
    await scrollToBottom();
    await send(optimistic);
}

function retry(message: Message) {
    message.status = 'sending';
    send(message);
}

function onComposerKeydown(event: KeyboardEvent) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendDraft();
    }
}

onMounted(() => {
    loadInitial();

    window.Echo.private(`conversation.${props.conversationId}`).listen(
        '.message.created',
        (event: Message) => {
            if (!messages.value.some((m) => m.id === event.id)) {
                messages.value.push(event);
                scrollToBottom();
            }
        },
    );
});

onUnmounted(() => {
    window.Echo.leaveChannel(`conversation.${props.conversationId}`);
});
</script>

<template>
    <Head title="Game Guide" />

    <div class="flex h-full flex-1 flex-col gap-4 p-4">
        <div
            class="flex flex-1 flex-col overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border"
        >
            <div
                ref="scrollContainer"
                class="flex-1 space-y-3 overflow-y-auto p-4"
            >
                <div v-if="prevCursor" class="flex justify-center">
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
                    class="flex"
                    :class="
                        message.sender_type === 'player'
                            ? 'justify-end'
                            : 'justify-start'
                    "
                >
                    <div
                        class="max-w-[75%] rounded-xl px-4 py-2 text-sm"
                        :class="
                            message.sender_type === 'player'
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-muted-foreground'
                        "
                    >
                        <p class="whitespace-pre-wrap">{{ message.body }}</p>
                        <div
                            v-if="
                                message.status === 'sending' ||
                                message.status === 'failed'
                            "
                            class="mt-1 flex items-center gap-1 text-xs opacity-80"
                        >
                            <Loader2
                                v-if="message.status === 'sending'"
                                class="size-3 animate-spin"
                            />
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
            </div>

            <form
                class="flex items-end gap-2 border-t border-sidebar-border/70 p-3 dark:border-sidebar-border"
                @submit.prevent="sendDraft"
            >
                <textarea
                    v-model="draft"
                    rows="1"
                    placeholder="Ask Game Guide anything…"
                    class="flex-1 resize-none rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50"
                    @keydown="onComposerKeydown"
                />
                <Button
                    type="submit"
                    size="icon"
                    :disabled="sending || !draft.trim()"
                >
                    <Send class="size-4" />
                </Button>
            </form>
        </div>
    </div>
</template>
