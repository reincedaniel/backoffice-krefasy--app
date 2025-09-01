import apiService, { ApiResponse, PaginationParams, BaseFilters } from './api';

// Interfaces para parcelas
export interface Parcel {
    id: string;
    loanId: string;
    loanReference: string;
    clientId: string;
    clientName: string;
    number: number; // número da parcela
    dueDate: string;
    amount: number;
    principalAmount: number;
    interestAmount: number;
    feesAmount: number;
    totalAmount: number;
    paidAmount: number;
    remainingAmount: number;
    status: 'PENDING' | 'PAID' | 'OVERDUE' | 'PARTIALLY_PAID' | 'RENEGOTIATED' | 'WRITTEN_OFF';
    paymentDate?: string;
    paymentMethod?: 'BANK_TRANSFER' | 'CREDIT_CARD' | 'DEBIT_CARD' | 'CASH' | 'PIX';
    lateFees: number;
    daysOverdue: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ParcelFilters extends BaseFilters {
    status?: string;
    loanId?: string;
    clientId?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    overdueOnly?: boolean;
    amountMin?: number;
    amountMax?: number;
}

export interface ParcelPayment {
    id: string;
    parcelId: string;
    amount: number;
    paymentDate: string;
    paymentMethod: string;
    reference?: string;
    notes?: string;
    processedBy: string;
    createdAt: string;
}

export interface CreateParcelRequest {
    loanId: string;
    number: number;
    dueDate: string;
    amount: number;
    principalAmount: number;
    interestAmount: number;
    feesAmount: number;
}

export interface UpdateParcelRequest {
    dueDate?: string;
    amount?: number;
    status?: string;
    notes?: string;
}

export interface ParcelListResponse {
    parcels: Parcel[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ParcelStats {
    totalParcels: number;
    pendingParcels: number;
    paidParcels: number;
    overdueParcels: number;
    totalAmount: number;
    totalPaid: number;
    totalOverdue: number;
    averageDaysOverdue: number;
    collectionRate: number;
}

export interface ParcelRenegotiationRequest {
    newDueDate: string;
    newAmount?: number;
    reason: string;
    notes?: string;
}

export class ParcelsService {
    // Listar parcelas com paginação e filtros
    async getParcels(params: PaginationParams & ParcelFilters): Promise<ParcelListResponse> {
        const response = await apiService.get<ParcelListResponse>('/parcels', params);
        if (!response.data) {
            throw new Error('Dados não encontrados');
        }
        return response.data;
    }

    // Obter parcela por ID
    async getParcelById(id: string): Promise<Parcel> {
        const response = await apiService.get<Parcel>(`/parcels/${id}`);
        if (!response.data) {
            throw new Error('Parcela não encontrada');
        }
        return response.data;
    }

    // Criar nova parcela
    async createParcel(parcelData: CreateParcelRequest): Promise<Parcel> {
        const response = await apiService.post<Parcel>('/parcels', parcelData);
        if (!response.data) {
            throw new Error('Erro ao criar parcela');
        }
        return response.data;
    }

    // Atualizar parcela
    async updateParcel(id: string, parcelData: UpdateParcelRequest): Promise<Parcel> {
        const response = await apiService.put<Parcel>(`/parcels/${id}`, parcelData);
        if (!response.data) {
            throw new Error('Erro ao atualizar parcela');
        }
        return response.data;
    }

    // Registrar pagamento de parcela
    async recordPayment(parcelId: string, paymentData: Omit<ParcelPayment, 'id' | 'parcelId' | 'createdAt'>): Promise<ParcelPayment> {
        const response = await apiService.post<ParcelPayment>(`/parcels/${parcelId}/payments`, paymentData);
        if (!response.data) {
            throw new Error('Erro ao registrar pagamento');
        }
        return response.data;
    }

    // Obter histórico de pagamentos de uma parcela
    async getParcelPayments(parcelId: string): Promise<ParcelPayment[]> {
        const response = await apiService.get<ParcelPayment[]>(`/parcels/${parcelId}/payments`);
        if (!response.data) {
            throw new Error('Histórico de pagamentos não encontrado');
        }
        return response.data;
    }

    // Renegociar parcela
    async renegotiateParcel(parcelId: string, renegotiationData: ParcelRenegotiationRequest): Promise<Parcel> {
        const response = await apiService.post<Parcel>(`/parcels/${parcelId}/renegotiate`, renegotiationData);
        if (!response.data) {
            throw new Error('Erro ao renegociar parcela');
        }
        return response.data;
    }

    // Marcar parcela como quitada
    async markAsPaid(parcelId: string, paymentData: { amount: number; paymentMethod: string; reference?: string }): Promise<Parcel> {
        const response = await apiService.patch<Parcel>(`/parcels/${parcelId}/mark-paid`, paymentData);
        if (!response.data) {
            throw new Error('Erro ao marcar parcela como paga');
        }
        return response.data;
    }

    // Marcar parcela como inadimplente
    async markAsOverdue(parcelId: string, notes?: string): Promise<Parcel> {
        const response = await apiService.patch<Parcel>(`/parcels/${parcelId}/mark-overdue`, { notes });
        if (!response.data) {
            throw new Error('Erro ao marcar parcela como inadimplente');
        }
        return response.data;
    }

    // Obter estatísticas das parcelas
    async getParcelStats(filters?: ParcelFilters): Promise<ParcelStats> {
        const response = await apiService.get<ParcelStats>('/parcels/stats', filters);
        if (!response.data) {
            throw new Error('Estatísticas não encontradas');
        }
        return response.data;
    }

    // Obter parcelas em atraso
    async getOverdueParcels(params?: PaginationParams): Promise<ParcelListResponse> {
        const response = await apiService.get<ParcelListResponse>('/parcels/overdue', params);
        if (!response.data) {
            throw new Error('Dados não encontrados');
        }
        return response.data;
    }

    // Obter parcelas por empréstimo
    async getParcelsByLoan(loanId: string, params?: PaginationParams): Promise<ParcelListResponse> {
        const response = await apiService.get<ParcelListResponse>(`/loans/${loanId}/parcels`, params);
        if (!response.data) {
            throw new Error('Dados não encontrados');
        }
        return response.data;
    }

    // Obter parcelas por cliente
    async getParcelsByClient(clientId: string, params?: PaginationParams): Promise<ParcelListResponse> {
        const response = await apiService.get<ParcelListResponse>(`/clients/${clientId}/parcels`, params);
        if (!response.data) {
            throw new Error('Dados não encontrados');
        }
        return response.data;
    }

    // Obter parcelas vencendo em um período
    async getParcelsDueInPeriod(startDate: string, endDate: string, params?: PaginationParams): Promise<ParcelListResponse> {
        const response = await apiService.get<ParcelListResponse>('/parcels/due-in-period', {
            startDate,
            endDate,
            ...params
        });
        if (!response.data) {
            throw new Error('Dados não encontrados');
        }
        return response.data;
    }

    // Calcular juros de mora
    async calculateLateFees(parcelId: string): Promise<{ lateFees: number; daysOverdue: number }> {
        const response = await apiService.get<{ lateFees: number; daysOverdue: number }>(`/parcels/${parcelId}/calculate-late-fees`);
        if (!response.data) {
            throw new Error('Erro ao calcular juros de mora');
        }
        return response.data;
    }

    // Aplicar juros de mora
    async applyLateFees(parcelId: string): Promise<Parcel> {
        const response = await apiService.post<Parcel>(`/parcels/${parcelId}/apply-late-fees`);
        if (!response.data) {
            throw new Error('Erro ao aplicar juros de mora');
        }
        return response.data;
    }

    // Exportar parcelas para Excel/CSV
    async exportParcels(filters: ParcelFilters, format: 'excel' | 'csv'): Promise<Blob> {
        const response = await apiService.get<Blob>('/parcels/export', {
            ...filters,
            format
        }, {
            responseType: 'blob'
        });
        if (!response.data) {
            throw new Error('Erro ao exportar parcelas');
        }
        return response.data;
    }

    // Gerar relatório de inadimplência
    async generateDefaultReport(filters: ParcelFilters, reportType: 'summary' | 'detailed'): Promise<Blob> {
        const response = await apiService.get<Blob>('/parcels/default-report', {
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

    // Enviar lembretes de pagamento
    async sendPaymentReminders(parcelIds: string[], reminderType: 'SMS' | 'EMAIL' | 'BOTH'): Promise<ApiResponse> {
        const response = await apiService.post('/parcels/send-reminders', {
            parcelIds,
            reminderType
        });
        return response;
    }

    // Obter resumo de cobrança
    async getCollectionSummary(filters?: ParcelFilters): Promise<any> {
        const response = await apiService.get('/parcels/collection-summary', filters);
        return response.data;
    }
}

export const parcelsService = new ParcelsService();
export default parcelsService;
