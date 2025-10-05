<template>
    <div>
        <!-- Breadcrumb -->
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <router-link to="/currencies" class="text-primary hover:underline">Gestão de Moedas</router-link>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Detalhes da Moeda</span>
            </li>
        </ul>

        <div class="pt-5">
            <div v-if="loading" class="panel">
                <div class="flex items-center justify-center py-12">
                    <div class="inline-flex items-center">
                        <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <span class="text-lg">Carregando detalhes da moeda...</span>
                    </div>
                </div>
            </div>

            <div v-else-if="error" class="panel">
                <div class="text-center py-12">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Erro ao carregar moeda</h3>
                    <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
                    <div class="mt-6">
                        <button
                            @click="loadCurrency"
                            class="btn btn-primary"
                        >
                            Tentar novamente
                        </button>
                        <router-link
                            to="/currencies"
                            class="btn btn-outline-secondary ml-3"
                        >
                            Voltar para lista
                        </router-link>
                    </div>
                </div>
            </div>

            <div v-else-if="currency" class="space-y-5">
                <!-- Header da Moeda -->
                <div class="panel">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="text-4xl font-mono text-primary">{{ currency.symbol }}</div>
                            <div>
                                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                                    {{ currency.name }}
                                </h1>
                                <p class="text-lg text-gray-600 dark:text-gray-300">
                                    {{ currency.code }}
                                </p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-3">
                            <span
                                class="badge badge-lg"
                                :class="currency.isActive ? 'badge-outline-success' : 'badge-outline-danger'"
                            >
                                {{ currency.isActive ? 'Ativa' : 'Inativa' }}
                            </span>
                            <button
                                @click="editCurrency"
                                class="btn btn-warning"
                                :disabled="loading"
                            >
                                <svg class="w-4 h-4 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                </svg>
                                Editar
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Informações Detalhadas -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <!-- Informações Básicas -->
                    <div class="panel">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                Informações Básicas
                            </h3>
                        </div>
                        <div class="space-y-4">
                            <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                <span class="text-gray-600 dark:text-gray-300">Nome:</span>
                                <span class="font-semibold text-gray-900 dark:text-white">{{ currency.name }}</span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                <span class="text-gray-600 dark:text-gray-300">Símbolo:</span>
                                <span class="font-mono text-lg text-gray-900 dark:text-white">{{ currency.symbol }}</span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                <span class="text-gray-600 dark:text-gray-300">Código:</span>
                                <span class="font-semibold text-gray-900 dark:text-white">{{ currency.code }}</span>
                            </div>
                            <div class="flex justify-between items-center py-2">
                                <span class="text-gray-600 dark:text-gray-300">Status:</span>
                                <span
                                    class="badge"
                                    :class="currency.isActive ? 'badge-outline-success' : 'badge-outline-danger'"
                                >
                                    {{ currency.isActive ? 'Ativa' : 'Inativa' }}
                                </span>
                            </div>
                        </div>
                    </div>

                    <!-- Informações de Sistema -->
                    <div class="panel">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                Informações de Sistema
                            </h3>
                        </div>
                        <div class="space-y-4">
                            <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                <span class="text-gray-600 dark:text-gray-300">ID:</span>
                                <span class="font-mono text-sm text-gray-900 dark:text-white">{{ currency.id }}</span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                <span class="text-gray-600 dark:text-gray-300">Criado em:</span>
                                <span class="text-gray-900 dark:text-white">{{ formatDate(currency.createdAt) }}</span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                <span class="text-gray-600 dark:text-gray-300">Atualizado em:</span>
                                <span class="text-gray-900 dark:text-white">
                                    {{ currency.updatedAt ? formatDate(currency.updatedAt) : 'Nunca' }}
                                </span>
                            </div>
                            <div class="flex justify-between items-center py-2">
                                <span class="text-gray-600 dark:text-gray-300">Última atualização:</span>
                                <span class="text-gray-900 dark:text-white">{{ getTimeAgo(currency.updatedAt || currency.createdAt) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Ações -->
                <div class="panel">
                    <div class="flex items-center justify-between">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                            Ações
                        </h3>
                        <div class="flex space-x-3">
                            <button
                                @click="toggleStatus"
                                class="btn"
                                :class="currency.isActive ? 'btn-outline-danger' : 'btn-outline-success'"
                                :disabled="loading"
                            >
                                <svg class="w-4 h-4 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path v-if="currency.isActive" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"></path>
                                    <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                </svg>
                                {{ currency.isActive ? 'Desativar' : 'Ativar' }}
                            </button>
                            <button
                                @click="deleteCurrency"
                                class="btn btn-outline-danger"
                                :disabled="loading"
                            >
                                <svg class="w-4 h-4 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                </svg>
                                Excluir
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Modal de Edição -->
            <CurrencyModal
                v-if="showEditModal"
                :currency="currency"
                :is-edit="true"
                @close="closeEditModal"
                @saved="handleCurrencySaved"
            />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMeta } from '@/composables/use-meta';
import { currencyService, type Currency } from '@/services/currencies.service';
import CurrencyModal from './CurrencyModal.vue';
import Swal from 'sweetalert2';

const route = useRoute();
const router = useRouter();

// Estado reativo
const currency = ref<Currency | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const showEditModal = ref(false);

// Métodos
const loadCurrency = async () => {
    loading.value = true;
    error.value = null;

    try {
        const currencyId = route.params.id as string;
        const response = await currencyService.getCurrencyById(currencyId);

        if (response.succeeded && response.data) {
            currency.value = response.data;
        } else {
            error.value = 'Moeda não encontrada';
        }
    } catch (err: any) {
        console.error('Erro ao carregar moeda:', err);
        error.value = err.message || 'Erro ao carregar moeda';
    } finally {
        loading.value = false;
    }
};

const editCurrency = () => {
    showEditModal.value = true;
};

const closeEditModal = () => {
    showEditModal.value = false;
};

const handleCurrencySaved = () => {
    closeEditModal();
    loadCurrency();
};

const toggleStatus = async () => {
    if (!currency.value) return;

    const action = currency.value.isActive ? 'desativar' : 'ativar';
    const result = await Swal.fire({
        title: `Confirmar ${action}`,
        text: `Tem certeza que deseja ${action} a moeda ${currency.value.name}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sim',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const response = await currencyService.toggleCurrencyStatus(
                currency.value,
                !currency.value.isActive
            );

            if (response.succeeded && response.data) {
                currency.value = response.data;
                Swal.fire({
                    title: 'Sucesso',
                    text: `Moeda ${action}ada com sucesso`,
                    icon: 'success'
                });
            }
        } catch (err: any) {
            console.error(`Erro ao ${action} moeda:`, err);
            Swal.fire({
                title: 'Erro',
                text: `Erro ao ${action} moeda`,
                icon: 'error'
            });
        }
    }
};

const deleteCurrency = async () => {
    if (!currency.value) return;

    const result = await Swal.fire({
        title: 'Confirmar exclusão',
        text: `Tem certeza que deseja excluir a moeda ${currency.value.name}? Esta ação não pode ser desfeita.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545'
    });

    if (result.isConfirmed) {
        try {
            const response = await currencyService.deleteCurrency(currency.value.id);

            if (response.succeeded) {
                Swal.fire({
                    title: 'Sucesso',
                    text: 'Moeda excluída com sucesso',
                    icon: 'success'
                }).then(() => {
                    router.push('/currencies');
                });
            }
        } catch (err: any) {
            console.error('Erro ao excluir moeda:', err);
            Swal.fire({
                title: 'Erro',
                text: 'Erro ao excluir moeda',
                icon: 'error'
            });
        }
    }
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
};

const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) return 'Agora mesmo';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutos atrás`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} horas atrás`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)} dias atrás`;
    if (diffInSeconds < 31536000) return `${Math.floor(diffInSeconds / 2592000)} meses atrás`;
    return `${Math.floor(diffInSeconds / 31536000)} anos atrás`;
};

// Lifecycle
onMounted(() => {
    loadCurrency();
});

useMeta({ title: 'Detalhes da Moeda' });
</script>
