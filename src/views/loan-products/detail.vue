<template>
    <div>
        <!-- Breadcrumb -->
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <router-link to="/loan-products" class="text-primary hover:underline">Produtos de Empréstimo</router-link>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Detalhes do Produto</span>
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
                        <span class="text-lg">Carregando detalhes do produto...</span>
                    </div>
                </div>
            </div>

            <div v-else-if="error" class="panel">
                <div class="text-center py-12">
                    <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    <h3 class="mt-2 text-sm font-medium text-gray-900 dark:text-white">Erro ao carregar produto</h3>
                    <p class="mt-1 text-sm text-gray-500">{{ error }}</p>
                    <div class="mt-6">
                        <button
                            @click="loadProduct"
                            class="btn btn-primary"
                        >
                            Tentar novamente
                        </button>
                        <router-link
                            to="/loan-products"
                            class="btn btn-outline-secondary ml-3"
                        >
                            Voltar para lista
                        </router-link>
                    </div>
                </div>
            </div>

            <div v-else-if="product" class="space-y-5">
                <!-- Header do Produto -->
                <div class="panel">
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-4">
                            <div class="text-4xl font-mono text-primary">{{ product.currency.symbol }}</div>
                            <div>
                                <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                                    {{ product.name }}
                                </h1>
                                <div class="flex items-center space-x-4 mt-2">
                                    <span class="badge badge-outline-info">{{ product.country }}</span>
                                    <span class="text-gray-600 dark:text-gray-300">
                                        {{ product.currency.name }} ({{ product.currency.code }})
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div class="flex items-center space-x-3">
                            <button
                                @click="editProduct"
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

                <!-- Informações Básicas -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <!-- Informações do Produto -->
                    <div class="panel">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                Informações do Produto
                            </h3>
                        </div>
                        <div class="space-y-4">
                            <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                <span class="text-gray-600 dark:text-gray-300">Nome:</span>
                                <span class="font-semibold text-gray-900 dark:text-white">{{ product.name }}</span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                <span class="text-gray-600 dark:text-gray-300">País:</span>
                                <span class="badge badge-outline-info">{{ product.country }}</span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                <span class="text-gray-600 dark:text-gray-300">Moeda:</span>
                                <div class="flex items-center space-x-2">
                                    <span class="font-mono text-lg">{{ product.currency.symbol }}</span>
                                    <span class="font-semibold">{{ product.currency.name }}</span>
                                </div>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                <span class="text-gray-600 dark:text-gray-300">Código da Moeda:</span>
                                <span class="font-semibold text-gray-900 dark:text-white">{{ product.currency.code }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Valores -->
                    <div class="panel">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                                Valores
                            </h3>
                        </div>
                        <div class="space-y-4">
                            <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                <span class="text-gray-600 dark:text-gray-300">Valor Mínimo:</span>
                                <span class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(product.minAmount) }}</span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                <span class="text-gray-600 dark:text-gray-300">Valor Máximo:</span>
                                <span class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(product.maxAmount) }}</span>
                            </div>
                            <div class="flex justify-between items-center py-2 border-b border-gray-200 dark:border-gray-700">
                                <span class="text-gray-600 dark:text-gray-300">Faixa Total:</span>
                                <span class="font-semibold text-primary">{{ formatCurrency(product.maxAmount - product.minAmount) }}</span>
                            </div>
                            <div class="flex justify-between items-center py-2">
                                <span class="text-gray-600 dark:text-gray-300">Multiplicador Máximo:</span>
                                <span class="font-semibold text-gray-900 dark:text-white">{{ (product.maxAmount / product.minAmount).toFixed(1) }}x</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Taxas de Juros -->
                <div class="panel">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                            Taxas de Juros
                        </h3>
                        <span class="badge badge-outline-success">{{ product.interestRates.length }} períodos</span>
                    </div>
                    <div v-if="product.interestRates.length === 0" class="text-center py-8 text-gray-500">
                        Nenhuma taxa de juros configurada
                    </div>
                    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div
                            v-for="rate in product.interestRates"
                            :key="rate.id"
                            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        >
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="font-semibold text-gray-900 dark:text-white">{{ rate.interestPeriod.displayName }}</h4>
                                <span class="text-2xl font-bold text-primary">{{ rate.ratePercent }}%</span>
                            </div>
                            <div class="space-y-1 text-sm text-gray-600 dark:text-gray-300">
                                <div>Período: {{ rate.interestPeriod.daysInPeriod }} dias</div>
                                <div>Válido de: {{ formatDate(rate.effectiveFrom) }}</div>
                                <div>Válido até: {{ formatDate(rate.effectiveTo) }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Opções de Parcelamento -->
                <div class="panel">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                            Opções de Parcelamento
                        </h3>
                        <span class="badge badge-outline-info">{{ product.installmentOptions.length }} opções</span>
                    </div>
                    <div v-if="product.installmentOptions.length === 0" class="text-center py-8 text-gray-500">
                        Nenhuma opção de parcelamento configurada
                    </div>
                    <div v-else class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div
                            v-for="option in product.installmentOptions"
                            :key="option.id"
                            class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                        >
                            <div class="flex items-center justify-between mb-2">
                                <h4 class="font-semibold text-gray-900 dark:text-white">{{ option.interestPeriod.displayName }}</h4>
                                <span class="text-2xl font-bold text-success">{{ option.maxInstallments }}x</span>
                            </div>
                            <div class="text-sm text-gray-600 dark:text-gray-300">
                                Período: {{ option.interestPeriod.daysInPeriod }} dias
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
                                @click="deleteProduct"
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
            <LoanProductModal
                v-if="showEditModal"
                :product="product"
                :is-edit="true"
                @close="closeEditModal"
                @saved="handleProductSaved"
            />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useMeta } from '@/composables/use-meta';
