import { apiService, ApiResponse } from './api';

// Interface para Opção de Parcelamento
export interface LoanInstallmentOption {
    id: string;
    loanProductId: string;
    loanProductName: string;
    interestPeriodId: string;
    interestPeriod: {
        id: string;
        name: string;
        displayName: string;
        daysInPeriod: number;
        isActive: boolean;
        createdAt: string;
    };
    maxInstallments: number;
}

// Interface para criar/atualizar opção de parcelamento
export interface LoanInstallmentOptionCreateUpdate {
    loanProductId: string;
    interestPeriodId: string;
    maxInstallments: number;
}

export class LoanInstallmentOptionService {
    private readonly basePath = '/loan-installment-options';

    // Buscar todas as opções de parcelamento
    async getLoanInstallmentOptions(): Promise<ApiResponse<LoanInstallmentOption[]>> {
        return await apiService.get<LoanInstallmentOption[]>(this.basePath);
    }

    // Buscar opção de parcelamento por ID
    async getLoanInstallmentOptionById(id: string): Promise<ApiResponse<LoanInstallmentOption>> {
        return await apiService.get<LoanInstallmentOption>(`${this.basePath}/${id}`);
    }

    // Buscar opções de parcelamento por produto de empréstimo
    async getLoanInstallmentOptionsByProduct(loanProductId: string): Promise<ApiResponse<LoanInstallmentOption[]>> {
        return await apiService.get<LoanInstallmentOption[]>(`${this.basePath}/loan-product/${loanProductId}`);
    }

    // Criar nova opção de parcelamento
    async createLoanInstallmentOption(data: LoanInstallmentOptionCreateUpdate): Promise<ApiResponse<LoanInstallmentOption>> {
        return await apiService.post<LoanInstallmentOption>(this.basePath, data);
    }

    // Atualizar opção de parcelamento
    async updateLoanInstallmentOption(id: string, data: LoanInstallmentOptionCreateUpdate): Promise<ApiResponse<LoanInstallmentOption>> {
        return await apiService.put<LoanInstallmentOption>(`${this.basePath}/${id}`, data);
    }

    // Deletar opção de parcelamento
    async deleteLoanInstallmentOption(id: string): Promise<ApiResponse<void>> {
        return await apiService.delete<void>(`${this.basePath}/${id}`);
    }

    // Validar dados da opção de parcelamento
    validateLoanInstallmentOption(data: LoanInstallmentOptionCreateUpdate): string[] {
        const errors: string[] = [];

        if (!data.loanProductId?.trim()) {
            errors.push('Produto de empréstimo é obrigatório');
        }

        if (!data.interestPeriodId?.trim()) {
            errors.push('Período de juros é obrigatório');
        }

        if (data.maxInstallments <= 0) {
            errors.push('Número máximo de parcelas deve ser maior que zero');
        }

        if (data.maxInstallments > 120) {
            errors.push('Número máximo de parcelas não pode ser maior que 120');
        }

        return errors;
    }
}

// Instância singleton do serviço
export const loanInstallmentOptionService = new LoanInstallmentOptionService();
export default loanInstallmentOptionService;
