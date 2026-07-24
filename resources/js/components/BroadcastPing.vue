<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue';
import { usePage } from '@inertiajs/vue3';
import { CheckCircle2, Loader2, Radio } from '@lucide/vue';
import Button from '@/components/ui/button/Button.vue';

type PingStatus = 'idle' | 'waiting' | 'received';

const page = usePage();
const userId = computed(() => page.props.auth.user.id);

const status = ref<PingStatus>('idle');
const receivedAt = ref<string | null>(null);

function ping() {
    status.value = 'waiting';
    receivedAt.value = null;

    window.axios.post('/api/v1/broadcast-ping').catch(() => {
        status.value = 'idle';
    });
}

onMounted(() => {
    if (userId.value) {
        window.Echo.channel(`broadcast-ping.${userId.value}`).listen(
            '.ping',
            () => {
                status.value = 'received';
                receivedAt.value = new Date().toLocaleTimeString();
            },
        );
    }
});

onUnmounted(() => {
    if (userId.value) {
        window.Echo.leaveChannel(`broadcast-ping.${userId.value}`);
    }
});
</script>

<template>
    <div class="flex items-center gap-4 p-4">
        <Button
            variant="secondary"
            :disabled="status === 'waiting'"
            @click="ping"
        >
            <Radio class="size-4" />
            WebSocket Ping
        </Button>

        <span
            v-if="status === 'waiting'"
            class="flex items-center gap-2 text-sm text-muted-foreground"
        >
            <Loader2 class="size-4 animate-spin" />
            Waiting for queue + WebSocket…
        </span>

        <span
            v-else-if="status === 'received'"
            class="flex items-center gap-2 text-sm font-medium text-green-600 dark:text-green-500"
        >
            <CheckCircle2 class="size-5" />
            WebSocket OK — received at {{ receivedAt }}
        </span>
    </div>
</template>
