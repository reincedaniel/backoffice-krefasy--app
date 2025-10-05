<template>
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ isEdit ? 'Editar Produto de Empréstimo' : 'Adicionar Produto de Empréstimo' }}
                </h3>
                <button
                    @click="$emit('close')"
                    class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
            </div>

            <form @submit.prevent="saveProduct" class="p-6">
                <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <!-- Nome -->
                    <div class="md:col-span-2">
                        <label class="form-label">
                            Nome do Produto <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.name"
                            type="text"
                            class="form-input"
                            :class="{ 'border-red-500': errors.name }"
                            placeholder="Ex: Crédito Pessoal BR"
                            required
                        />
                        <span v-if="errors.name" class="text-red-500 text-sm">{{ errors.name }}</span>
                    </div>

                    <!-- País -->
                    <div>
                        <label class="form-label">
                            País <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.country"
                            type="text"
                            class="form-input"
                            :class="{ 'border-red-500': errors.country }"
                            placeholder="Ex: BR, PT, US..."
                            maxlength="2"
                            style="text-transform: uppercase;"
                            required
                        />
                        <span v-if="errors.country" class="text-red-500 text-sm">{{ errors.country }}</span>
                        <p class="text-gray-500 text-sm mt-1">Código do país (2 letras)</p>
                    </div>

                    <!-- Moeda -->
                    <div>
                        <label class="form-label">
                            Moeda <span class="text-red-500">*</span>
                        </label>
                        <select
                            v-model="form.currencyId"
                            class="form-select"
                            :class="{ 'border-red-500': errors.currencyId }"
                            required
                        >
                            <option value="">Selecione uma moeda</option>
                            <option v-for="currency in currencies" :key="currency.id" :value="currency.id">
                                {{ currency.symbol }} - {{ currency.name }} ({{ currency.code }})
                            </option>
                        </select>
                        <span v-if="errors.currencyId" class="text-red-500 text-sm">{{ errors.currencyId }}</span>
                    </div>

                    <!-- Valor Mínimo -->
                    <div>
                        <label class="form-label">
                            Valor Mínimo <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model.number="form.minAmount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            class="form-input"
                            :class="{ 'border-red-500': errors.minAmount }"
                            placeholder="0.01"
                            required
                        />
                        <span v-if="errors.minAmount" class="text-red-500 text-sm">{{ errors.minAmount }}</span>
                    </div>

                    <!-- Valor Máximo -->
                    <div>
                        <label class="form-label">
                            Valor Máximo <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model.number="form.maxAmount"
                            type="number"
                            step="0.01"
                            min="0.01"
                            class="form-input"
                            :class="{ 'border-red-500': errors.maxAmount }"
                            placeholder="0.01"
                            required
                        />
                        <span v-if="errors.maxAmount" class="text-red-500 text-sm">{{ errors.maxAmount }}</span>
                    </div>
                </div>

                <!-- Preview -->
                <div v-if="form.name && form.country && form.currencyId && form.minAmount && form.maxAmount" class="mt-6 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <h4 class="font-semibold text-gray-900 dark:text-white mb-3">Preview do Produto:</h4>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-300">Nome:</span>
                                <span class="font-semibold">{{ form.name }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-300">País:</span>
                                <span class="badge badge-outline-info">{{ form.country.toUpperCase() }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-300">Moeda:</span>
                                <span class="font-semibold">{{ selectedCurrency?.symbol }} {{ selectedCurrency?.name }}</span>
                            </div>
                        </div>
                        <div class="space-y-2">
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-300">Valor Mínimo:</span>
                                <span class="font-semibold">{{ formatCurrency(form.minAmount) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-300">Valor Máximo:</span>
                                <span class="font-semibold">{{ formatCurrency(form.maxAmount) }}</span>
                            </div>
                            <div class="flex justify-between">
                                <span class="text-gray-600 dark:text-gray-300">Faixa:</span>
                                <span class="font-semibold text-primary">{{ formatCurrency(form.minAmount) }} - {{ formatCurrency(form.maxAmount) }}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Botões -->
                <div class="flex items-center justify-end space-x-3 mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                        type="button"
                        @click="$emit('close')"
                        class="btn btn-outline-secondary"
                        :disabled="loading"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        class="btn btn-primary"
                        :disabled="loading || !isFormValid"
                    >
                        <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {{ isEdit ? 'Atualizar' : 'Criar' }} Produto
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import { loanProductService, type LoanProduct, type LoanProductCreateUpdate } from '@/services/loan-products.service';
import { currencyService, type Currency } from '@/services/currencies.service';
import Swal from 'sweetalert2';

// Props
interface Props {
    product: LoanProduct | null;
    isEdit: boolean;
}

const props = defineProps<Props>();

// Emits
const emit = defineEmits<{
    close: [];
    saved: [];
}>();

// Estado reativo
const loading = ref(false);
const errors = ref<Record<string, string>>({});
const currencies = ref<Currency[]>([]);

const form = ref<LoanProductCreateUpdate>({
    name: '',
    country: '',
    currencyId: '',
    minAmount: 0,
    maxAmount: 0
});

// Computed
const selectedCurrency = computed(() => {
    return currencies.value.find(c => c.id === form.value.currencyId);
});

const isFormValid = computed(() => {
    return form.value.name.trim() &&
           form.value.country.trim() &&
           form.value.currencyId.trim() &&
           form.value.minAmount > 0 &&
           form.value.maxAmount > 0 &&
           form.value.minAmount < form.value.maxAmount;
});

// Métodos
const resetForm = () => {
    form.value = {
        name: '',
        country: '',
        currencyId: '',
        minAmount: 0,
        maxAmount: 0
    };
    errors.value = {};
};

const loadCurrencies = async () => {
    try {
        const response = await currencyService.getActiveCurrencies();
        if (response.succeeded && response.data) {
            currencies.value = response.data;
        }
    } catch (error) {
        console.error('Erro ao carregar moedas:', error);
    }
};

const validateForm = (): boolean => {
    errors.value = {};

    const validationErrors = loanProductService.validateLoanProduct(form.value);
    if (validationErrors.length > 0) {
        validationErrors.forEach((error, index) => {
            // Mapear erros para campos específicos
            if (error.includes('Nome')) {
                errors.value.name = error;
            } else if (error.includes('País')) {
                errors.value.country = error;
            } else if (error.includes('Moeda')) {
                errors.value.currencyId = error;
            } else if (error.includes('mínimo')) {
                errors.value.minAmount = error;
            } else if (error.includes('máximo')) {
                errors.value.maxAmount = error;
            } else {
                errors.value[`general_${index}`] = error;
            }
        });
        return false;
    }

    return true;
};

const saveProduct = async () => {
    if (!validateForm()) {
        return;
    }

    loading.value = true;
    try {
        const data = {
            ...form.value,
            country: form.value.country.toUpperCase().trim(),
            name: form.value.name.trim()
        };

        let response;
        if (props.isEdit && props.product) {
            response = await loanProductService.updateLoanProduct(props.product.id, data);
        } else {
            response = await loanProductService.createLoanProduct(data);
        }

        if (response.succeeded) {
            Swal.fire({
                title: 'Sucesso',
                text: props.isEdit ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!',
                icon: 'success'
            });
            emit('saved');
        }
    } catch (error: any) {
        console.error('Erro ao salvar produto:', error);

        // Tratar erros específicos da API
        if (error.response?.data?.errors) {
            const apiErrors = error.response.data.errors;
            Object.keys(apiErrors).forEach(key => {
                errors.value[key] = apiErrors[key][0] || 'Erro de validação';
            });
        } else {
            Swal.fire({
                title: 'Erro',
                text: error.message || 'Erro ao salvar produto',
                icon: 'error'
            });
        }
    } finally {
        loading.value = false;
    }
};

const formatCurrency = (amount: number) => {
    const symbol = selectedCurrency.value?.symbol || '';
    return `${symbol} ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
};

// Watchers
watch(() => props.product, (newProduct) => {
    if (newProduct && props.isEdit) {
        form.value = {
            name: newProduct.name,
            country: newProduct.country,
            currencyId: newProduct.currencyId,
            minAmount: newProduct.minAmount,
            maxAmount: newProduct.maxAmount
        };
    } else {
        resetForm();
    }
}, { immediate: true });

watch(() => props.isEdit, () => {
    if (!props.isEdit) {
        resetForm();
    }
});

// Lifecycle
onMounted(() => {
    loadCurrencies();
    if (props.product && props.isEdit) {
        form.value = {
            name: props.product.name,
            country: props.product.country,
            currencyId: props.product.currencyId,
            minAmount: props.product.minAmount,
            maxAmount: props.product.maxAmount
        };
    }
});
</script>
