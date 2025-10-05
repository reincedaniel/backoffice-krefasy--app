<template>
    <div>
        <!-- Breadcrumb -->
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <router-link to="/dashboard" class="text-primary hover:underline">Dashboard</router-link>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Chat</span>
            </li>
        </ul>

        <div class="pt-5">
            <div class="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
                <!-- Lista de Conversas -->
                <div class="lg:col-span-1">
                    <div class="panel h-full flex flex-col">
                        <!-- Header -->
                        <div class="flex items-center justify-between mb-4 pb-4 border-b">
                            <h3 class="text-lg font-semibold">Conversas</h3>
                            <div class="flex items-center gap-2">
                                <button
                                    type="button"
                                    class="btn btn-sm btn-outline-primary"
                                    @click="refreshConversations"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        <!-- Filtros -->
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

                        <!-- Lista de Conversas -->
                        <div class="flex-1 overflow-y-auto space-y-2">
                            <div
                                v-for="conversation in filteredConversations"
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
                        <!-- Header da Conversa -->
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
                                    type="button"
                                    class="btn btn-sm btn-outline-primary"
                                    @click="updateConversationStatus"
                                >
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    Resolver
                                </button>
                            </div>
                        </div>

                        <!-- Área de Mensagens -->
                        <div class="flex-1 overflow-y-auto p-4 space-y-4" ref="messagesContainer">
                            <div
                                v-for="message in currentMessages"
                                :key="message.id"
                                class="flex"
                                :class="{
                                    'justify-end': message.senderType === 'ADMIN',
                                    'justify-start': message.senderType === 'CLIENT'
                                }"
                            >
                                <div
                                    class="max-w-xs lg:max-w-md px-4 py-2 rounded-lg"
                                    :class="{
                                        'bg-primary text-white': message.senderType === 'ADMIN',
                                        'bg-gray-100 dark:bg-dark-light': message.senderType === 'CLIENT'
                                    }"
                                >
                                    <!-- Conteúdo da Mensagem -->
                                    <div v-if="message.messageType === 'TEXT'">
                                        <p class="text-sm">{{ message.content }}</p>
                                    </div>

                                    <!-- Mensagem com Imagem -->
                                    <div v-else-if="message.messageType === 'IMAGE'">
                                        <div class="mb-2">
                                            <img
                                                :src="message.attachments?.[0]?.url"
                                                :alt="message.attachments?.[0]?.name"
                                                class="max-w-full h-auto rounded cursor-pointer"
                                                @click="openImageModal(message.attachments?.[0]?.url)"
                                            />
                                        </div>
                                        <p v-if="message.content" class="text-sm">{{ message.content }}</p>
                                    </div>

                                    <!-- Anexo -->
                                    <div v-else-if="message.messageType === 'FILE'">
                                        <div class="flex items-center gap-2 p-2 bg-white/10 rounded">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                            </svg>
                                            <div class="flex-1">
                                                <p class="text-sm font-medium">{{ message.attachments?.[0]?.name }}</p>
                                                <p class="text-xs opacity-75">{{ formatFileSize(message.attachments?.[0]?.size) }}</p>
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

                                    <!-- Timestamp e Status -->
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

                        <!-- Área de Input -->
                        <div class="p-4 border-t">
                            <div class="flex gap-2">
                                <div class="flex-1">
                                    <textarea
                                        v-model="newMessage"
                                        class="form-input resize-none"
                                        placeholder="Digite sua mensagem..."
                                        rows="2"
                                        @keydown.enter.prevent="sendMessage"
                                    ></textarea>
                                </div>
                                <div class="flex flex-col gap-2">
                                    <button
                                        type="button"
                                        class="btn btn-outline-primary btn-sm"
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
                                        @click="sendMessage"
                                        :disabled="!newMessage.trim()"
                                    >
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Estado Vazio -->
                    <div v-else class="panel h-full flex items-center justify-center">
                        <div class="text-center">
                            <svg class="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                            <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">Selecione uma conversa</h3>
                            <p class="text-gray-500 dark:text-gray-400">Escolha uma conversa da lista para começar o atendimento.</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal de Imagem -->
            <div v-if="showImageModal" class="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50" @click="showImageModal = false">
                <div class="max-w-4xl max-h-full p-4">
                    <img :src="selectedImage" alt="Imagem" class="max-w-full max-h-full object-contain" />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from 'vue';
import { Conversation, Message } from '@/services/messages.service';

// Refs
const conversations = ref<Conversation[]>([]);
const selectedConversation = ref<Conversation | null>(null);
const currentMessages = ref<Message[]>([]);
const newMessage = ref('');
const statusFilter = ref('');
const priorityFilter = ref('');
const showImageModal = ref(false);
const selectedImage = ref('');
const messagesContainer = ref<HTMLElement>();

