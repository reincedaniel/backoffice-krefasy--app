import { apiService, ApiResponse } from './api';

export interface PaymentMethodType {
    id: string;
    name: string;
    code: string;
    description: string;
    isActive: boolean;
    createdAt: string;
}

export interface PaymentMethodTypeCreateUpdate {
    name: string;
    code: string;
    description: string;
    isActive: boolean;
}

export interface PaymentMethodTypeUpdate extends PaymentMethodTypeCreateUpdate {
    id: string;
}

export class PaymentMethodTypeService {
    private readonly basePath = '/payment-method-types';

    async getPaymentMethodTypes(): Promise<ApiResponse<PaymentMethodType[]>> {
        return await apiService.get<PaymentMethodType[]>(this.basePath);
    }

    async getActivePaymentMethodTypes(): Promise<ApiResponse<PaymentMethodType[]>> {
        return await apiService.get<PaymentMethodType[]>(`${this.basePath}/active`);
    }

    async getPaymentMethodTypeById(id: string): Promise<ApiResponse<PaymentMethodType>> {
        return await apiService.get<PaymentMethodType>(`${this.basePath}/${id}`);
    }

    async getPaymentMethodTypeByCode(code: string): Promise<ApiResponse<PaymentMethodType>> {
        return await apiService.get<PaymentMethodType>(`${this.basePath}/code/${code}`);
    }

    async createPaymentMethodType(data: PaymentMethodTypeCreateUpdate): Promise<ApiResponse<PaymentMethodType>> {
        return await apiService.post<PaymentMethodType>(this.basePath, data);
    }

    async updatePaymentMethodType(id: string, data: PaymentMethodTypeCreateUpdate): Promise<ApiResponse<PaymentMethodType>> {
        const payload: PaymentMethodTypeUpdate = { id, ...data };
        return await apiService.put<PaymentMethodType>(`${this.basePath}/${id}`, payload);
    }

    async deletePaymentMethodType(id: string): Promise<ApiResponse<void>> {
        return await apiService.delete<void>(`${this.basePath}/${id}`);
    }

    validatePaymentMethodType(data: PaymentMethodTypeCreateUpdate): string[] {
        const errors: string[] = [];

        if (!data.name?.trim()) {
            errors.push('Nome é obrigatório');
        }

        if (!data.code?.trim()) {
            errors.push('Código é obrigatório');
        }

        if (!data.description?.trim()) {
            errors.push('Descrição é obrigatória');
        }

        return errors;
    }
}

export const paymentMethodTypeService = new PaymentMethodTypeService();
export default paymentMethodTypeService;
