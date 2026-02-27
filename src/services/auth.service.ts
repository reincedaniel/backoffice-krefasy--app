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
    userId?: string; // opcional, para compatibilidade com API
}

/** Chave do localStorage onde é guardada a sessão do user logado (response.data do login). */
export const USER_LOGIN_KEY = 'USER_LOGIN';

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
        const data = this.getLoginData();
        if (data?.user) {
            this.currentUser = data.user;
        }
    }

    /** Obtém a sessão do user logado (USER_LOGIN) do localStorage. */
    getLoginData(): LoginResponse | null {
        try {
            const raw = localStorage.getItem(USER_LOGIN_KEY);
            if (!raw) return null;
            return JSON.parse(raw) as LoginResponse;
        } catch {
            return null;
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



                // Guardar sessão do user logado em USER_LOGIN
                localStorage.setItem(USER_LOGIN_KEY, JSON.stringify(loginData));
                this.currentUser = loginData.user;

                return { token: loginData.token, user: loginData.user, roles: loginData.roles };
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
        localStorage.removeItem(USER_LOGIN_KEY);
        this.currentUser = null;

        // Redirecionar para login
        window.location.href = '/auth/login';
    }

    // Verificar se o usuário está autenticado
    isAuthenticated(): boolean {
        const data = this.getLoginData();
        return !!(data?.token && data?.user);
    }

    // Verificar se o usuário tem role específico
    hasRole(role: string): boolean {
        return this.getCurrentUser()?.roles.includes(role) ?? false;
    }

    // Verificar se o usuário tem permissão específica
    hasPermission(permission: string): boolean {
        return this.getCurrentUser()?.permissions.includes(permission) ?? false;
    }

    // Obter usuário atual (a partir de USER_LOGIN)
    getCurrentUser(): UserData | null {
        const data = this.getLoginData();
        if (data?.user) {
            this.currentUser = data.user;
            return data.user;
        }
        this.currentUser = null;
        return null;
    }

    // Atualizar dados do usuário
    updateUserData(userData: UserData): void {
        this.currentUser = userData;
        const data = this.getLoginData();
        if (data) {
            data.user = userData;
            localStorage.setItem(USER_LOGIN_KEY, JSON.stringify(data));
        }
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
