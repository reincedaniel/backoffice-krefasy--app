<template>
    <div>
        <!-- Breadcrumb -->
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <router-link to="/loan-products" class="text-primary hover:underline">Produtos de Empréstimo</router-link>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Lista de Produtos</span>
            </li>
        </ul>

        <div class="pt-5">
            <div class="panel">
                <div class="flex items-center justify-between mb-5">
                    <h5 class="font-semibold text-lg dark:text-white-light">Lista de Produtos de Empréstimo</h5>
                    <button
                        @click="openCreateModal"
                        class="btn btn-primary"
                        :disabled="loading"
                    >
                        <svg class="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Adicionar Produto
                    </button>
                </div>

                <!-- Filtros -->
                <div class="mb-5 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label class="form-label">Buscar</label>
                        <input
                            v-model="filters.search"
                            type="text"
                            placeholder="Nome do produto..."
                            class="form-input"
                            @input="debouncedSearch"
                        />
                    </div>
                    <div>
                        <label class="form-label">País</label>
                        <input
                            v-model="filters.country"
                            type="text"
                            placeholder="Ex: BR, PT..."
                            class="form-input"
                            @input="debouncedSearch"
                        />
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

                <!-- Tabela de Produtos -->
                <div class="table-responsive">
                    <table class="table-hover">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>País</th>
                                <th>Moeda</th>
                                <th>Valor Mín.</th>
                                <th>Valor Máx.</th>
                                <th>Taxas de Juros</th>
                                <th>Opções de Parcelamento</th>
                                <th class="text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-if="loading">
                                <tr>
                                    <td colspan="8" class="text-center py-8">
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
                            <template v-else-if="loanProducts.length === 0">
                                <tr>
                                    <td colspan="8" class="text-center py-8 text-gray-500">
                                        Nenhum produto de empréstimo encontrado
                                    </td>
                                </tr>
                            </template>
                            <template v-else>
                                <tr v-for="product in loanProducts" :key="product.id" class="group">
                                    <td>
                                        <div class="font-semibold">{{ product.name }}</div>
                                    </td>
                                    <td>
                                        <span class="badge badge-outline-info">{{ product.country }}</span>
                                    </td>
                                    <td>
                                        <div class="flex items-center space-x-2">
                                            <span class="font-mono text-lg">{{ product.currency.symbol }}</span>
                                            <span class="text-sm">{{ product.currency.code }}</span>
                                        </div>
                                    </td>
                                    <td>
                                        <span class="font-semibold">{{ formatCurrency(product.minAmount, product.currency.symbol) }}</span>
                                    </td>
                                    <td>
                                        <span class="font-semibold">{{ formatCurrency(product.maxAmount, product.currency.symbol) }}</span>
                                    </td>
                                    <td>
                                        <div class="text-sm">
                                            <div v-for="rate in product.interestRates.slice(0, 2)" :key="rate.id" class="flex justify-between">
                                                <span>{{ rate.interestPeriod.displayName }}:</span>
                                                <span class="font-semibold">{{ rate.ratePercent }}%</span>
                                            </div>
                                            <div v-if="product.interestRates.length > 2" class="text-xs text-gray-500">
                                                +{{ product.interestRates.length - 2 }} mais
                                            </div>
                                        </div>
                                    </td>
                                    <td>
                                        <div class="text-sm">
                                            <div v-for="option in product.installmentOptions.slice(0, 2)" :key="option.id" class="flex justify-between">
                                                <span>{{ option.interestPeriod.displayName }}:</span>
                                                <span class="font-semibold">{{ option.maxInstallments }}x</span>
                                            </div>
                                            <div v-if="product.installmentOptions.length > 2" class="text-xs text-gray-500">
                                                +{{ product.installmentOptions.length - 2 }} mais
                                            </div>
                                        </div>
                                    </td>
                                    <td class="text-center">
                                        <div class="flex items-center justify-center space-x-2">
                                            <button
                                                @click="viewProduct(product.id)"
                                                class="btn btn-sm btn-outline-primary"
                                                title="Visualizar"
                                            >
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                @click="editProduct(product)"
                                                class="btn btn-sm btn-outline-warning"
                                                title="Editar"
                                            >
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                @click="deleteProduct(product)"
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
                <div v-if="!loading && loanProducts.length > 0" class="flex items-center justify-between mt-5">
                    <div class="text-sm text-gray-600">
                        Mostrando {{ loanProducts.length }} de {{ totalProducts }} produtos
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
        <LoanProductModal
            v-if="showModal"
            :product="selectedProduct"
            :is-edit="isEdit"
            @close="closeModal"
            @saved="handleProductSaved"
        />
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useMeta } from '@/composables/use-meta';
import { loanProductService, type LoanProduct, type LoanProductFilters } from '@/services/loan-products.service';
import LoanProductModal from './LoanProductModal.vue';
import Swal from 'sweetalert2';

