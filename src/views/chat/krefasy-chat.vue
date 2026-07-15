<template>
    <div>
        <PageHeader
            title="Chat"
            subtitle="Comunique-se com clientes e equipa em tempo real"
            :breadcrumbs="[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Chat' }]"
        >
            <template #actions>
                <button type="button" class="btn btn-primary" @click="showConversationModal = true">
                    <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                    </svg>
                    Nova conversa
                </button>
            </template>
        </PageHeader>

        <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
            <!-- Lista de Conversas -->
            <div class="lg:col-span-1">
                <div class="panel h-full flex flex-col">
                    <div class="flex items-center justify-between mb-4 pb-4 border-b">
                        <div>
                            <h3 class="text-lg font-semibold">Conversas</h3>
                            <p v-if="conversationStats" class="text-xs text-gray-500 mt-1">
                                {{ conversationStats.openConversations }} abertas
                                <span v-if="conversationStats.urgentConversations > 0" class="text-danger">
                                    · {{ conversationStats.urgentConversations }} urgentes
                                </span>
                            </p>
                        </div>
                        <button
                            type="button"
                            class="btn btn-sm btn-outline-primary"
                            :disabled="conversationsLoading || conversationsRefreshing"
                            @click="refreshConversations"
                        >
                            <svg
                                class="w-4 h-4"
                                :class="{ 'animate-spin': conversationsLoading || conversationsRefreshing }"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                            </svg>
                        </button>
                    </div>

                    <div class="mb-4 space-y-2">
                        <select v-model="statusFilter" class="form-select text-sm">
                            <option value="">Todos os status</option>
                            <option value="OPEN">Abertas</option>
                            <option value="PENDING">Pendentes</option>
                            <option value="RESOLVED">Resolvidas</option>
                            <option value="CLOSED">Fechadas</option>
                        </select>
                        <select v-model="priorityFilter" class="form-select text-sm">
                            <option value="">Todas as prioridades</option>
                            <option value="URGENT">Urgente</option>
                            <option value="HIGH">Alta</option>
                            <option value="MEDIUM">Média</option>
                            <option value="LOW">Baixa</option>
                        </select>
                    </div>

                    <div class="flex-1 overflow-y-auto space-y-2">
                        <div v-if="conversationsLoading && conversations.length === 0" class="flex items-center justify-center py-8">
                            <svg class="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>

                        <div v-else-if="conversations.length === 0" class="text-center py-8 px-4">
                            <svg class="mx-auto h-10 w-10 text-gray-400 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <p class="text-sm text-gray-500">Nenhuma conversa encontrada</p>
                            <button type="button" class="btn btn-sm btn-primary mt-3" @click="showConversationModal = true">
                                Criar primeira conversa
                            </button>
                        </div>

                        <div
                            v-else
                            v-for="conversation in conversations"
                            :key="conversation.id"
                            class="p-3 rounded-lg cursor-pointer transition-colors"
                            :class="{
                                'bg-primary text-white': selectedConversation?.id === conversation.id,
                                'bg-gray-50 hover:bg-gray-100 dark:bg-dark-light dark:hover:bg-dark': selectedConversation?.id !== conversation.id
                            }"
                            @click="selectConversation(conversation)"
                        >
                            <div class="flex items-start justify-between">
                                <div class="flex-1 min-w-0">
                                    <div class="flex items-center gap-2">
                                        <h4 class="font-semibold text-sm truncate">{{ conversation.clientName }}</h4>
                                        <span
                                            class="badge text-xs"
                                            :class="getPriorityClass(conversation.priority)"
                                        >
                                            {{ getPriorityLabel(conversation.priority) }}
                                        </span>
                                    </div>
                                    <p class="text-xs opacity-75 truncate">{{ conversation.subject }}</p>
                                    <p class="text-xs opacity-60">{{ formatTime(conversation.lastMessageAt) }}</p>
                                </div>
                                <div class="flex flex-col items-end gap-1">
                                    <span
                                        v-if="conversation.unreadCount > 0"
                                        class="badge badge-primary text-xs"
                                    >
                                        {{ conversation.unreadCount }}
                                    </span>
                                    <span
                                        class="w-2 h-2 rounded-full"
                                        :class="getStatusClass(conversation.status)"
                                    ></span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Área de Chat -->
            <div class="lg:col-span-3">
                <div class="panel h-full flex flex-col" v-if="selectedConversation">
                    <div class="flex items-center justify-between p-4 border-b">
                        <div class="flex items-center gap-3">
                            <div class="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                                <span class="text-primary font-semibold">
                                    {{ getInitials(selectedConversation.clientName) }}
                                </span>
                            </div>
                            <div>
                                <h3 class="font-semibold">{{ selectedConversation.clientName }}</h3>
                                <p class="text-sm text-gray-600">{{ selectedConversation.clientEmail }}</p>
                            </div>
                        </div>
                        <div class="flex items-center gap-2">
                            <span
                                class="badge"
                                :class="getStatusClass(selectedConversation.status)"
                            >
                                {{ getStatusLabel(selectedConversation.status) }}
                            </span>
                            <button
                                v-if="selectedConversation.status !== 'RESOLVED' && selectedConversation.status !== 'CLOSED'"
                                type="button"
                                class="btn btn-sm btn-outline-primary"
                                :disabled="resolvingConversation"
                                @click="resolveConversation"
                            >
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                Resolver
                            </button>
                        </div>
                    </div>

                    <div class="flex-1 overflow-y-auto p-4 space-y-4 relative" ref="messagesContainer">
                        <div
                            v-if="messagesRefreshing"
                            class="sticky top-0 z-10 text-center py-1 text-xs text-gray-500 bg-white/80 dark:bg-dark/80 rounded"
                        >
                            A actualizar...
                        </div>
                        <div
                            v-if="messagesLoading && !hasCachedMessagesForActive"
                            class="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-dark/50 z-10"
                        >
                            <svg class="animate-spin h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>

                        <div v-if="!messagesLoading && currentMessages.length === 0" class="text-center py-8 text-gray-500">
                            Nenhuma mensagem nesta conversa
                        </div>

                        <div
                            v-for="message in currentMessages"
                            :key="message.id"
                            class="flex"
                            :class="{
                                'justify-end': message.senderType === 'ADMIN',
                                'justify-start': message.senderType !== 'ADMIN'
                            }"
                        >
                            <div
                                class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg"
                                :class="{
                                    'bg-primary text-white': message.senderType === 'ADMIN',
                                    'bg-gray-100 dark:bg-dark-light': message.senderType !== 'ADMIN'
                                }"
                            >
                                <div v-if="message.messageType === 'TEXT' || message.messageType === 'SYSTEM'">
                                    <p class="text-sm">{{ message.content }}</p>
                                </div>

                                <div v-else-if="message.messageType === 'IMAGE'">
                                    <div class="mb-2">
                                        <img
                                            :src="message.attachments?.[0]?.url"
                                            :alt="message.attachments?.[0]?.name"
                                            class="max-w-full h-auto rounded cursor-pointer"
                                            @click="openImageModal(message.attachments?.[0]?.url || '')"
                                        />
                                    </div>
                                    <p v-if="message.content" class="text-sm">{{ message.content }}</p>
                                </div>

                                <div v-else-if="message.messageType === 'FILE'">
                                    <div class="flex items-center gap-2 p-2 bg-white/10 rounded">
                                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                        </svg>
                                        <div class="flex-1">
                                            <p class="text-sm font-medium">{{ message.attachments?.[0]?.name }}</p>
                                            <p class="text-xs opacity-75">{{ formatFileSize(message.attachments?.[0]?.size || 0) }}</p>
                                        </div>
                                        <a
                                            :href="message.attachments?.[0]?.url"
                                            target="_blank"
                                            class="btn btn-xs btn-outline-primary"
                                        >
                                            Download
                                        </a>
                                    </div>
                                    <p v-if="message.content" class="text-sm mt-2">{{ message.content }}</p>
                                </div>

                                <div class="flex items-center justify-between mt-1">
                                    <span class="text-xs opacity-75">{{ formatTime(message.createdAt) }}</span>
                                    <div class="flex items-center gap-1">
                                        <span v-if="message.senderType === 'ADMIN'" class="text-xs opacity-75">
                                            {{ message.read ? '✓✓' : '✓' }}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="p-4 border-t">
                        <div class="flex gap-2">
                            <div class="flex-1">
                                <textarea
                                    ref="messageTextarea"
                                    v-model="newMessage"
                                    class="form-input resize-none"
                                    placeholder="Digite sua mensagem..."
                                    rows="2"
                                    :disabled="sendingMessage"
                                    @keydown.enter.prevent="handleSendMessage"
                                ></textarea>
                            </div>
                            <div class="flex flex-col gap-2">
                                <input
                                    ref="fileInput"
                                    type="file"
                                    class="hidden"
                                    @change="handleFileSelect"
                                />
                                <button
                                    type="button"
                                    class="btn btn-outline-primary btn-sm"
                                    :disabled="sendingMessage || uploadingFile"
                                    @click="attachFile"
                                    title="Anexar arquivo"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path>
                                    </svg>
                                </button>
                                <button
                                    type="button"
                                    class="btn btn-primary btn-sm"
                                    :disabled="!newMessage.trim() || sendingMessage"
                                    @click="handleSendMessage"
                                >
                                    <svg
                                        v-if="sendingMessage"
                                        class="animate-spin w-4 h-4"
                                        xmlns="http://www.w3.org/2000/svg"
                                        fill="none"
                                        viewBox="0 0 24 24"
                                    >
                                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                    </svg>
                                    <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                <div v-else class="panel h-full flex items-center justify-center">
                    <div class="text-center">
                        <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                        </svg>
                        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Selecione uma conversa</h3>
                        <p class="text-gray-500 dark:text-gray-400">Escolha uma conversa da lista ou crie uma nova.</p>
                    </div>
                </div>
            </div>
        </div>

        <ConversationModal
            :show="showConversationModal"
            @close="showConversationModal = false"
            @created="onConversationCreated"
        />

        <div v-if="showImageModal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" @click="showImageModal = false">
            <div class="max-w-4xl max-h-full p-4">
                <img :src="selectedImage" alt="Imagem" class="max-w-full max-h-full object-contain" />
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import PageHeader from '@/components/layout/PageHeader.vue';
import ConversationModal from '@/views/chat/ConversationModal.vue';
import { ref, watch, onMounted, onUnmounted, nextTick, computed } from 'vue';
import { storeToRefs } from 'pinia';
import Swal from 'sweetalert2';
import { useKrefasyStore } from '@/stores/krefasy.store';
import { Conversation } from '@/services/messages.service';

