import { apiService, ApiResponse } from './api';

// Interfaces para Customer baseadas na API fornecida
export interface Customer {
    id: string;
    userId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string | null;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    documentNumber: string;
    documentType: string;
    workAddress: string;
    companyName: string;
    realTimeLocationLatitude: number | null;
    realTimeLocationLongitude: number | null;
    locationTimestamp: string | null;
    referenceName: string;
    referenceRelationship: string;
    referencePhoneNumber: string;
    referenceEmail: string;
    applicantVideoUrl: string;
    instagram: string;
    facebook: string;
    createdAt: string;
    documents: any[];
}

export interface CustomerCreateUpdate {
    fullName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    documentNumber: string;
    documentType: string;
    workAddress: string;
    companyName: string;
    referenceName: string;
    referenceRelationship: string;
    referencePhoneNumber: string;
    referenceEmail: string;
    realTimeLocationLatitude?: number;
    realTimeLocationLongitude?: number;
    locationTimestamp?: string;
}

export class CustomerService {
    private readonly basePath = '/customers';

    // Listar todos os customers
    async getCustomers(): Promise<ApiResponse<Customer[]>> {
        return await apiService.get<Customer[]>(this.basePath);
    }

    // Obter customer por ID
    async getCustomerById(id: string): Promise<ApiResponse<Customer>> {
        return await apiService.get<Customer>(`${this.basePath}/${id}`);
    }

    // Criar novo customer
    async createCustomer(data: CustomerCreateUpdate): Promise<ApiResponse<Customer>> {
        return await apiService.post<Customer>(this.basePath, data);
    }

    // Atualizar customer
    async updateCustomer(id: string, data: CustomerCreateUpdate): Promise<ApiResponse<Customer>> {
        return await apiService.put<Customer>(`${this.basePath}/${id}`, data);
    }

    // Deletar customer
    async deleteCustomer(id: string): Promise<ApiResponse<any>> {
        return await apiService.delete<any>(`${this.basePath}/${id}`);
    }

    // Buscar customers por filtros
    async searchCustomers(filters: {
        fullName?: string;
        email?: string;
        phoneNumber?: string;
        documentNumber?: string;
        city?: string;
        state?: string;
        country?: string;
    }): Promise<ApiResponse<Customer[]>> {
        return await apiService.get<Customer[]>(this.basePath, filters);
    }

    // Verificar se email já existe
    async checkEmailExists(email: string, excludeId?: string): Promise<boolean> {
        try {
            const response = await apiService.get<{exists: boolean}>(`${this.basePath}/check-email`, {
                email,
                excludeId
            });
            return response.data?.exists || false;
        } catch (error) {
            return false;
        }
    }

    // Verificar se documento já existe
    async checkDocumentExists(documentNumber: string, documentType: string, excludeId?: string): Promise<boolean> {
        try {
            const response = await apiService.get<{exists: boolean}>(`${this.basePath}/check-document`, {
                documentNumber,
                documentType,
                excludeId
            });
            return response.data?.exists || false;
        } catch (error) {
            return false;
        }
    }

    // Exportar customers
    async exportCustomers(filters?: any): Promise<Blob> {
        const response = await apiService.get<Blob>(`${this.basePath}/export`, filters, {
            responseType: 'blob'
        });
        return response.data;
    }

    // Importar customers via CSV
    async importCustomers(file: File): Promise<ApiResponse<any>> {
        const formData = new FormData();
        formData.append('file', file);

        return await apiService.post(`${this.basePath}/import`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        });
    }
}

export const customerService = new CustomerService();
export default customerService;