import { loanProductService, type LoanProduct } from '@/services/loan-products.service';
import LoanProductModal from './LoanProductModal.vue';
import Swal from 'sweetalert2';

const route = useRoute();
const router = useRouter();

// Estado reativo
const product = ref<LoanProduct | null>(null);
const loading = ref(false);
const error = ref<string | null>(null);
const showEditModal = ref(false);

// Métodos
const loadProduct = async () => {
    loading.value = true;
    error.value = null;

    try {
        const productId = route.params.id as string;
        const response = await loanProductService.getLoanProductById(productId);

        if (response.succeeded && response.data) {
            product.value = response.data;
        } else {
            error.value = 'Produto não encontrado';
        }
    } catch (err: any) {
        console.error('Erro ao carregar produto:', err);
        error.value = err.message || 'Erro ao carregar produto';
    } finally {
        loading.value = false;
    }
};

const editProduct = () => {
    showEditModal.value = true;
};

const closeEditModal = () => {
    showEditModal.value = false;
};

const handleProductSaved = () => {
    closeEditModal();
    loadProduct();
};

const deleteProduct = async () => {
    if (!product.value) return;

    const result = await Swal.fire({
        title: 'Confirmar exclusão',
        text: `Tem certeza que deseja excluir o produto "${product.value.name}"? Esta ação não pode ser desfeita.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545'
    });

    if (result.isConfirmed) {
        try {
            const response = await loanProductService.deleteLoanProduct(product.value.id);

            if (response.succeeded) {
                Swal.fire({
                    title: 'Sucesso',
                    text: 'Produto excluído com sucesso',
                    icon: 'success'
                }).then(() => {
                    router.push('/loan-products');
                });
            }
        } catch (err: any) {
            console.error('Erro ao excluir produto:', err);
            Swal.fire({
                title: 'Erro',
                text: 'Erro ao excluir produto',
                icon: 'error'
            });
        }
    }
};

const formatCurrency = (amount: number) => {
    if (!product.value) return '';
    const symbol = product.value.currency.symbol;
    return `${symbol} ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
};

// Lifecycle
onMounted(() => {
    loadProduct();
});

useMeta({ title: 'Detalhes do Produto de Empréstimo' });
</script>
