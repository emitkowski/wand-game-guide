<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { MessagesSquare } from '@lucide/vue';
import BroadcastPing from '@/components/BroadcastPing.vue';
import { dashboard } from '@/routes';
import { index as gameGuideIndex } from '@/routes/game-guide';

defineOptions({
    layout: {
        breadcrumbs: [
            {
                title: 'Dashboard',
                href: dashboard(),
            },
        ],
    },
});
</script>

<template>
    <Head title="Dashboard" />

    <div class="flex h-full flex-1 flex-col gap-4 p-4">
        <div class="flex flex-wrap gap-4">
            <Link
                :href="gameGuideIndex()"
                class="group relative flex aspect-video max-w-sm flex-1 flex-col justify-between overflow-hidden rounded-xl border border-sidebar-border/70 p-4 transition-colors hover:border-primary/50 hover:bg-accent dark:border-sidebar-border"
            >
                <MessagesSquare
                    class="size-6 text-muted-foreground group-hover:text-primary"
                />
                <div>
                    <p class="font-semibold">Game Guide</p>
                    <p class="text-sm text-muted-foreground">
                        Ask about wands, spells, and more
                    </p>
                </div>
            </Link>

            <div
                class="relative flex aspect-video max-w-sm flex-1 items-center justify-center overflow-hidden rounded-xl border border-sidebar-border/70 dark:border-sidebar-border"
            >
                <BroadcastPing />
            </div>
        </div>
    </div>
</template>
