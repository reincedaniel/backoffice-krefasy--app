import { apiService, ApiResponse, PaginationParams } from './api';

// Interface para uma moeda
export interface Currency {
    id: string;
    name: string;
    symbol: string;
    code: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string | null;
}

// Interface para criar/atualizar moeda
export interface CurrencyCreateUpdate {
    name: string;
    symbol: string;
    code: string;
    isActive: boolean;
}

// Interface para parâmetros de busca de moedas
export interface CurrencyFilters extends PaginationParams {
    search?: string;
    isActive?: boolean;
}

export class CurrencyService {
    private readonly basePath = '/currencies';

    // Buscar todas as moedas
    async getCurrencies(filters?: CurrencyFilters): Promise<ApiResponse<Currency[]>> {
        return await apiService.get<Currency[]>(this.basePath, filters);
    }

    // Buscar moedas ativas
    async getActiveCurrencies(): Promise<ApiResponse<Currency[]>> {
        return await apiService.get<Currency[]>(`${this.basePath}/active`);
    }

    // Buscar moeda por ID
    async getCurrencyById(id: string): Promise<ApiResponse<Currency>> {
        return await apiService.get<Currency>(`${this.basePath}/${id}`);
    }

    // Buscar moeda por código
    async getCurrencyByCode(code: string): Promise<ApiResponse<Currency>> {
        return await apiService.get<Currency>(`${this.basePath}/code/${code}`);
    }

    // Criar nova moeda
    async createCurrency(data: CurrencyCreateUpdate): Promise<ApiResponse<Currency>> {
        return await apiService.post<Currency>(this.basePath, data);
    }

    // Atualizar moeda
    async updateCurrency(id: string, data: CurrencyCreateUpdate): Promise<ApiResponse<Currency>> {
        return await apiService.put<Currency>(`${this.basePath}/${id}`, data);
    }

    // Deletar moeda
    async deleteCurrency(id: string): Promise<ApiResponse<void>> {
        return await apiService.delete<void>(`${this.basePath}/${id}`);
    }

    // Ativar/desativar moeda
    async toggleCurrencyStatus(currency: Currency, isActive: boolean): Promise<ApiResponse<Currency>> {
        return await this.updateCurrency(currency.id, {
            name: currency.name,
            symbol: currency.symbol,
            code: currency.code,
            isActive
        });
    }
}

// Instância singleton do serviço
export const currencyService = new CurrencyService();
export default currencyService;
