import { ref } from 'vue';
import { useRouter } from 'vue-router';
import Swal from 'sweetalert2';
import { useKrefasyStore } from '@/stores/krefasy.store';
import { messagesService, type Conversation } from '@/services/messages.service';
import {
    buildCollectionQuickMessage,
    resolveCollectionChatMeta,
    type CollectionChatContext,
} from '@/utils/collection-chat.utils';

const OPEN_STATUSES = new Set(['OPEN', 'PENDING']);

function pickActiveConversation(conversations: Conversation[]): Conversation | undefined {
    return conversations.find((c) => OPEN_STATUSES.has(c.status)) || conversations[0];
}

export function useCollectionChat() {
    const router = useRouter();
    const store = useKrefasyStore();
    const loading = ref(false);

    async function openCollectionChat(
        context: CollectionChatContext,
        options: { templateIndex?: number } = {}
    ) {
        if (!context.clientId?.trim()) {
            await Swal.fire({
                title: 'Cliente indisponível',
                text: 'Não foi possível identificar o cliente para abrir o chat.',
                icon: 'warning',
                confirmButtonColor: '#801f82',
            });
            return;
        }

        loading.value = true;

        try {
            const draft = buildCollectionQuickMessage(context, options.templateIndex ?? 0);
            const meta = resolveCollectionChatMeta(context);

            let conversation: Conversation | undefined;

            try {
                const existing = await messagesService.getConversationsByClient(context.clientId, {
                    page: 1,
                    limit: 10,
                });
                conversation = pickActiveConversation(existing.conversations);
            } catch {
                conversation = undefined;
            }

            if (!conversation) {
                conversation = await messagesService.createConversation({
                    clientId: context.clientId,
                    subject: meta.subject,
                    category: meta.category,
                    priority: meta.priority,
                    initialMessage: '',
                });
            }

            store.setPendingChatConversationId(conversation.id);
            store.setPendingChatDraftMessage(draft);
            await router.push('/chat');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Não foi possível abrir o chat de cobrança.';
            await Swal.fire({
                title: 'Erro',
                text: message,
                icon: 'error',
                confirmButtonColor: '#dc3545',
            });
        } finally {
            loading.value = false;
        }
    }

    return {
        loading,
        openCollectionChat,
    };
}
