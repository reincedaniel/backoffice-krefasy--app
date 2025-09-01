import apiService, { ApiResponse, PaginationParams, BaseFilters } from './api';

// Interfaces para clientes
export interface Client {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    documentNumber: string;
    documentType: 'CPF' | 'CNPJ' | 'RG' | 'PASSAPORTE';
    birthDate: string;
    address: Address;
    status: 'ACTIVE' | 'INACTIVE' | 'BLOCKED' | 'PENDING_VERIFICATION';
    creditScore: number;
    totalLoans: number;
    activeLoans: number;
    totalBorrowed: number;
    totalRepaid: number;
    createdAt: string;
    updatedAt: string;
}

export interface Address {
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
}

export interface ClientFilters extends BaseFilters {
    status?: string;
    documentType?: string;
    creditScoreMin?: number;
    creditScoreMax?: number;
    hasActiveLoans?: boolean;
}

export interface CreateClientRequest {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    documentNumber: string;
    documentType: 'CPF' | 'CNPJ' | 'RG' | 'PASSAPORTE';
    birthDate: string;
    address: Address;
}

export interface UpdateClientRequest extends Partial<CreateClientRequest> {
    status?: string;
}

export interface ClientListResponse {
    clients: Client[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export class ClientsService {
    // Listar clientes com paginação e filtros
    async getClients(params: PaginationParams & ClientFilters): Promise<ClientListResponse> {
        const response = await apiService.get<ClientListResponse>('/clients', params);
        if (!response.data) {
            throw new Error('Dados não encontrados');
        }
        return response.data;
    }

    // Obter cliente por ID
    async getClientById(id: string): Promise<Client> {
        const response = await apiService.get<Client>(`/clients/${id}`);
        if (!response.data) {
            throw new Error('Cliente não encontrado');
        }
        return response.data;
    }

    // Criar novo cliente
    async createClient(clientData: CreateClientRequest): Promise<Client> {
        const response = await apiService.post<Client>('/clients', clientData);
        if (!response.data) {
            throw new Error('Erro ao criar cliente');
        }
        return response.data;
    }

    // Atualizar cliente
    async updateClient(id: string, clientData: UpdateClientRequest): Promise<Client> {
        const response = await apiService.put<Client>(`/clients/${id}`, clientData);
        if (!response.data) {
            throw new Error('Erro ao atualizar cliente');
        }
        return response.data;
    }

    // Deletar cliente
    async deleteClient(id: string): Promise<ApiResponse> {
        return await apiService.delete(`/clients/${id}`);
    }

    // Ativar/Desativar cliente
    async toggleClientStatus(id: string, status: 'ACTIVE' | 'INACTIVE'): Promise<Client> {
        const response = await apiService.patch<Client>(`/clients/${id}/status`, { status });
        if (!response.data) {
            throw new Error('Erro ao alterar status do cliente');
        }
        return response.data;
    }

    // Bloquear cliente
    async blockClient(id: string, reason: string): Promise<Client> {
        const response = await apiService.patch<Client>(`/clients/${id}/block`, { reason });
        if (!response.data) {
            throw new Error('Erro ao bloquear cliente');
        }
        return response.data;
    }

    // Obter histórico de empréstimos do cliente
    async getClientLoanHistory(id: string, params?: PaginationParams): Promise<any> {
        const response = await apiService.get(`/clients/${id}/loans`, params);
        return response.data;
    }

    // Obter histórico de mensagens do cliente
    async getClientMessageHistory(id: string, params?: PaginationParams): Promise<any> {
        const response = await apiService.get(`/clients/${id}/messages`, params);
        return response.data;
    }

    // Obter estatísticas do cliente
    async getClientStats(id: string): Promise<any> {
        const response = await apiService.get(`/clients/${id}/stats`);
        return response.data;
    }

    // Verificar se documento já existe
    async checkDocumentExists(documentNumber: string, documentType: string): Promise<boolean> {
        try {
            const response = await apiService.get<{exists: boolean}>('/clients/check-document', {
                documentNumber,
                documentType
            });
            return response.data?.exists || false;
        } catch (error) {
            return false;
        }
    }

    // Exportar clientes para Excel/CSV
    async exportClients(filters: ClientFilters, format: 'excel' | 'csv'): Promise<Blob> {
        const response = await apiService.get<Blob>('/clients/export', {
            ...filters,
            format
        }, {
            responseType: 'blob'
        });
        if (!response.data) {
            throw new Error('Erro ao exportar clientes');
        }
        return response.data;
    }

    // Importar clientes via CSV
    async importClients(file: File): Promise<ApiResponse> {
        const formData = new FormData();
        formData.append('file', file);

        return await apiService.post('/clients/import', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
}

export const clientsService = new ClientsService();
export default clientsService;
