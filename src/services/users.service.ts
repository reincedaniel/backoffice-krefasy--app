import { apiService, ApiResponse } from './api';

// Interfaces para User
export interface User {
    id: string;
    name: string;
    email: string;
    phoneNumber: string;
    roles: string[];
}

export interface UserCreate {
    firstName: string;
    lastName: string;
    email: string;
    phoneNumber: string;
    password: string;
    confirmPassword: string;
    roleId: string;
}

export interface UserListResponse {
    total: number;
    currentPage: number;
    pages: number;
    limit: number;
    data: User[];
}

export interface ResetPasswordRequest {
    userId: string;
}

export class UserService {
    private readonly basePath = '/users';
    private readonly authBasePath = '/auth';

    // Listar todos os usuários
    async getUsers(): Promise<ApiResponse<UserListResponse>> {
        return await apiService.get<UserListResponse>(this.basePath);
    }

    // Criar novo usuário
    async createUser(data: UserCreate): Promise<ApiResponse<any>> {
        return await apiService.post<any>(`${this.authBasePath}/create-user`, data);
    }

    // Resetar senha do usuário
    async resetPassword(data: ResetPasswordRequest): Promise<ApiResponse<any>> {
        return await apiService.post<any>(`${this.basePath}/reset-password`, data);
    }

    // Obter roles disponíveis
    async getAvailableRoles(): Promise<ApiResponse<{ id: string; name: string; normalizedName: string }[]>> {
        return await apiService.get<{ id: string; name: string; normalizedName: string }[]>(`${this.authBasePath}/roles`);
    }

    // Buscar usuários por filtros
    async searchUsers(filters: {
        search?: string;
        role?: string;
    }): Promise<ApiResponse<UserListResponse>> {
        return await apiService.get<UserListResponse>(this.basePath, filters);
    }

    // Verificar se email já existe
    async checkEmailExists(email: string): Promise<boolean> {
        try {
            const response = await apiService.get<{exists: boolean}>(`${this.basePath}/check-email`, {
                email
            });
            return response.data?.exists || false;
        } catch (error) {
            return false;
        }
    }

    // Exportar usuários
    async exportUsers(filters?: any): Promise<Blob> {
        const response = await apiService.get<Blob>(`${this.basePath}/export`, filters, {
            responseType: 'blob'
        });
        return response.data || new Blob();
    }
}

export const userService = new UserService();
export default userService;
