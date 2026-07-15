import { onUnmounted } from 'vue';
import { authService } from '@/services/auth.service';
import { useKrefasyStore } from '@/stores/krefasy.store';

const POLL_INTERVAL_MS = 30_000;
const CHAT_ACTIVE_POLL_MS = 15_000;
const HIDDEN_TAB_POLL_MS = 45_000;

let pollIntervalId: ReturnType<typeof setInterval> | null = null;
let visibilityHandler: (() => void) | null = null;
let activeStore: ReturnType<typeof useKrefasyStore> | null = null;

function getPollIntervalMs(isChatPageActive: boolean): number {
    if (document.visibilityState === 'hidden') return HIDDEN_TAB_POLL_MS;
    if (isChatPageActive) return CHAT_ACTIVE_POLL_MS;
    return POLL_INTERVAL_MS;
}

async function runPollCycle(krefasyStore: ReturnType<typeof useKrefasyStore>) {
    if (!authService.isAuthenticated()) return;

    if (krefasyStore.isChatPageActive) {
        const activeId = krefasyStore.activeConversationId;
        if (activeId) {
            await krefasyStore.fetchMessages(activeId, { force: true, silent: true });
        }
        await krefasyStore.fetchConversations(undefined, { silent: true });
        await krefasyStore.fetchConversationStats();
        return;
    }

    await krefasyStore.fetchUnreadChatNotifications();
}

function stopPollingInternal() {
    if (pollIntervalId !== null) {
        clearInterval(pollIntervalId);
        pollIntervalId = null;
    }
    if (visibilityHandler) {
        document.removeEventListener('visibilitychange', visibilityHandler);
        visibilityHandler = null;
    }
}

function startPollingInternal(krefasyStore: ReturnType<typeof useKrefasyStore>) {
    stopPollingInternal();
    activeStore = krefasyStore;

    void runPollCycle(krefasyStore);

    pollIntervalId = setInterval(() => {
        if (activeStore) void runPollCycle(activeStore);
    }, getPollIntervalMs(krefasyStore.isChatPageActive));

    visibilityHandler = () => {
        if (activeStore) startPollingInternal(activeStore);
    };
    document.addEventListener('visibilitychange', visibilityHandler);
}

export function useChatNotifications() {
    const krefasyStore = useKrefasyStore();

    const fetchNotifications = async () => {
        if (!authService.isAuthenticated()) return;
        await krefasyStore.fetchUnreadChatNotifications();
    };

    const startPolling = () => {
        if (pollIntervalId !== null && activeStore === krefasyStore) return;
        startPollingInternal(krefasyStore);
    };

    const stopPolling = () => {
        stopPollingInternal();
        activeStore = null;
    };

    onUnmounted(() => {
        stopPolling();
    });

    return {
        startPolling,
        stopPolling,
        fetchNotifications,
    };
}