const store = useKrefasyStore();
const {
    conversations,
    conversationsLoading,
    conversationsRefreshing,
    selectedConversation,
    currentMessages,
    messagesLoading,
    messagesRefreshing,
    conversationStats,
} = storeToRefs(store);

const hasCachedMessagesForActive = computed(() =>
    selectedConversation.value
        ? store.hasCachedMessages(selectedConversation.value.id)
        : false
);

const newMessage = ref('');
const messageTextarea = ref<HTMLTextAreaElement>();
const statusFilter = ref('');
const priorityFilter = ref('');
const showImageModal = ref(false);
const selectedImage = ref('');
const messagesContainer = ref<HTMLElement>();
const fileInput = ref<HTMLInputElement>();
const showConversationModal = ref(false);
const sendingMessage = ref(false);
const uploadingFile = ref(false);
const resolvingConversation = ref(false);

const MAX_FILE_SIZE = Number(import.meta.env.VITE_MAX_FILE_SIZE) || 10485760;

const buildFilters = () => {
    const filters: Record<string, string> = {};
    if (statusFilter.value) filters.status = statusFilter.value;
    if (priorityFilter.value) filters.priority = priorityFilter.value;
    return filters;
};

const loadConversations = async (options?: { force?: boolean }) => {
    try {
        const filters = buildFilters();
        await store.fetchConversations(filters, options);
        void store.fetchConversationStats();
    } catch (error) {
        console.error('Erro ao carregar conversas:', error);
        Swal.fire('Erro', 'Erro ao carregar conversas', 'error');
    }
};

