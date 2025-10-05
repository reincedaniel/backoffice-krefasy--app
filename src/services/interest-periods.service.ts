import { apiService, ApiResponse } from './api';

// Interface para Período de Juros
export interface InterestPeriod {
    id: string;
    name: string;
    displayName: string;
    daysInPeriod: number;
    isActive: boolean;
    createdAt: string;
}

// Interface para criar/atualizar período de juros
export interface InterestPeriodCreateUpdate {
    name: string;
    displayName: string;
    daysInPeriod: number;
    isActive: boolean;
}

export class InterestPeriodService {
    private readonly basePath = '/interest-periods';

    // Buscar todos os períodos de juros
    async getInterestPeriods(): Promise<ApiResponse<InterestPeriod[]>> {
        return await apiService.get<InterestPeriod[]>(this.basePath);
    }

    // Buscar períodos de juros ativos
    async getActiveInterestPeriods(): Promise<ApiResponse<InterestPeriod[]>> {
        return await apiService.get<InterestPeriod[]>(`${this.basePath}/active`);
    }

    // Buscar período de juros por ID
    async getInterestPeriodById(id: string): Promise<ApiResponse<InterestPeriod>> {
        return await apiService.get<InterestPeriod>(`${this.basePath}/${id}`);
    }

    // Criar novo período de juros
    async createInterestPeriod(data: InterestPeriodCreateUpdate): Promise<ApiResponse<InterestPeriod>> {
        return await apiService.post<InterestPeriod>(this.basePath, data);
    }

    // Atualizar período de juros
    async updateInterestPeriod(id: string, data: InterestPeriodCreateUpdate): Promise<ApiResponse<InterestPeriod>> {
        return await apiService.put<InterestPeriod>(`${this.basePath}/${id}`, data);
    }

    // Deletar período de juros
    async deleteInterestPeriod(id: string): Promise<ApiResponse<void>> {
        return await apiService.delete<void>(`${this.basePath}/${id}`);
    }

    // Validar dados do período de juros
    validateInterestPeriod(data: InterestPeriodCreateUpdate): string[] {
        const errors: string[] = [];

        if (!data.name?.trim()) {
            errors.push('Nome é obrigatório');
        }

        if (!data.displayName?.trim()) {
            errors.push('Nome de exibição é obrigatório');
        }

        if (data.daysInPeriod <= 0) {
            errors.push('Número de dias deve ser maior que zero');
        }

        if (data.daysInPeriod > 365) {
            errors.push('Número de dias não pode ser maior que 365');
        }

        return errors;
    }
}

// Instância singleton do serviço
export const interestPeriodService = new InterestPeriodService();
export default interestPeriodService;