// Dados estáticos para demonstração
const staticConversations: Conversation[] = [
    {
        id: '1',
        clientId: 'client-1',
        clientName: 'Maria Silva',
        clientEmail: 'maria.silva@email.com',
        clientPhone: '(11) 99999-9999',
        subject: 'Problema com pagamento da parcela',
        status: 'OPEN',
        priority: 'HIGH',
        category: 'PAYMENT_ISSUE',
        assignedTo: 'admin-1',
        assignedToName: 'João Admin',
        lastMessageAt: '2024-01-15T10:30:00Z',
        messageCount: 8,
        unreadCount: 2,
        createdAt: '2024-01-15T09:00:00Z',
        updatedAt: '2024-01-15T10:30:00Z'
    },
    {
        id: '2',
        clientId: 'client-2',
        clientName: 'Carlos Santos',
        clientEmail: 'carlos.santos@email.com',
        clientPhone: '(21) 88888-8888',
        subject: 'Solicitação de empréstimo adicional',
        status: 'PENDING',
        priority: 'MEDIUM',
        category: 'LOAN_INQUIRY',
        assignedTo: 'admin-2',
        assignedToName: 'Ana Admin',
        lastMessageAt: '2024-01-15T09:45:00Z',
        messageCount: 5,
        unreadCount: 1,
        createdAt: '2024-01-15T08:30:00Z',
        updatedAt: '2024-01-15T09:45:00Z'
    },
    {
        id: '3',
        clientId: 'client-3',
        clientName: 'Ana Costa',
        clientEmail: 'ana.costa@email.com',
        clientPhone: '(31) 77777-7777',
        subject: 'Erro no aplicativo - não consigo visualizar saldo',
        status: 'OPEN',
        priority: 'URGENT',
        category: 'TECHNICAL_SUPPORT',
        assignedTo: 'admin-1',
        assignedToName: 'João Admin',
        lastMessageAt: '2024-01-15T11:15:00Z',
        messageCount: 12,
        unreadCount: 3,
        createdAt: '2024-01-15T10:00:00Z',
        updatedAt: '2024-01-15T11:15:00Z'
    },
    {
        id: '4',
        clientId: 'client-4',
        clientName: 'Roberto Lima',
        clientEmail: 'roberto.lima@email.com',
        clientPhone: '(41) 66666-6666',
        subject: 'Reclamação sobre taxas de juros',
        status: 'RESOLVED',
        priority: 'MEDIUM',
        category: 'COMPLAINT',
        assignedTo: 'admin-2',
        assignedToName: 'Ana Admin',
        lastMessageAt: '2024-01-14T16:20:00Z',
        messageCount: 6,
        unreadCount: 0,
        createdAt: '2024-01-14T14:00:00Z',
        updatedAt: '2024-01-14T16:20:00Z'
    },
    {
        id: '5',
        clientId: 'client-5',
        clientName: 'Fernanda Oliveira',
        clientEmail: 'fernanda.oliveira@email.com',
        clientPhone: '(51) 55555-5555',
        subject: 'Dúvida sobre prazo de pagamento',
        status: 'CLOSED',
        priority: 'LOW',
        category: 'GENERAL',
        assignedTo: 'admin-1',
        assignedToName: 'João Admin',
        lastMessageAt: '2024-01-13T15:30:00Z',
        messageCount: 4,
        unreadCount: 0,
        createdAt: '2024-01-13T14:00:00Z',
        updatedAt: '2024-01-13T15:30:00Z'
    }
];