const selectConversation = async (conversation: Conversation) => {
    try {
        store.setActiveConversation(conversation);
        await store.fetchMessages(conversation.id);
        void store.markConversationAsRead(conversation.id);
        nextTick(() => scrollToBottom());
    } catch (error) {
        console.error('Erro ao carregar conversa:', error);
        Swal.fire('Erro', 'Erro ao carregar conversa', 'error');
    }
};

const handleSendMessage = async () => {
    if (!newMessage.value.trim() || !selectedConversation.value || sendingMessage.value) return;

    sendingMessage.value = true;
    try {
        await store.sendMessage({
            conversationId: selectedConversation.value.id,
            content: newMessage.value.trim(),
            messageType: 'TEXT',
        });
        newMessage.value = '';
        nextTick(() => scrollToBottom());
    } catch (error) {
        console.error('Erro ao enviar mensagem:', error);
        Swal.fire('Erro', 'Erro ao enviar mensagem', 'error');
    } finally {
        sendingMessage.value = false;
    }
};

const attachFile = () => {
    fileInput.value?.click();
};

const handleFileSelect = async (event: Event) => {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !selectedConversation.value) return;

    if (file.size > MAX_FILE_SIZE) {
        Swal.fire('Erro', `O arquivo excede o limite de ${formatFileSize(MAX_FILE_SIZE)}`, 'error');
        input.value = '';
        return;
    }

    uploadingFile.value = true;
    try {
        const messageType = file.type.startsWith('image/') ? 'IMAGE' : 'FILE';
        await store.sendMessage({
            conversationId: selectedConversation.value.id,
            content: newMessage.value.trim() || file.name,
            messageType,
            attachments: [file],
        });
        newMessage.value = '';
        nextTick(() => scrollToBottom());
    } catch (error) {
        console.error('Erro ao enviar anexo:', error);
        Swal.fire('Erro', 'Erro ao enviar anexo', 'error');
    } finally {
        uploadingFile.value = false;
        input.value = '';
    }
};

