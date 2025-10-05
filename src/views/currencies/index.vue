<template>
    <div>
        <!-- Breadcrumb -->
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <router-link to="/currencies" class="text-primary hover:underline">Gestão de Moedas</router-link>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Lista de Moedas</span>
            </li>
        </ul>

        <div class="pt-5">
            <div class="panel">
                <div class="flex items-center justify-between mb-5">
                    <h5 class="font-semibold text-lg dark:text-white-light">Lista de Moedas</h5>
                    <button
                        @click="openCreateModal"
                        class="btn btn-primary"
                        :disabled="loading"
                    >
                        <svg class="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Adicionar Moeda
                    </button>
                </div>

                <!-- Filtros -->
                <div class="mb-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="form-label">Buscar</label>
                        <input
                            v-model="filters.search"
                            type="text"
                            placeholder="Nome, símbolo ou código..."
                            class="form-input"
                            @input="debouncedSearch"
                        />
                    </div>
                    <div>
                        <label class="form-label">Status</label>
                        <select v-model="filters.isActive" class="form-select" @change="loadCurrencies">
                            <option value="">Todos</option>
                            <option :value="true">Ativas</option>
                            <option :value="false">Inativas</option>
                        </select>
                    </div>
                    <div class="flex items-end">
                        <button
                            @click="resetFilters"
                            class="btn btn-outline-secondary"
                            :disabled="loading"
                        >
                            Limpar Filtros
                        </button>
                    </div>
                </div>

                <!-- Tabela de Moedas -->
                <div class="table-responsive">
                    <table class="table-hover">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Nome</th>
                                <th>Símbolo</th>
                                <th>Status</th>
                                <th>Criado em</th>
                                <th class="text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-if="loading">
                                <tr>
                                    <td colspan="6" class="text-center py-8">
                                        <div class="inline-flex items-center">
                                            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Carregando...
                                        </div>
                                    </td>
                                </tr>
                            </template>
                            <template v-else-if="currencies.length === 0">
                                <tr>
                                    <td colspan="6" class="text-center py-8 text-gray-500">
                                        Nenhuma moeda encontrada
                                    </td>
                                </tr>
                            </template>
                            <template v-else>
                                <tr v-for="currency in currencies" :key="currency.id" class="group">
                                    <td>
                                        <span class="font-semibold">{{ currency.code }}</span>
                                    </td>
                                    <td>{{ currency.name }}</td>
                                    <td>
                                        <span class="font-mono text-lg">{{ currency.symbol }}</span>
                                    </td>
                                    <td>
                                        <span
                                            class="badge"
                                            :class="currency.isActive ? 'badge-outline-success' : 'badge-outline-danger'"
                                        >
                                            {{ currency.isActive ? 'Ativa' : 'Inativa' }}
                                        </span>
                                    </td>
                                    <td>{{ formatDate(currency.createdAt) }}</td>
                                    <td class="text-center">
                                        <div class="flex items-center justify-center space-x-2">
                                            <button
                                                @click="viewCurrency(currency.id)"
                                                class="btn btn-sm btn-outline-primary"
                                                title="Visualizar"
                                            >
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                @click="editCurrency(currency)"
                                                class="btn btn-sm btn-outline-warning"
                                                title="Editar"
                                            >
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                @click="toggleCurrencyStatus(currency)"
                                                class="btn btn-sm"
                                                :class="currency.isActive ? 'btn-outline-danger' : 'btn-outline-success'"
                                                :title="currency.isActive ? 'Desativar' : 'Ativar'"
                                            >
                                                <svg v-if="currency.isActive" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"></path>
                                                </svg>
                                                <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                                </svg>
                                            </button>
                                            <button
                                                @click="deleteCurrency(currency)"
                                                class="btn btn-sm btn-outline-danger"
                                                title="Excluir"
                                            >
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>

                <!-- Paginação -->
                <div v-if="!loading && currencies.length > 0" class="flex items-center justify-between mt-5">
                    <div class="text-sm text-gray-600">
                        Mostrando {{ currencies.length }} de {{ totalCurrencies }} moedas
                    </div>
                    <div class="flex space-x-2">
                        <button
                            @click="previousPage"
                            :disabled="currentPage === 1 || loading"
                            class="btn btn-sm btn-outline-primary"
                        >
                            Anterior
                        </button>
                        <span class="btn btn-sm btn-outline-secondary">
                            {{ currentPage }} / {{ totalPages }}
                        </span>
                        <button
                            @click="nextPage"
                            :disabled="currentPage === totalPages || loading"
                            class="btn btn-sm btn-outline-primary"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal de Criação/Edição -->
        <CurrencyModal
            v-if="showModal"
            :currency="selectedCurrency"
            :is-edit="isEdit"
            @close="closeModal"
            @saved="handleCurrencySaved"
        />
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useMeta } from '@/composables/use-meta';
import { currencyService, type Currency, type CurrencyFilters } from '@/services/currencies.service';
import CurrencyModal from './CurrencyModal.vue';
import Swal from 'sweetalert2';

