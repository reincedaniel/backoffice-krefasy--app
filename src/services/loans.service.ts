import apiService, { ApiResponse, PaginationParams, BaseFilters } from './api';

// Interfaces para empréstimos
export interface Loan {
    id: string;
    customerEmail: string;
    customerName: string;
    productType: 'PERSONAL' | 'BUSINESS' | 'MORTGAGE' | 'VEHICLE' | 'EDUCATION';
    amount: number;
    interestRate: number;
    term: number; // em meses
    monthlyPayment: number;
    totalAmount: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ACTIVE' | 'COMPLETED' | 'DEFAULTED' | 'RESTRUCTURED';
    purpose: string;
    documents: LoanDocument[];
    creditScore: number;
    riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
    approvedBy?: string;
    approvedAt?: string;
    disbursedAt?: string;
    completedAt?: string;
    createdAt: string;
    updatedAt: string;
}

export interface LoanDocument {
    id: string;
    name: string;
    type: 'IDENTITY' | 'INCOME' | 'BANK_STATEMENT' | 'COLLATERAL' | 'OTHER';
    url: string;
    uploadedAt: string;
    verified: boolean;
}

export interface LoanFilters extends BaseFilters {
    status?: string;
    statusId?: string;
    loanProductId?: string;
    productType?: string;
    riskLevel?: string;
    amountMin?: number;
    amountMax?: number;
    clientId?: string;
    customerId?: string;
    sortBy?: string;
    sortDesc?: boolean;
}

export interface CreateLoanRequest {
    clientId: string;
    productType: string;
    amount: number;
    interestRate: number;
    term: number;
    purpose: string;
    documents: File[];
}

export interface UpdateLoanRequest {
    status?: string;
    interestRate?: number;
    term?: number;
    purpose?: string;
}

export interface LoanApprovalRequest {
    approved: boolean;
    reason?: string;
    conditions?: string[];
    modifiedAmount?: number;
    modifiedInterestRate?: number;
    modifiedTerm?: number;
}