const staticMessages: Record<string, Message[]> = {
    '1': [
        {
            id: '1-1',
            conversationId: '1',
            senderId: 'client-1',
            senderName: 'Maria Silva',
            senderType: 'CLIENT',
            content: 'Olá! Estou com problema para fazer o pagamento da minha parcela. O sistema não está aceitando minha senha.',
            messageType: 'TEXT',
            read: true,
            createdAt: '2024-01-15T09:00:00Z',
            updatedAt: '2024-01-15T09:00:00Z'
        },
        {
            id: '1-2',
            conversationId: '1',
            senderId: 'admin-1',
            senderName: 'João Admin',
            senderType: 'ADMIN',
            content: 'Olá Maria! Vou ajudá-la com isso. Pode me informar qual erro específico está aparecendo?',
            messageType: 'TEXT',
            read: true,
            createdAt: '2024-01-15T09:05:00Z',
            updatedAt: '2024-01-15T09:05:00Z'
        },
        {
            id: '1-3',
            conversationId: '1',
            senderId: 'client-1',
            senderName: 'Maria Silva',
            senderType: 'CLIENT',
            content: 'Aparece "Senha incorreta" mas eu tenho certeza que estou digitando corretamente.',
            messageType: 'TEXT',
            read: true,
            createdAt: '2024-01-15T09:10:00Z',
            updatedAt: '2024-01-15T09:10:00Z'
        },
        {
            id: '1-4',
            conversationId: '1',
            senderId: 'admin-1',
            senderName: 'João Admin',
            senderType: 'ADMIN',
            content: 'Vou verificar sua conta. Enquanto isso, pode tentar resetar sua senha através do aplicativo?',
            messageType: 'TEXT',
            read: true,
            createdAt: '2024-01-15T09:15:00Z',
            updatedAt: '2024-01-15T09:15:00Z'
        },
        {
            id: '1-5',
            conversationId: '1',
            senderId: 'client-1',
            senderName: 'Maria Silva',
            senderType: 'CLIENT',
            content: 'Aqui está a captura de tela do erro que está aparecendo.',
            messageType: 'IMAGE',
            attachments: [{
                id: 'att-1',
                name: 'erro-pagamento.png',
                type: 'image/png',
                url: 'https://via.placeholder.com/400x300/ff6b6b/ffffff?text=Erro+de+Pagamento',
                size: 245760,
                uploadedAt: '2024-01-15T10:30:00Z'
            }],
            read: false,
            createdAt: '2024-01-15T10:30:00Z',
            updatedAt: '2024-01-15T10:30:00Z'
        }
    ],
    '2': [
        {
            id: '2-1',
            conversationId: '2',
            senderId: 'client-2',
            senderName: 'Carlos Santos',
            senderType: 'CLIENT',
            content: 'Bom dia! Gostaria de saber se posso solicitar um empréstimo adicional. Já tenho um empréstimo ativo de R$ 5.000.',
            messageType: 'TEXT',
            read: true,
            createdAt: '2024-01-15T08:30:00Z',
            updatedAt: '2024-01-15T08:30:00Z'
        },
        {
            id: '2-2',
            conversationId: '2',
            senderId: 'admin-2',
            senderName: 'Ana Admin',
            senderType: 'ADMIN',
            content: 'Bom dia Carlos! Vou analisar sua solicitação. Pode me informar o valor que gostaria de solicitar?',
            messageType: 'TEXT',
            read: true,
            createdAt: '2024-01-15T08:35:00Z',
            updatedAt: '2024-01-15T08:35:00Z'
        },
        {
            id: '2-3',
            conversationId: '2',
            senderId: 'client-2',
            senderName: 'Carlos Santos',
            senderType: 'CLIENT',
            content: 'Gostaria de R$ 3.000 adicionais. Preciso para uma emergência médica.',
            messageType: 'TEXT',
            read: true,
            createdAt: '2024-01-15T09:00:00Z',
            updatedAt: '2024-01-15T09:00:00Z'
        },
        {
            id: '2-4',
            conversationId: '2',
            senderId: 'admin-2',
            senderName: 'Ana Admin',
            senderType: 'ADMIN',
            content: 'Entendo, Carlos. Vou verificar seu perfil e histórico de pagamentos para avaliar a solicitação.',
            messageType: 'TEXT',
            read: true,
            createdAt: '2024-01-15T09:15:00Z',
            updatedAt: '2024-01-15T09:15:00Z'
        },
        {
            id: '2-5',
            conversationId: '2',
            senderId: 'client-2',
            senderName: 'Carlos Santos',
            senderType: 'CLIENT',
            content: 'Aqui está o comprovante da consulta médica que preciso pagar.',
            messageType: 'FILE',
            attachments: [{
                id: 'att-2',
                name: 'comprovante-medico.pdf',
                type: 'application/pdf',
                url: '#',
                size: 512000,
                uploadedAt: '2024-01-15T09:45:00Z'
            }],
            read: false,
            createdAt: '2024-01-15T09:45:00Z',
            updatedAt: '2024-01-15T09:45:00Z'
        }
    ],
    '3': [
        {
            id: '3-1',
            conversationId: '3',
            senderId: 'client-3',
            senderName: 'Ana Costa',
            senderType: 'CLIENT',
            content: 'URGENTE! O aplicativo não está funcionando. Não consigo ver meu saldo nem fazer pagamentos.',
            messageType: 'TEXT',
            read: true,
            createdAt: '2024-01-15T10:00:00Z',
            updatedAt: '2024-01-15T10:00:00Z'
        },
        {
            id: '3-2',
            conversationId: '3',
            senderId: 'admin-1',
            senderName: 'João Admin',
            senderType: 'ADMIN',
            content: 'Olá Ana! Vou resolver isso imediatamente. Pode me dizer qual versão do app está usando?',
            messageType: 'TEXT',
            read: true,
            createdAt: '2024-01-15T10:05:00Z',
            updatedAt: '2024-01-15T10:05:00Z'
        },
        {
            id: '3-3',
            conversationId: '3',
            senderId: 'client-3',
            senderName: 'Ana Costa',
            senderType: 'CLIENT',
            content: 'Versão 2.1.5. Já tentei desinstalar e reinstalar.',
            messageType: 'TEXT',
            read: true,
            createdAt: '2024-01-15T10:10:00Z',
            updatedAt: '2024-01-15T10:10:00Z'
        },
        {
            id: '3-4',
            conversationId: '3',
            senderId: 'admin-1',
            senderName: 'João Admin',
            senderType: 'ADMIN',
            content: 'Vou verificar se há algum problema no servidor. Enquanto isso, pode tentar acessar pelo site?',
            messageType: 'TEXT',
            read: true,
            createdAt: '2024-01-15T10:15:00Z',
            updatedAt: '2024-01-15T10:15:00Z'
        },
        {
            id: '3-5',
            conversationId: '3',
            senderId: 'client-3',
            senderName: 'Ana Costa',
            senderType: 'CLIENT',
            content: 'O site também não está funcionando! Isso é inaceitável.',
            messageType: 'TEXT',
            read: true,
            createdAt: '2024-01-15T10:20:00Z',
            updatedAt: '2024-01-15T10:20:00Z'
        },
        {
            id: '3-6',
            conversationId: '3',
            senderId: 'admin-1',
            senderName: 'João Admin',
            senderType: 'ADMIN',
            content: 'Ana, identifiquei o problema. Há uma manutenção programada que não foi comunicada adequadamente. O sistema deve voltar em 30 minutos.',
            messageType: 'TEXT',
            read: false,
            createdAt: '2024-01-15T11:00:00Z',
            updatedAt: '2024-01-15T11:00:00Z'
        },
        {
            id: '3-7',
            conversationId: '3',
            senderId: 'client-3',
            senderName: 'Ana Costa',
            senderType: 'CLIENT',
            content: 'E se eu precisar fazer um pagamento urgente?',
            messageType: 'TEXT',
            read: false,
            createdAt: '2024-01-15T11:05:00Z',
            updatedAt: '2024-01-15T11:05:00Z'
        },
        {
            id: '3-8',
            conversationId: '3',
            senderId: 'admin-1',
            senderName: 'João Admin',
            senderType: 'ADMIN',
            content: 'Para emergências, pode ligar para 0800-123-4567. Temos atendimento 24h para situações críticas.',
            messageType: 'TEXT',
            read: false,
            createdAt: '2024-01-15T11:15:00Z',
            updatedAt: '2024-01-15T11:15:00Z'
        }
    ]
};

