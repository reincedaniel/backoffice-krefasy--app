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

const CONVERSATION_QUERY_KEY_MAP: Record<string, string> = {
    page: 'Page',
    limit: 'Limit',
    status: 'Status',
    priority: 'Priority',
    category: 'Category',
    clientId: 'ClientId',
    assignedTo: 'AssignedTo',
    unreadOnly: 'UnreadOnly',
    startDate: 'StartDate',
    endDate: 'EndDate',
    search: 'Search',
    sortBy: 'SortBy',
    sortOrder: 'SortOrder',
    conversationId: 'ConversationId',
    productType: 'ProductType',
};

function toCamelCaseKey(key: string): string {
    if (!key) return key;
    return key.charAt(0).toLowerCase() + key.slice(1);
}

export function normalizeApiObject<T>(value: unknown): T {
    if (value === null || value === undefined) {
        return value as T;
    }

    if (Array.isArray(value)) {
        return value.map((item) => normalizeApiObject(item)) as T;
    }

    if (typeof value !== 'object') {
        return value as T;
    }

    const result: Record<string, unknown> = {};
    for (const [key, nestedValue] of Object.entries(value as Record<string, unknown>)) {
        result[toCamelCaseKey(key)] = normalizeApiObject(nestedValue);
    }
    return result as T;
}

function toConversationQueryParams(params?: object): Record<string, unknown> {
    if (!params) return {};

    const result: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params)) {
        if (value === undefined || value === null || value === '') continue;
        const apiKey = CONVERSATION_QUERY_KEY_MAP[key] ?? key;
        result[apiKey] = value;
    }
    return result;
}

function toMessageQueryParams(params?: PaginationParams): Record<string, unknown> | undefined {
    if (!params) return undefined;

    const result: Record<string, unknown> = {};
    if (params.page !== undefined) result.page = params.page;
    if (params.limit !== undefined) result.limit = params.limit;
    if (params.search) result.search = params.search;
    if (params.sortBy) result.sortBy = params.sortBy;
    if (params.sortOrder) result.sortOrder = params.sortOrder;
    return Object.keys(result).length ? result : undefined;
}

export class MessagesService {
    // Listar conversas com paginação e filtros
    async getConversations(params: PaginationParams & MessageFilters): Promise<ConversationListResponse> {
        const response = await apiService.get<ConversationListResponse>('/conversations', toConversationQueryParams(params));
        if (!response.data) {
            throw new Error('Dados não encontrados');
        }
        return normalizeApiObject<ConversationListResponse>(response.data);
    }

    // Obter conversa por ID
    async getConversationById(id: string): Promise<Conversation> {
        const response = await apiService.get<Conversation>(`/conversations/${id}`);
        if (!response.data) {
            throw new Error('Conversa não encontrada');
        }
        return normalizeApiObject<Conversation>(response.data);
    }

    // Criar nova conversa
    async createConversation(conversationData: CreateConversationRequest): Promise<Conversation> {
        const response = await apiService.post<Conversation>('/conversations', conversationData);
        if (!response.data) {
            throw new Error('Erro ao criar conversa');
        }
        return normalizeApiObject<Conversation>(response.data);
    }

    // Atualizar conversa
    async updateConversation(id: string, conversationData: UpdateConversationRequest): Promise<Conversation> {
        const response = await apiService.put<Conversation>(`/conversations/${id}`, conversationData);
        if (!response.data) {
            throw new Error('Erro ao atualizar conversa');
        }
        return normalizeApiObject<Conversation>(response.data);
    }

    // Fechar conversa
    async closeConversation(id: string, reason?: string): Promise<Conversation> {
        const response = await apiService.patch<Conversation>(`/conversations/${id}/close`, { reason });
        if (!response.data) {
            throw new Error('Erro ao fechar conversa');
        }
        return normalizeApiObject<Conversation>(response.data);
    }

    // Reabrir conversa
    async reopenConversation(id: string): Promise<Conversation> {
        const response = await apiService.patch<Conversation>(`/conversations/${id}/reopen`);
        if (!response.data) {
            throw new Error('Erro ao reabrir conversa');
        }
        return normalizeApiObject<Conversation>(response.data);
    }

    // Atribuir conversa a um admin
    async assignConversation(id: string, adminId: string): Promise<Conversation> {
        const response = await apiService.patch<Conversation>(`/conversations/${id}/assign`, { adminId });
        if (!response.data) {
            throw new Error('Erro ao atribuir conversa');
        }
        return normalizeApiObject<Conversation>(response.data);
    }

    // Listar mensagens de uma conversa
    async getMessages(conversationId: string, params?: PaginationParams): Promise<MessageListResponse> {
        const response = await apiService.get<MessageListResponse>(
            `/conversations/${conversationId}/messages`,
            toMessageQueryParams(params)
        );
        if (!response.data) {
            throw new Error('Mensagens não encontradas');
        }
        return normalizeApiObject<MessageListResponse>(response.data);
    }