export interface LoanListResponse {
    loans: Loan[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface LoanStats {
    totalLoans: number;
    activeLoans: number;
    pendingLoans: number;
    completedLoans: number;
    defaultedLoans: number;
    totalAmount: number;
    totalRepaid: number;
    totalOutstanding: number;
    averageInterestRate: number;
    averageTerm: number;
}

export class LoansService {
    // Listar empréstimos com paginação e filtros
    async getLoans(params: PaginationParams & LoanFilters): Promise<LoanListResponse> {
        const response = await apiService.get<any>('/loans', params);

        if (!response.data || !response.data.data) {
            throw new Error('Dados não encontrados');
        }

        // A API retorna { succeeded, message, description, errors, data: { total, currentPage, pages, limit, data } }
        const apiData = response.data;

        return {
            loans: apiData.data || [],
            total: apiData.total || 0,
            page: apiData.currentPage || 1,
            limit: apiData.limit || 10,
            totalPages: apiData.pages || 0
        };
    }

    // Obter empréstimo por ID
    async getLoanById(id: string): Promise<Loan> {
        const response = await apiService.get<Loan>(`/loans/${id}`);
        if (!response.data) {
            throw new Error('Empréstimo não encontrado');
        }
        return response.data;
    }

    // Criar novo empréstimo
    async createLoan(loanData: CreateLoanRequest): Promise<Loan> {
        const formData = new FormData();
        formData.append('clientId', loanData.clientId);
        formData.append('productType', loanData.productType);
        formData.append('amount', loanData.amount.toString());
        formData.append('interestRate', loanData.interestRate.toString());
        formData.append('term', loanData.term.toString());
        formData.append('purpose', loanData.purpose);

        loanData.documents.forEach((doc, index) => {
            formData.append(`documents[${index}]`, doc);
        });

        const response = await apiService.post<Loan>('/loans', formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        if (!response.data) {
            throw new Error('Erro ao criar empréstimo');
        }
        return response.data;
    }

    // Atualizar empréstimo
    async updateLoan(id: string, loanData: UpdateLoanRequest): Promise<Loan> {
        const response = await apiService.put<Loan>(`/loans/${id}`, loanData);
        if (!response.data) {
            throw new Error('Erro ao atualizar empréstimo');
        }
        return response.data;
    }

    // Aprovar/Rejeitar empréstimo
    async approveLoan(id: string, approvalData: LoanApprovalRequest): Promise<Loan> {
        const response = await apiService.post<Loan>(`/loans/${id}/approve`, approvalData);
        if (!response.data) {
            throw new Error('Erro ao aprovar empréstimo');
        }
        return response.data;
    }

    // Aprovar empréstimo com Stripe
    async approveWithStripe(id: string, stripeAccountId: string): Promise<Loan> {
        const response = await apiService.post<Loan>(`/loans/${id}/approve-with-stripe`, {
            stripeAccountId
        });
        if (!response.data) {
            throw new Error('Erro ao aprovar empréstimo com Stripe');
        }
        return response.data;
    }

    // Disbursar empréstimo (transferir dinheiro)
    async disburseLoan(id: string, disbursementData: { accountNumber: string; bankCode: string }): Promise<Loan> {
        const response = await apiService.post<Loan>(`/loans/${id}/disburse`, disbursementData);
        if (!response.data) {
            throw new Error('Erro ao disbursar empréstimo');
        }
        return response.data;
    }

    // Marcar empréstimo como liquidado
    async markAsCompleted(id: string): Promise<Loan> {
        const response = await apiService.patch<Loan>(`/loans/${id}/complete`);
        if (!response.data) {
            throw new Error('Erro ao marcar empréstimo como liquidado');
        }
        return response.data;
    }

    // Reestruturar empréstimo
    async restructureLoan(id: string, restructureData: { newTerm: number; newInterestRate: number; reason: string }): Promise<Loan> {
        const response = await apiService.post<Loan>(`/loans/${id}/restructure`, restructureData);
        if (!response.data) {
            throw new Error('Erro ao reestruturar empréstimo');
        }
        return response.data;
    }

    // Obter estatísticas dos empréstimos
    async getLoanStats(filters?: LoanFilters): Promise<LoanStats> {
        const response = await apiService.get<LoanStats>('/loans/stats', filters);
        if (!response.data) {
            throw new Error('Estatísticas não encontradas');
        }
        return response.data;
    }

    // Obter empréstimos pendentes de aprovação
    async getPendingLoans(params?: PaginationParams): Promise<LoanListResponse> {
        const response = await apiService.get<LoanListResponse>('/loans/pending', params);
        if (!response.data) {
            throw new Error('Dados não encontrados');
        }
        return response.data;
    }

    // Obter empréstimos em atraso
    async getOverdueLoans(params?: PaginationParams): Promise<LoanListResponse> {
        const response = await apiService.get<LoanListResponse>('/loans/overdue', params);
        if (!response.data) {
            throw new Error('Dados não encontrados');
        }
        return response.data;
    }

    // Obter empréstimos por cliente
    async getLoansByClient(clientId: string, params?: PaginationParams): Promise<LoanListResponse> {
        const response = await apiService.get<LoanListResponse>(`/clients/${clientId}/loans`, params);
        if (!response.data) {
            throw new Error('Dados não encontrados');
        }
        return response.data;
    }

    // Calcular simulação de empréstimo
    async calculateLoanSimulation(simulationData: { amount: number; term: number; interestRate: number }): Promise<any> {
        const response = await apiService.post('/loans/simulate', simulationData);
        return response.data;
    }

    // Exportar empréstimos para Excel/CSV
    async exportLoans(filters: LoanFilters, format: 'excel' | 'csv'): Promise<Blob> {
        const response = await apiService.get<Blob>('/loans/export', {
            ...filters,
            format
        }, {
            responseType: 'blob'
        });
        if (!response.data) {
            throw new Error('Erro ao exportar empréstimos');
        }
        return response.data;
    }

    // Upload de documentos
    async uploadDocument(loanId: string, document: File, type: string): Promise<LoanDocument> {
        const formData = new FormData();
        formData.append('document', document);
        formData.append('type', type);

        const response = await apiService.post<LoanDocument>(`/loans/${loanId}/documents`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        if (!response.data) {
            throw new Error('Erro ao fazer upload do documento');
        }
        return response.data;
    }

    // Verificar documento
    async verifyDocument(loanId: string, documentId: string, verified: boolean, notes?: string): Promise<LoanDocument> {
        const response = await apiService.patch<LoanDocument>(`/loans/${loanId}/documents/${documentId}/verify`, {
            verified,
            notes
        });
        if (!response.data) {
            throw new Error('Erro ao verificar documento');
        }
        return response.data;
    }

    // Obter documento do empréstimo
    async getLoanDocument(loanId: string, documentId: string): Promise<LoanDocument> {
        const response = await apiService.get<LoanDocument>(`/loans/${loanId}/documents/${documentId}`);
        if (!response.data) {
            throw new Error('Documento não encontrado');
        }
        return response.data;
    }

    // Obter status dos empréstimos
    async getLoanStatuses(): Promise<any[]> {
        try {
            const response = await apiService.get<any[]>('/loan-status');
            console.log('Resposta da API loan-status:', response); // Para debug

            // Se a resposta seguir o padrão ApiResponse
            if (response && typeof response === 'object' && 'succeeded' in response) {
                if (!response.succeeded || !response.data) {
                    throw new Error('Status não encontrados');
                }
                return response.data;
            }

            // Se a resposta for diretamente o array (não seguindo o padrão ApiResponse)
            if (Array.isArray(response)) {
                return response;
            }

            // Se response.data é o array (caso alternativo)
            if (response && typeof response === 'object' && 'data' in response && Array.isArray((response as any).data)) {
                return (response as any).data;
            }

            throw new Error('Formato de resposta não reconhecido');
        } catch (error: any) {
            console.error('Erro detalhado ao buscar status:', error);
            throw new Error(error.message || 'Erro ao buscar status dos empréstimos');
        }
    }

    // Upload de documento para empréstimo
    async uploadLoanDocument(loanId: string, file: File, documentType: string): Promise<LoanDocument> {
        const formData = new FormData();
        formData.append('file', file);
        formData.append('documentType', documentType);

        const response = await apiService.post<LoanDocument>(`/loans/${loanId}/documents`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
        if (!response.data) {
            throw new Error('Erro ao fazer upload do documento');
        }
        return response.data;
    }
}

export const loansService = new LoansService();
export default loansService;
