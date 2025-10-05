import { apiService, ApiResponse } from './api';

// Interface para País
export interface Country {
    id: string;
    name: string;
    isActive: boolean;
    createdAt: string;
    updatedAt: string | null;
}

// Interface para criar/atualizar país
export interface CountryCreateUpdate {
    name: string;
    isActive: boolean;
}

export class CountryService {
    private readonly basePath = '/countries';

    // Buscar todos os países
    async getCountries(): Promise<ApiResponse<Country[]>> {
        return await apiService.get<Country[]>(this.basePath);
    }

    // Buscar países ativos
    async getActiveCountries(): Promise<ApiResponse<Country[]>> {
        return await apiService.get<Country[]>(`${this.basePath}/active`);
    }

    // Buscar país por ID
    async getCountryById(id: string): Promise<ApiResponse<Country>> {
        return await apiService.get<Country>(`${this.basePath}/${id}`);
    }

    // Criar novo país
    async createCountry(data: CountryCreateUpdate): Promise<ApiResponse<Country>> {
        return await apiService.post<Country>(this.basePath, data);
    }

    // Atualizar país
    async updateCountry(id: string, data: CountryCreateUpdate): Promise<ApiResponse<Country>> {
        return await apiService.put<Country>(`${this.basePath}/${id}`, data);
    }

    // Deletar país
    async deleteCountry(id: string): Promise<ApiResponse<void>> {
        return await apiService.delete<void>(`${this.basePath}/${id}`);
    }

    // Validar dados do país
    validateCountry(data: CountryCreateUpdate): string[] {
        const errors: string[] = [];

        if (!data.name?.trim()) {
            errors.push('Nome é obrigatório');
        }

        return errors;
    }
}

// Instância singleton do serviço
export const countryService = new CountryService();
export default countryService;
