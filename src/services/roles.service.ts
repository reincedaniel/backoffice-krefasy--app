import { apiService, ApiResponse } from './api';

// Interfaces para Role
export interface Role {
    id: string;
    name: string;
    description: string | null;
    success?: boolean;
    message?: string | null;
    normalizedName?: string;
}

export interface RoleCreate {
    name: string;
    description: string;
}

export interface RoleAssign {
    userEmail: string;
    roleName: string;
}

export interface RoleRemove {
    userEmail: string;
    roleName: string;
}

export class RoleService {
    private readonly basePath = '/role';

    // Listar todos os roles
    async getRoles(): Promise<ApiResponse<Role[]>> {
        return await apiService.get<Role[]>(this.basePath);
    }

    // Obter role por ID
    async getRoleById(roleId: string): Promise<ApiResponse<Role>> {
        return await apiService.get<Role>(`${this.basePath}/${roleId}`);
    }

    // Criar novo role
    async createRole(data: RoleCreate): Promise<ApiResponse<Role>> {
        return await apiService.post<Role>(`${this.basePath}/create`, data);
    }

    // Atribuir role a usuário
    async assignRole(data: RoleAssign): Promise<ApiResponse<any>> {
        return await apiService.post<any>(`${this.basePath}/assign`, data);
    }

    // Remover role de usuário
    async removeRole(data: RoleRemove): Promise<ApiResponse<any>> {
        return await apiService.post<any>(`${this.basePath}/remove`, data);
    }
}

export const roleService = new RoleService();
export default roleService;
