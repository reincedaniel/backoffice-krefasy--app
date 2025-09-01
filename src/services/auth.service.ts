import apiService, { ApiResponse } from './api';

// Interfaces para autenticação
export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    token: string;
    user: UserData;
    roles: string[];
}

// Interface para resposta da API de login
export interface ApiLoginResponse {
    succeeded: boolean;
    data: LoginResponse | null;
    message?: string;
    description?: string | null;
    errors?: string[] | null;
}

export interface UserData {
    id: string;
    email: string;
    name: string;
    roles: string[];
    permissions: string[];
    avatar?: string;
    lastLogin?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
}

export class AuthService {
    private static instance: AuthService;
    private currentUser: UserData | null = null;

    private constructor() {
        // Recuperar usuário do localStorage se existir
        const userData = localStorage.getItem('user_data');
        if (userData) {
            try {
                this.currentUser = JSON.parse(userData);
            } catch (error) {
                console.error('Erro ao parsear dados do usuário:', error);
                localStorage.removeItem('user_data');
            }
        }
    }

    public static getInstance(): AuthService {
        if (!AuthService.instance) {
            AuthService.instance = new AuthService();
        }
        return AuthService.instance;
    }

    // Login do usuário
    async login(credentials: LoginRequest): Promise<LoginResponse> {
        try {
            const response = await apiService.post<LoginResponse>('/auth/login', credentials);
            debugger;
            if (response.succeeded && response.data) {
                // response.data é do tipo LoginResponse (que tem token e user)
                const loginData = response.data;



                if (!loginData.token || !loginData) {
                    throw new Error('Dados de login incompletos');
                }
               /*  if (!loginData.token || !!loginData) {
                    throw new Error('Dados de login incompletos');
                } */
                // loginData.roles.push('Admin');
                // Verificar se o usuário tem role de Admin
                if (!loginData.roles.includes('Admin')) {
                    throw new Error('Acesso negado. Apenas administradores podem acessar o backoffice.');
                }



                // Salvar token e dados do usuário
                localStorage.setItem('token', loginData.token);
                localStorage.setItem('user_data', JSON.stringify(!loginData));

                this.currentUser = !loginData;

                return { token: loginData.token, user: loginData };
            } else {
                throw new Error(response.message || 'Resposta inválida da API');
            }
        } catch (error: any) {
            console.error('Erro detalhado no login:', error);

            if (error.response?.data?.message) {
                throw new Error(error.response.data.message);
            } else if (error.message) {
                throw new Error(error.message);
            } else {
                throw new Error('Erro de conexão com a API');
            }
        }
    }

    // Logout do usuário
    logout(): void {
        localStorage.removeItem('token');
        localStorage.removeItem('user_data');
        this.currentUser = null;

        // Redirecionar para login
        window.location.href = '/auth/login';
    }

    // Verificar se o usuário está autenticado
    isAuthenticated(): boolean {
        const token = localStorage.getItem('token');
        return !!token && !!this.currentUser;
    }

    // Verificar se o usuário tem role específico
    hasRole(role: string): boolean {
        return this.currentUser?.roles.includes(role) || false;
    }

    // Verificar se o usuário tem permissão específica
    hasPermission(permission: string): boolean {
        return this.currentUser?.permissions.includes(permission) || false;
    }

    // Obter usuário atual
    getCurrentUser(): UserData | null {
        return this.currentUser;
    }

    // Atualizar dados do usuário
    updateUserData(userData: UserData): void {
        this.currentUser = userData;
        localStorage.setItem('user_data', JSON.stringify(userData));
    }

    // Alterar senha
    async changePassword(request: ChangePasswordRequest): Promise<ApiResponse> {
        return await apiService.post('/auth/change-password', request);
    }

    // Verificar se o token é válido
    async validateToken(): Promise<boolean> {
        try {
            const response = await apiService.get('/auth/validate');
            return response.succeeded;
        } catch (error) {
            return false;
        }
    }

    // Refresh token
    async refreshToken(): Promise<ApiResponse<{ token: string }>> {
        return await apiService.post('/auth/refresh');
    }
}

export const authService = AuthService.getInstance();
export default authService;