const router = useRouter();

// Estado reativo
const loanProducts = ref<LoanProduct[]>([]);
const loading = ref(false);
const showModal = ref(false);
const selectedProduct = ref<LoanProduct | null>(null);
const isEdit = ref(false);

// Filtros e paginação
const filters = ref<LoanProductFilters>({
    search: '',
    country: '',
    page: 1,
    limit: 10
});

const totalProducts = ref(0);
const currentPage = ref(1);
const itemsPerPage = 10;

// Computed
const totalPages = computed(() => Math.ceil(totalProducts.value / itemsPerPage));

// Métodos
const loadLoanProducts = async () => {
    loading.value = true;
    try {
        const response = await loanProductService.getLoanProducts({
            ...filters.value,
            page: currentPage.value,
            limit: itemsPerPage
        });

        if (response.succeeded && response.data) {
            loanProducts.value = response.data;
            totalProducts.value = response.data.length; // Ajustar conforme API retorna
        }
    } catch (error) {
        console.error('Erro ao carregar produtos de empréstimo:', error);
        Swal.fire({
            title: 'Erro',
            text: 'Erro ao carregar produtos de empréstimo',
            icon: 'error'
        });
    } finally {
        loading.value = false;
    }
};

const debouncedSearch = debounce(() => {
    currentPage.value = 1;
    loadLoanProducts();
}, 500);

const resetFilters = () => {
    filters.value = {
        search: '',
        country: '',
        page: 1,
        limit: 10
    };
    currentPage.value = 1;
    loadLoanProducts();
};

const previousPage = () => {
    if (currentPage.value > 1) {
        currentPage.value--;
        loadLoanProducts();
    }
};

const nextPage = () => {
    if (currentPage.value < totalPages.value) {
        currentPage.value++;
        loadLoanProducts();
    }
};

const openCreateModal = () => {
    selectedProduct.value = null;
    isEdit.value = false;
    showModal.value = true;
};

const editProduct = (product: LoanProduct) => {
    selectedProduct.value = product;
    isEdit.value = true;
    showModal.value = true;
};

const viewProduct = (id: string) => {
    router.push(`/loan-products/${id}`);
};

const deleteProduct = async (product: LoanProduct) => {
    const result = await Swal.fire({
        title: 'Confirmar exclusão',
        text: `Tem certeza que deseja excluir o produto "${product.name}"? Esta ação não pode ser desfeita.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545'
    });

    if (result.isConfirmed) {
        try {
            const response = await loanProductService.deleteLoanProduct(product.id);

            if (response.succeeded) {
                Swal.fire({
                    title: 'Sucesso',
                    text: 'Produto excluído com sucesso',
                    icon: 'success'
                });
                loadLoanProducts();
            }
        } catch (error) {
            console.error('Erro ao excluir produto:', error);
            Swal.fire({
                title: 'Erro',
                text: 'Erro ao excluir produto',
                icon: 'error'
            });
        }
    }
};

const closeModal = () => {
    showModal.value = false;
    selectedProduct.value = null;
    isEdit.value = false;
};

const handleProductSaved = () => {
    closeModal();
    loadLoanProducts();
};

const formatCurrency = (amount: number, symbol: string) => {
    return `${symbol} ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
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
    loadLoanProducts();
});

useMeta({ title: 'Produtos de Empréstimo' });
</script>