const openImageModal = (imageUrl: string) => {
    selectedImage.value = imageUrl;
    showImageModal.value = true;
};

const scrollToBottom = () => {
    if (messagesContainer.value) {
        messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight;
    }
};

const refreshConversations = () => {
    loadConversations({ force: true });
};

const resolveConversation = async () => {
    if (!selectedConversation.value || resolvingConversation.value) return;

    resolvingConversation.value = true;
    try {
        await store.updateConversationStatus(selectedConversation.value.id, 'RESOLVED');
        Swal.fire('Sucesso', 'Conversa resolvida com sucesso', 'success');
    } catch (error) {
        console.error('Erro ao resolver conversa:', error);
        Swal.fire('Erro', 'Erro ao resolver conversa', 'error');
    } finally {
        resolvingConversation.value = false;
    }
};

const onConversationCreated = async (conversation: Conversation) => {
    showConversationModal.value = false;
    if (!conversations.value.some((c) => c.id === conversation.id)) {
        conversations.value.unshift(conversation);
    }
    await selectConversation(conversation);
};

const getPriorityClass = (priority: string) => {
    switch (priority) {
        case 'URGENT': return 'badge-danger';
        case 'HIGH': return 'badge-warning';
        case 'MEDIUM': return 'badge-info';
        case 'LOW': return 'badge-secondary';
        default: return 'badge-secondary';
    }
};

const getPriorityLabel = (priority: string) => {
    switch (priority) {
        case 'URGENT': return 'Urgente';
        case 'HIGH': return 'Alta';
        case 'MEDIUM': return 'Média';
        case 'LOW': return 'Baixa';
        default: return priority;
    }
};

const getStatusClass = (status: string) => {
    switch (status) {
        case 'OPEN': return 'bg-green-500';
        case 'PENDING': return 'bg-yellow-500';
        case 'RESOLVED': return 'bg-blue-500';
        case 'CLOSED': return 'bg-gray-500';
        default: return 'bg-gray-500';
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'OPEN': return 'Aberta';
        case 'PENDING': return 'Pendente';
        case 'RESOLVED': return 'Resolvida';
        case 'CLOSED': return 'Fechada';
        default: return status;
    }
};

const getInitials = (name: string) => {
    return name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatTime = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (hours < 1) {
        return `${minutes}min`;
    } else if (hours < 24) {
        return `${hours}h`;
    }
    return date.toLocaleDateString('pt-BR');
};

const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

watch([statusFilter, priorityFilter], () => {
    loadConversations({ force: true });
});

const openPendingConversation = async () => {
    const pendingId = store.pendingChatConversationId;
    if (!pendingId) return;

    const conversation = conversations.value.find((c) => c.id === pendingId);
    if (conversation) {
        await selectConversation(conversation);
    } else {
        try {
            const fetched = await store.fetchConversationById(pendingId, { force: true });
            await store.fetchMessages(fetched.id);
            void store.markConversationAsRead(fetched.id);
            nextTick(() => scrollToBottom());
        } catch (error) {
            console.error('Erro ao abrir conversa pendente:', error);
        }
    }

    if (store.pendingChatDraftMessage) {
        newMessage.value = store.pendingChatDraftMessage;
        store.clearPendingChatDraftMessage();
        nextTick(() => {
            messageTextarea.value?.focus();
        });
    }

    store.clearPendingChatConversationId();
};

onMounted(async () => {
    store.setChatPageActive(true);
    await loadConversations();
    await openPendingConversation();
});

onUnmounted(() => {
    store.setChatPageActive(false);
});
</script>
