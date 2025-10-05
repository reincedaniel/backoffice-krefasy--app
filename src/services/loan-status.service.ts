import { apiService, ApiResponse } from './api';

// Função utilitária para normalizar respostas da API
const normalizeApiResponse = <T>(response: any): ApiResponse<T> => {
    // Se a resposta já está no formato ApiResponse, retorna como está
    if (response && typeof response === 'object' && 'succeeded' in response) {
        return response;
    }

    // Se a resposta é um array ou objeto direto, envolve em ApiResponse
    return {
        succeeded: true,
        message: null,
        description: null,
        errors: null,
        data: response
    };
};

// Interface para Status de Empréstimo
export interface LoanStatus {
    id: string;
    name: string;
    description: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string | null;
}

// Interface para criar/atualizar status de empréstimo
export interface LoanStatusCreateUpdate {
    name: string;
    description: string;
}

export class LoanStatusService {
    private readonly basePath = '/loan-status';

    // Buscar todos os status de empréstimo
    async getLoanStatuses(): Promise<ApiResponse<LoanStatus[]>> {
        const response = await apiService.get<LoanStatus[]>(this.basePath);
        return normalizeApiResponse<LoanStatus[]>(response);
    }

    // Buscar status de empréstimo por ID
    async getLoanStatusById(id: string): Promise<ApiResponse<LoanStatus>> {
        const response = await apiService.get<LoanStatus>(`${this.basePath}/${id}`);
        return normalizeApiResponse<LoanStatus>(response);
    }

    // Criar novo status de empréstimo
    async createLoanStatus(data: LoanStatusCreateUpdate): Promise<ApiResponse<LoanStatus>> {
        return await apiService.post<LoanStatus>(this.basePath, data);
    }

    // Atualizar status de empréstimo
    async updateLoanStatus(id: string, data: LoanStatusCreateUpdate): Promise<ApiResponse<LoanStatus>> {
        return await apiService.put<LoanStatus>(`${this.basePath}/${id}`, data);
    }

    // Deletar status de empréstimo
    async deleteLoanStatus(id: string): Promise<ApiResponse<void>> {
        return await apiService.delete<void>(`${this.basePath}/${id}`);
    }

    // Validar dados do status de empréstimo
    validateLoanStatus(data: LoanStatusCreateUpdate): string[] {
        const errors: string[] = [];

        if (!data.name?.trim()) {
            errors.push('Nome é obrigatório');
        }

        if (!data.description?.trim()) {
            errors.push('Descrição é obrigatória');
        }

        return errors;
    }
}

// Instância singleton do serviço
export const loanStatusService = new LoanStatusService();
export default loanStatusService;
