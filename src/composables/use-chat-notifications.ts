import { onUnmounted } from 'vue';
import { authService } from '@/services/auth.service';
import { useKrefasyStore } from '@/stores/krefasy.store';

const POLL_INTERVAL_MS = 30_000;

let pollIntervalId: ReturnType<typeof setInterval> | null = null;

export function useChatNotifications() {
    const krefasyStore = useKrefasyStore();

    const fetchNotifications = async () => {
        if (!authService.isAuthenticated()) return;
        await krefasyStore.fetchUnreadChatNotifications();
    };

    const startPolling = () => {
        if (pollIntervalId !== null) return;

        void fetchNotifications();

        pollIntervalId = setInterval(() => {
            void fetchNotifications();
        }, POLL_INTERVAL_MS);
    };

    const stopPolling = () => {
        if (pollIntervalId !== null) {
            clearInterval(pollIntervalId);
            pollIntervalId = null;
        }
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
