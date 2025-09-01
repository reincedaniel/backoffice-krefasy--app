import axios from 'axios';
import type { AxiosInstance, AxiosResponse, AxiosError } from 'axios';

// Configuração base da API
const API_BASE_URL = 'https://krafasy-credit-api.mayacode.co/api/v1';

// Interface para resposta padrão da API
export interface ApiResponse<T = any> {
    succeeded: boolean;
    data: T | null;
    message?: string;
    description?: string | null;
    errors?: string[] | null;
}

// Interface para paginação
export interface PaginationParams {
    page: number;
    limit: number;
    search?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

// Interface para filtros comuns
export interface BaseFilters {
    startDate?: string;
    endDate?: string;
    status?: string;
    productType?: string;
}

// Classe base para serviços da API
export class ApiService {
    private api: AxiosInstance;

    constructor() {
        this.api = axios.create({
            baseURL: API_BASE_URL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        // Request interceptor para adicionar token
        this.api.interceptors.request.use(
            (config) => {
                const token = localStorage.getItem('token');
                if (token) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => {
                return Promise.reject(error);
            }
        );

        // Response interceptor para tratamento de erros
        this.api.interceptors.response.use(
            (response: AxiosResponse) => {
                return response;
            },
            (error: AxiosError) => {
                if (error.response?.status === 401) {
                    // Token expirado ou inválido
                    localStorage.removeItem('token');
                    localStorage.removeItem('user_data');
                    window.location.href = '/auth/login';
                }
                return Promise.reject(error);
            }
        );
    }

    // Métodos HTTP genéricos
    async get<T>(url: string, params?: any, config?: any): Promise<ApiResponse<T>> {
        try {
            const response = await this.api.get(url, { params, ...config });
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async post<T>(url: string, data?: any, config?: any): Promise<ApiResponse<T>> {
        try {
            const response = await this.api.post(url, data, config);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async put<T>(url: string, data?: any): Promise<ApiResponse<T>> {
        try {
            const response = await this.api.put(url, data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async delete<T>(url: string): Promise<ApiResponse<T>> {
        try {
            const response = await this.api.delete(url);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    async patch<T>(url: string, data?: any): Promise<ApiResponse<T>> {
        try {
            const response = await this.api.patch(url, data);
            return response.data;
        } catch (error) {
            throw this.handleError(error);
        }
    }

    private handleError(error: any): Error {
        console.error('Erro detalhado da API:', error);

        if (error.response?.data?.message) {
            return new Error(error.response.data.message);
        }
        if (error.response?.data?.description) {
            return new Error(error.response.data.description);
        }
        if (error.response?.data?.error) {
            return new Error(error.response.data.error);
        }
        if (error.response?.status === 400) {
            return new Error('Dados inválidos enviados para a API');
        }
        if (error.response?.status === 404) {
            return new Error('Endpoint não encontrado');
        }
        if (error.response?.status === 500) {
            return new Error('Erro interno do servidor');
        }
        if (error.response?.status === 0) {
            return new Error('Erro de conexão - verifique se a API está online');
        }
        if (error.message) {
            return new Error(error.message);
        }
        return new Error('Erro desconhecido na API');
    }
}

// Instância singleton do serviço
export const apiService = new ApiService();
export default apiService;
