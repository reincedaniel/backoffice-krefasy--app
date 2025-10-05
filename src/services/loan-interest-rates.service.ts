import { apiService, ApiResponse } from './api';

// Interface para Taxa de Juros
export interface LoanInterestRate {
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
    ratePercent: number;
    effectiveFrom: string;
    effectiveTo: string;
}

// Interface para criar/atualizar taxa de juros
export interface LoanInterestRateCreateUpdate {
    loanProductId: string;
    interestPeriodId: string;
    ratePercent: number;
    effectiveFrom: string;
    effectiveTo: string;
}

export class LoanInterestRateService {
    private readonly basePath = '/loan-interest-rates';

    // Buscar todas as taxas de juros
    async getLoanInterestRates(): Promise<ApiResponse<LoanInterestRate[]>> {
        return await apiService.get<LoanInterestRate[]>(this.basePath);
    }

    // Buscar taxa de juros por ID
    async getLoanInterestRateById(id: string): Promise<ApiResponse<LoanInterestRate>> {
        return await apiService.get<LoanInterestRate>(`${this.basePath}/${id}`);
    }

    // Buscar taxas de juros por produto de empréstimo
    async getLoanInterestRatesByProduct(loanProductId: string): Promise<ApiResponse<LoanInterestRate[]>> {
        return await apiService.get<LoanInterestRate[]>(`${this.basePath}/loan-product/${loanProductId}`);
    }

    // Buscar taxa de juros atual por produto e período
    async getCurrentInterestRate(loanProductId: string, interestPeriodId: string): Promise<ApiResponse<LoanInterestRate>> {
        return await apiService.get<LoanInterestRate>(`${this.basePath}/current/${loanProductId}/${interestPeriodId}`);
    }

    // Criar nova taxa de juros
    async createLoanInterestRate(data: LoanInterestRateCreateUpdate): Promise<ApiResponse<LoanInterestRate>> {
        return await apiService.post<LoanInterestRate>(this.basePath, data);
    }

    // Atualizar taxa de juros
    async updateLoanInterestRate(id: string, data: LoanInterestRateCreateUpdate): Promise<ApiResponse<LoanInterestRate>> {
        return await apiService.put<LoanInterestRate>(`${this.basePath}/${id}`, data);
    }

    // Deletar taxa de juros
    async deleteLoanInterestRate(id: string): Promise<ApiResponse<void>> {
        return await apiService.delete<void>(`${this.basePath}/${id}`);
    }

    // Validar dados da taxa de juros
    validateLoanInterestRate(data: LoanInterestRateCreateUpdate): string[] {
        const errors: string[] = [];

        if (!data.loanProductId?.trim()) {
            errors.push('Produto de empréstimo é obrigatório');
        }

        if (!data.interestPeriodId?.trim()) {
            errors.push('Período de juros é obrigatório');
        }

        if (data.ratePercent <= 0) {
            errors.push('Taxa de juros deve ser maior que zero');
        }

        if (data.ratePercent > 100) {
            errors.push('Taxa de juros não pode ser maior que 100%');
        }

        if (!data.effectiveFrom) {
            errors.push('Data de início é obrigatória');
        }

        if (!data.effectiveTo) {
            errors.push('Data de fim é obrigatória');
        }

        if (data.effectiveFrom && data.effectiveTo && new Date(data.effectiveFrom) >= new Date(data.effectiveTo)) {
            errors.push('Data de início deve ser anterior à data de fim');
        }

        return errors;
    }
}

// Instância singleton do serviço
export const loanInterestRateService = new LoanInterestRateService();
export default loanInterestRateService;
