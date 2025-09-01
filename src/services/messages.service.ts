import apiService, { ApiResponse, PaginationParams, BaseFilters } from './api';

// Interfaces para mensagens
export interface Message {
    id: string;
    conversationId: string;
    senderId: string;
    senderName: string;
    senderType: 'CLIENT' | 'ADMIN' | 'SYSTEM';
    content: string;
    messageType: 'TEXT' | 'IMAGE' | 'FILE' | 'SYSTEM';
    attachments?: MessageAttachment[];
    read: boolean;
    readAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface MessageAttachment {
    id: string;
    name: string;
    type: string;
    url: string;
    size: number;
    uploadedAt: string;
}

export interface Conversation {
    id: string;
    clientId: string;
    clientName: string;
    clientEmail: string;
    clientPhone: string;
    subject: string;
    status: 'OPEN' | 'CLOSED' | 'PENDING' | 'RESOLVED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
    category: 'LOAN_INQUIRY' | 'PAYMENT_ISSUE' | 'TECHNICAL_SUPPORT' | 'COMPLAINT' | 'GENERAL';
    assignedTo?: string;
    assignedToName?: string;
    lastMessageAt: string;
    messageCount: number;
    unreadCount: number;
    createdAt: string;
    updatedAt: string;
}

export interface MessageFilters extends BaseFilters {
    conversationId?: string;
    clientId?: string;
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
    unreadOnly?: boolean;
}

export interface CreateMessageRequest {
    conversationId: string;
    content: string;
    messageType?: 'TEXT' | 'IMAGE' | 'FILE';
    attachments?: File[];
}

export interface CreateConversationRequest {
    clientId: string;
    subject: string;
    category: string;
    priority: string;
    initialMessage: string;
}

export interface UpdateConversationRequest {
    status?: string;
    priority?: string;
    category?: string;
    assignedTo?: string;
    subject?: string;
}

export interface ConversationListResponse {
    conversations: Conversation[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface MessageListResponse {
    messages: Message[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ConversationStats {
    totalConversations: number;
    openConversations: number;
    closedConversations: number;
    pendingConversations: number;
    urgentConversations: number;
    averageResponseTime: number;
    satisfactionRate: number;
}

export class MessagesService {
    // Listar conversas com paginação e filtros
    async getConversations(params: PaginationParams & MessageFilters): Promise<ConversationListResponse> {
        const response = await apiService.get<ConversationListResponse>('/conversations', params);
        if (!response.data) {
            throw new Error('Dados não encontrados');
        }
        return response.data;
    }

    // Obter conversa por ID
    async getConversationById(id: string): Promise<Conversation> {
        const response = await apiService.get<Conversation>(`/conversations/${id}`);
        if (!response.data) {
            throw new Error('Conversa não encontrada');
        }
        return response.data;
    }

    // Criar nova conversa
    async createConversation(conversationData: CreateConversationRequest): Promise<Conversation> {
        const response = await apiService.post<Conversation>('/conversations', conversationData);
        if (!response.data) {
            throw new Error('Erro ao criar conversa');
        }
        return response.data;
    }

    // Atualizar conversa
    async updateConversation(id: string, conversationData: UpdateConversationRequest): Promise<Conversation> {
        const response = await apiService.put<Conversation>(`/conversations/${id}`, conversationData);
        if (!response.data) {
            throw new Error('Erro ao atualizar conversa');
        }
        return response.data;
    }

    // Fechar conversa
    async closeConversation(id: string, reason?: string): Promise<Conversation> {
        const response = await apiService.patch<Conversation>(`/conversations/${id}/close`, { reason });
        if (!response.data) {
            throw new Error('Erro ao fechar conversa');
        }
        return response.data;
    }

    // Reabrir conversa
    async reopenConversation(id: string): Promise<Conversation> {
        const response = await apiService.patch<Conversation>(`/conversations/${id}/reopen`);
        if (!response.data) {
            throw new Error('Erro ao reabrir conversa');
        }
        return response.data;
    }

    // Atribuir conversa a um admin
    async assignConversation(id: string, adminId: string): Promise<Conversation> {
        const response = await apiService.patch<Conversation>(`/conversations/${id}/assign`, { adminId });
        if (!response.data) {
            throw new Error('Erro ao atribuir conversa');
        }
        return response.data;
    }

    // Listar mensagens de uma conversa
    async getMessages(conversationId: string, params?: PaginationParams): Promise<MessageListResponse> {
        const response = await apiService.get<MessageListResponse>(`/conversations/${conversationId}/messages`, params);
        if (!response.data) {
            throw new Error('Mensagens não encontradas');
        }
        return response.data;
    }

    // Enviar mensagem
    async sendMessage(messageData: CreateMessageRequest): Promise<Message> {
        const formData = new FormData();
        formData.append('conversationId', messageData.conversationId);
        formData.append('content', messageData.content);
        formData.append('messageType', messageData.messageType || 'TEXT');

        if (messageData.attachments) {
            messageData.attachments.forEach((attachment, index) => {
                formData.append(`attachments[${index}]`, attachment);
            });
        }

        const response = await apiService.post<Message>('/messages', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        if (!response.data) {
            throw new Error('Erro ao enviar mensagem');
        }
        return response.data;
    }

    // Marcar mensagem como lida
    async markMessageAsRead(messageId: string): Promise<Message> {
        const response = await apiService.patch<Message>(`/messages/${messageId}/read`);
        if (!response.data) {
            throw new Error('Erro ao marcar mensagem como lida');
        }
        return response.data;
    }

    // Marcar todas as mensagens de uma conversa como lidas
    async markConversationAsRead(conversationId: string): Promise<ApiResponse> {
        return await apiService.patch(`/conversations/${conversationId}/mark-read`);
    }

    // Obter estatísticas das conversas
    async getConversationStats(filters?: MessageFilters): Promise<ConversationStats> {
        const response = await apiService.get<ConversationStats>('/conversations/stats', filters);
        if (!response.data) {
            throw new Error('Estatísticas não encontradas');
        }
        return response.data;
    }

    // Obter conversas não atribuídas
    async getUnassignedConversations(params?: PaginationParams): Promise<ConversationListResponse> {
        const response = await apiService.get<ConversationListResponse>('/conversations/unassigned', params);
        if (!response.data) {
            throw new Error('Dados não encontrados');
        }
        return response.data;
    }

    // Obter conversas urgentes
    async getUrgentConversations(params?: PaginationParams): Promise<ConversationListResponse> {
        const response = await apiService.get<ConversationListResponse>('/conversations/urgent', params);
        if (!response.data) {
            throw new Error('Dados não encontrados');
        }
        return response.data;
    }

    // Obter conversas por cliente
    async getConversationsByClient(clientId: string, params?: PaginationParams): Promise<ConversationListResponse> {
        const response = await apiService.get<ConversationListResponse>(`/clients/${clientId}/conversations`, params);
        if (!response.data) {
            throw new Error('Dados não encontrados');
        }
        return response.data;
    }

    // Obter conversas por admin
    async getConversationsByAdmin(adminId: string, params?: PaginationParams): Promise<ConversationListResponse> {
        const response = await apiService.get<ConversationListResponse>(`/admins/${adminId}/conversations`, params);
        if (!response.data) {
            throw new Error('Dados não encontrados');
        }
        return response.data;
    }

    // Buscar mensagens
    async searchMessages(query: string, conversationId?: string, params?: PaginationParams): Promise<MessageListResponse> {
        const response = await apiService.get<MessageListResponse>('/messages/search', {
            query,
            conversationId,
            ...params
        });
        if (!response.data) {
            throw new Error('Resultados da busca não encontrados');
        }
        return response.data;
    }

    // Enviar mensagem em massa
    async sendBulkMessage(conversationIds: string[], messageData: { content: string; messageType?: string }): Promise<ApiResponse> {
        const response = await apiService.post('/messages/bulk', {
            conversationIds,
            ...messageData
        });
        return response;
    }

    // Exportar conversas para Excel/CSV
    async exportConversations(filters: MessageFilters, format: 'excel' | 'csv'): Promise<Blob> {
        const response = await apiService.get<Blob>('/conversations/export', {
            ...filters,
            format
        }, {
            responseType: 'blob'
        });
        if (!response.data) {
            throw new Error('Erro ao exportar conversas');
        }
        return response.data;
    }

    // Exportar mensagens para Excel/CSV
    async exportMessages(conversationId: string, format: 'excel' | 'csv'): Promise<Blob> {
        const response = await apiService.get<Blob>(`/conversations/${conversationId}/messages/export`, {
            format
        }, {
            responseType: 'blob'
        });
        if (!response.data) {
            throw new Error('Erro ao exportar mensagens');
        }
        return response.data;
    }

    // Gerar relatório de atendimento
    async generateSupportReport(filters: MessageFilters, reportType: 'summary' | 'detailed'): Promise<Blob> {
        const response = await apiService.get<Blob>('/conversations/report', {
            ...filters,
            reportType
        }, {
            responseType: 'blob'
        });
        if (!response.data) {
            throw new Error('Erro ao gerar relatório');
        }
        return response.data;
    }

    // Configurar notificações em tempo real
    async setupRealTimeNotifications(): Promise<WebSocket> {
        // Implementar WebSocket para notificações em tempo real
        const token = localStorage.getItem('token');
        const ws = new WebSocket(`wss://krafasy-credit-api.mayacode.co/ws?token=${token}`);

        ws.onopen = () => {
            console.log('WebSocket conectado para notificações');
        };

        ws.onerror = (error) => {
            console.error('Erro no WebSocket:', error);
        };

        return ws;
    }
}

export const messagesService = new MessagesService();
export default messagesService;