const router = useRouter();

// Estado reativo
const currencies = ref<Currency[]>([]);
const loading = ref(false);
const showModal = ref(false);
const selectedCurrency = ref<Currency | null>(null);
const isEdit = ref(false);

// Filtros e paginação
const filters = ref<CurrencyFilters>({
    search: '',
    page: 1,
    limit: 10,
    isActive: undefined
});

const totalCurrencies = ref(0);
const currentPage = ref(1);
const itemsPerPage = 10;

// Computed
const totalPages = computed(() => Math.ceil(totalCurrencies.value / itemsPerPage));

// Métodos
const loadCurrencies = async () => {
    loading.value = true;
    try {
        const response = await currencyService.getCurrencies({
            ...filters.value,
            page: currentPage.value,
            limit: itemsPerPage
        });

        if (response.succeeded && response.data) {
            currencies.value = response.data;
            totalCurrencies.value = response.data.length; // Ajustar conforme API retorna
        }
    } catch (error) {
        console.error('Erro ao carregar moedas:', error);
        Swal.fire({
            title: 'Erro',
            text: 'Erro ao carregar moedas',
            icon: 'error'
        });
    } finally {
        loading.value = false;
    }
};

const debouncedSearch = debounce(() => {
    currentPage.value = 1;
    loadCurrencies();
}, 500);

const resetFilters = () => {
    filters.value = {
        search: '',
        page: 1,
        limit: 10,
        isActive: undefined
    };
    currentPage.value = 1;
    loadCurrencies();
};

const previousPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--;
        loadCurrencies();
    }
};

const nextPage = () => {
    if (currentPage.value < totalPages.value) {
        currentPage.value++;
        loadCurrencies();
    }
};

const openCreateModal = () => {
    selectedCurrency.value = null;
    isEdit.value = false;
    showModal.value = true;
};

const editCurrency = (currency: Currency) => {
    selectedCurrency.value = currency;
    isEdit.value = true;
    showModal.value = true;
};

const viewCurrency = (id: string) => {
    router.push(`/currencies/${id}`);
};

const toggleCurrencyStatus = async (currency: Currency) => {
    const action = currency.isActive ? 'desativar' : 'ativar';
    const result = await Swal.fire({
        title: `Confirmar ${action}`,
        text: `Tem certeza que deseja ${action} a moeda ${currency.name}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sim',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            const response = await currencyService.toggleCurrencyStatus(
                currency,
                !currency.isActive
            );

            if (response.succeeded) {
                Swal.fire({
                    title: 'Sucesso',
                    text: `Moeda ${action}ada com sucesso`,
                    icon: 'success'
                });
                loadCurrencies();
            }
        } catch (error) {
            console.error(`Erro ao ${action} moeda:`, error);
            Swal.fire({
                title: 'Erro',
                text: `Erro ao ${action} moeda`,
                icon: 'error'
            });
        }
    }
};

const deleteCurrency = async (currency: Currency) => {
    const result = await Swal.fire({
        title: 'Confirmar exclusão',
        text: `Tem certeza que deseja excluir a moeda ${currency.name}? Esta ação não pode ser desfeita.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545'
    });

    if (result.isConfirmed) {
        try {
            const response = await currencyService.deleteCurrency(currency.id);

            if (response.succeeded) {
                Swal.fire({
                    title: 'Sucesso',
                    text: 'Moeda excluída com sucesso',
                    icon: 'success'
                });
                loadCurrencies();
            }
        } catch (error) {
            console.error('Erro ao excluir moeda:', error);
            Swal.fire({
                title: 'Erro',
                text: 'Erro ao excluir moeda',
                icon: 'error'
            });
        }
    }
};

const closeModal = () => {
    showModal.value = false;
    selectedCurrency.value = null;
    isEdit.value = false;
};

const handleCurrencySaved = () => {
    closeModal();
    loadCurrencies();
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
};

// Função de debounce
function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void {
    let timeout: number;
    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}

// Lifecycle
onMounted(() => {
    loadCurrencies();
});

useMeta({ title: 'Gestão de Moedas' });
</script>