    // Enviar mensagem
    async sendMessage(messageData: CreateMessageRequest): Promise<Message> {
        const formData = new FormData();
        formData.append('ConversationId', messageData.conversationId);
        formData.append('Content', messageData.content);
        formData.append('MessageType', messageData.messageType || 'TEXT');

        if (messageData.attachments) {
            messageData.attachments.forEach((attachment, index) => {
                formData.append(`Attachments[${index}]`, attachment);
            });
        }

        const response = await apiService.post<Message>('/messages', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        if (!response.data) {
            throw new Error('Erro ao enviar mensagem');
        }
        return normalizeApiObject<Message>(response.data);
    }

    // Marcar mensagem como lida
    async markMessageAsRead(messageId: string): Promise<Message> {
        const response = await apiService.patch<Message>(`/messages/${messageId}/read`);
        if (!response.data) {
            throw new Error('Erro ao marcar mensagem como lida');
        }
        return normalizeApiObject<Message>(response.data);
    }

    // Marcar todas as mensagens de uma conversa como lidas
    async markConversationAsRead(conversationId: string): Promise<ApiResponse> {
        return await apiService.patch(`/conversations/${conversationId}/mark-read`);
    }

    // Obter estatísticas das conversas
    async getConversationStats(filters?: MessageFilters): Promise<ConversationStats> {
        const response = await apiService.get<ConversationStats>('/conversations/stats', toConversationQueryParams(filters));
        if (!response.data) {
            throw new Error('Estatísticas não encontradas');
        }
        return normalizeApiObject<ConversationStats>(response.data);
    }

    // Obter conversas não atribuídas
    async getUnassignedConversations(params?: PaginationParams): Promise<ConversationListResponse> {
        const response = await apiService.get<ConversationListResponse>('/conversations/unassigned', toConversationQueryParams(params));
        if (!response.data) {
            throw new Error('Dados não encontrados');
        }
        return normalizeApiObject<ConversationListResponse>(response.data);
    }

    // Obter conversas urgentes
    async getUrgentConversations(params?: PaginationParams): Promise<ConversationListResponse> {
        const response = await apiService.get<ConversationListResponse>('/conversations/urgent', toConversationQueryParams(params));
        if (!response.data) {
            throw new Error('Dados não encontrados');
        }
        return normalizeApiObject<ConversationListResponse>(response.data);
    }

    // Obter conversas por cliente
    async getConversationsByClient(clientId: string, params?: PaginationParams): Promise<ConversationListResponse> {
        const response = await apiService.get<ConversationListResponse>(
            `/clients/${clientId}/conversations`,
            toConversationQueryParams(params)
        );
        if (!response.data) {
            throw new Error('Dados não encontrados');
        }
        return normalizeApiObject<ConversationListResponse>(response.data);
    }

    // Obter conversas por admin
    async getConversationsByAdmin(adminId: string, params?: PaginationParams): Promise<ConversationListResponse> {
        const response = await apiService.get<ConversationListResponse>(
            `/admins/${adminId}/conversations`,
            toConversationQueryParams(params)
        );
        if (!response.data) {
            throw new Error('Dados não encontrados');
        }
        return normalizeApiObject<ConversationListResponse>(response.data);
    }

    // Buscar mensagens
    async searchMessages(query: string, conversationId?: string, params?: PaginationParams): Promise<MessageListResponse> {
        const response = await apiService.get<MessageListResponse>('/messages/search', {
            query,
            conversationId,
            ...toMessageQueryParams(params),
        });
        if (!response.data) {
            throw new Error('Resultados da busca não encontrados');
        }
        return normalizeApiObject<MessageListResponse>(response.data);
    }

    // Enviar mensagem em massa
    async sendBulkMessage(conversationIds: string[], messageData: { content: string; messageType?: string }): Promise<ApiResponse> {
        const response = await apiService.post('/messages/bulk', {
            conversationIds,
            ...messageData,
        });
        return response;
    }

    // Exportar conversas para Excel/CSV
    async exportConversations(filters: MessageFilters, format: 'excel' | 'csv'): Promise<Blob> {
        const response = await apiService.get<Blob>(
            '/conversations/export',
            {
                ...toConversationQueryParams(filters),
                format,
            },
            {
                responseType: 'blob',
            }
        );
        if (!response.data) {
            throw new Error('Erro ao exportar conversas');
        }
        return response.data;
    }

    // Exportar mensagens para Excel/CSV
    async exportMessages(conversationId: string, format: 'excel' | 'csv'): Promise<Blob> {
        const response = await apiService.get<Blob>(
            `/conversations/${conversationId}/messages/export`,
            {
                format,
            },
            {
                responseType: 'blob',
            }
        );
        if (!response.data) {
            throw new Error('Erro ao exportar mensagens');
        }
        return response.data;
    }

    // Gerar relatório de atendimento
    async generateSupportReport(filters: MessageFilters, reportType: 'summary' | 'detailed'): Promise<Blob> {
        const response = await apiService.get<Blob>(
            '/conversations/report',
            {
                ...toConversationQueryParams(filters),
                reportType,
            },
            {
                responseType: 'blob',
            }
        );
        if (!response.data) {
            throw new Error('Erro ao gerar relatório');
        }
        return response.data;
    }

    // Configurar notificações em tempo real
    async setupRealTimeNotifications(): Promise<WebSocket> {
        const raw = localStorage.getItem('USER_LOGIN');
        const data = raw ? JSON.parse(raw) : null;
        const token = data?.token ?? '';
        const wsUrl = import.meta.env.VITE_WEBSOCKET_URL || 'wss://krafasy-credit-api.mayacode.co/ws';
        const ws = new WebSocket(`${wsUrl}?token=${token}`);

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
