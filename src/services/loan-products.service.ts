import { apiService, ApiResponse, PaginationParams } from './api';

// Interfaces para Período de Juros
export interface InterestPeriod {
    id: string;
    name: string;
    displayName: string;
    daysInPeriod: number;
    isActive: boolean;
    createdAt: string;
}

// Interface para Taxa de Juros
export interface InterestRate {
    id: string;
    loanProductId: string;
    loanProductName: string;
    interestPeriodId: string;
    interestPeriod: InterestPeriod;
    ratePercent: number;
    effectiveFrom: string;
    effectiveTo: string;
}

// Interface para Opção de Parcelamento
export interface InstallmentOption {
    id: string;
    loanProductId: string;
    loanProductName: string;
    interestPeriodId: string;
    interestPeriod: InterestPeriod;
    maxInstallments: number;
}

// Interface para Moeda (reutilizando da currencies.service.ts)
export interface Currency {
    id: string;
    name: string;
    symbol: string;
    code: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string | null;
}

// Interface principal para Produto de Empréstimo
export interface LoanProduct {
    id: string;
    name: string;
    country: string;
    currencyId: string;
    currency: Currency;
    minAmount: number;
    maxAmount: number;
    interestRates: InterestRate[];
    installmentOptions: InstallmentOption[];
}

// Interface para criar/atualizar produto de empréstimo
export interface LoanProductCreateUpdate {
    name: string;
    country: string;
    currencyId: string;
    minAmount: number;
    maxAmount: number;
}

// Interface para filtros de busca
export interface LoanProductFilters extends PaginationParams {
    search?: string;
    country?: string;
    currencyId?: string;
}

export class LoanProductService {
    private readonly basePath = '/loan-products';

    // Buscar todos os produtos de empréstimo
    async getLoanProducts(filters?: LoanProductFilters): Promise<ApiResponse<LoanProduct[]>> {
        return await apiService.get<LoanProduct[]>(this.basePath, filters);
    }

    // Buscar produtos de empréstimo por país
    async getLoanProductsByCountry(country: string): Promise<ApiResponse<LoanProduct[]>> {
        return await apiService.get<LoanProduct[]>(`${this.basePath}/country/${country}`);
    }

    // Buscar produto de empréstimo por ID
    async getLoanProductById(id: string): Promise<ApiResponse<LoanProduct>> {
        return await apiService.get<LoanProduct>(`${this.basePath}/${id}`);
    }

    // Criar novo produto de empréstimo
    async createLoanProduct(data: LoanProductCreateUpdate): Promise<ApiResponse<LoanProduct>> {
        return await apiService.post<LoanProduct>(this.basePath, data);
    }

    // Atualizar produto de empréstimo
    async updateLoanProduct(id: string, data: LoanProductCreateUpdate): Promise<ApiResponse<LoanProduct>> {
        return await apiService.put<LoanProduct>(`${this.basePath}/${id}`, data);
    }

    // Deletar produto de empréstimo
    async deleteLoanProduct(id: string): Promise<ApiResponse<void>> {
        return await apiService.delete<void>(`${this.basePath}/${id}`);
    }

    // Validar dados do produto
    validateLoanProduct(data: LoanProductCreateUpdate): string[] {
        const errors: string[] = [];

        if (!data.name?.trim()) {
            errors.push('Nome é obrigatório');
        }

        if (!data.country?.trim()) {
            errors.push('País é obrigatório');
        }

        if (!data.currencyId?.trim()) {
            errors.push('Moeda é obrigatória');
        }

        if (data.minAmount <= 0) {
            errors.push('Valor mínimo deve ser maior que zero');
        }

        if (data.maxAmount <= 0) {
            errors.push('Valor máximo deve ser maior que zero');
        }

        if (data.minAmount >= data.maxAmount) {
            errors.push('Valor mínimo deve ser menor que o valor máximo');
        }

        return errors;
    }
}

// Instância singleton do serviço
export const loanProductService = new LoanProductService();
export default loanProductService;