// Computed
const filteredConversations = computed(() => {
    let filtered = conversations.value;

    if (statusFilter.value) {
        filtered = filtered.filter(c => c.status === statusFilter.value);
    }

    if (priorityFilter.value) {
        filtered = filtered.filter(c => c.priority === priorityFilter.value);
    }

    return filtered.sort((a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime());
});

// Métodos
const loadConversations = () => {
    conversations.value = staticConversations;
};

const selectConversation = (conversation: Conversation) => {
    selectedConversation.value = conversation;
    currentMessages.value = staticMessages[conversation.id] || [];
    nextTick(() => {
        scrollToBottom();
    });
};

const sendMessage = () => {
    if (!newMessage.value.trim() || !selectedConversation.value) return;

    const message: Message = {
        id: `msg-${Date.now()}`,
        conversationId: selectedConversation.value.id,
        senderId: 'admin-1',
        senderName: 'Você',
        senderType: 'ADMIN',
        content: newMessage.value,
        messageType: 'TEXT',
        read: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };

    currentMessages.value.push(message);
    newMessage.value = '';

    // Atualizar conversa
    if (selectedConversation.value) {
        selectedConversation.value.lastMessageAt = message.createdAt;
        selectedConversation.value.messageCount++;
    }

    nextTick(() => {
        scrollToBottom();
    });
};

const attachFile = () => {
    // Implementar upload de arquivo
    console.log('Anexar arquivo');
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
    loadConversations();
};

const updateConversationStatus = () => {
    if (selectedConversation.value) {
        selectedConversation.value.status = 'RESOLVED';
    }
};

// Helpers
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
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor(diff / (1000 * 60));

    if (hours < 1) {
        return `${minutes}min`;
    } else if (hours < 24) {
        return `${hours}h`;
    } else {
        return date.toLocaleDateString('pt-BR');
    }
};

const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
};

// Lifecycle
onMounted(() => {
    loadConversations();
});
</script>
