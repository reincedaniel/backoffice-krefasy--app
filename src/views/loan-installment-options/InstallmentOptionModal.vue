<template>
    <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="close"></div>

            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 class="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                {{ isEdit ? 'Editar Opção de Parcelamento' : 'Nova Opção de Parcelamento' }}
                            </h3>
                            <div class="mt-4">
                                <form @submit.prevent="save">
                                    <div class="space-y-4">
                                        <!-- Produto de Empréstimo -->
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700">Produto de Empréstimo *</label>
                                            <select
                                                v-model="form.loanProductId"
                                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                                :class="{ 'border-red-500': errors.loanProductId }"
                                            >
                                                <option value="">Selecione um produto</option>
                                                <option v-for="product in availableProducts" :key="product.id" :value="product.id">
                                                    {{ product.name }}
                                                </option>
                                            </select>
                                            <p v-if="errors.loanProductId" class="mt-1 text-sm text-red-600">{{ errors.loanProductId }}</p>
                                        </div>

                                        <!-- Período de Juros -->
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700">Período de Juros *</label>
                                            <select
                                                v-model="form.interestPeriodId"
                                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                                :class="{ 'border-red-500': errors.interestPeriodId }"
                                            >
                                                <option value="">Selecione um período</option>
                                                <option v-for="period in availablePeriods" :key="period.id" :value="period.id">
                                                    {{ period.displayName }} ({{ period.daysInPeriod }} dias)
                                                </option>
                                            </select>
                                            <p v-if="errors.interestPeriodId" class="mt-1 text-sm text-red-600">{{ errors.interestPeriodId }}</p>
                                        </div>

                                        <!-- Máximo de Parcelas -->
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700">Máximo de Parcelas *</label>
                                            <input
                                                v-model.number="form.maxInstallments"
                                                type="number"
                                                min="1"
                                                max="120"
                                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                                :class="{ 'border-red-500': errors.maxInstallments }"
                                                placeholder="Ex: 12"
                                            />
                                            <p v-if="errors.maxInstallments" class="mt-1 text-sm text-red-600">{{ errors.maxInstallments }}</p>
                                            <p class="mt-1 text-sm text-gray-500">Máximo de 120 parcelas</p>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm"
                        @click="save"
                        :disabled="loading"
                    >
                        {{ loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar') }}
                    </button>
                    <button
                        type="button"
                        class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        @click="close"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue';
import type { LoanInstallmentOption, LoanInstallmentOptionCreateUpdate } from '@/services/loan-installment-options.service';
import { loanInstallmentOptionService } from '@/services/loan-installment-options.service';

// Props
const props = defineProps<{
    show: boolean;
    installmentOption?: LoanInstallmentOption | null;
    isEdit: boolean;
}>();

// Emits
const emit = defineEmits<{
    close: [];
    save: [data: LoanInstallmentOptionCreateUpdate];
}>();

// Refs
const form = ref({
    loanProductId: '',
    interestPeriodId: '',
    maxInstallments: 1
});

const errors = ref<Record<string, string>>({});
const loading = ref(false);
const availableProducts = ref<Array<{id: string, name: string}>>([]);
const availablePeriods = ref<Array<{id: string, displayName: string, daysInPeriod: number}>>([]);

// Métodos
const resetForm = () => {
    form.value = {
        loanProductId: '',
        interestPeriodId: '',
        maxInstallments: 1
    };
    errors.value = {};
};

const validateForm = () => {
    errors.value = {};

    if (!form.value.loanProductId?.trim()) {
        errors.value.loanProductId = 'Produto de empréstimo é obrigatório';
    }

    if (!form.value.interestPeriodId?.trim()) {
        errors.value.interestPeriodId = 'Período de juros é obrigatório';
    }

    if (!form.value.maxInstallments || form.value.maxInstallments <= 0) {
        errors.value.maxInstallments = 'Número máximo de parcelas deve ser maior que zero';
    }

    if (form.value.maxInstallments > 120) {
        errors.value.maxInstallments = 'Número máximo de parcelas não pode ser maior que 120';
    }

    return Object.keys(errors.value).length === 0;
};

const save = () => {
    if (validateForm()) {
        emit('save', { ...form.value });
    }
};

const close = () => {
    emit('close');
};

const loadAvailableData = async () => {
    try {
        // Carregar produtos de empréstimo disponíveis
        const productsResponse = await loanInstallmentOptionService.getLoanInstallmentOptions();
        if (productsResponse.succeeded && productsResponse.data) {
            const products = productsResponse.data.map(option => ({
                id: option.loanProductId,
                name: option.loanProductName
            }));
            availableProducts.value = products.filter((product, index, self) =>
                index === self.findIndex(p => p.id === product.id)
            );
        }

        // Carregar períodos de juros disponíveis
        const periodsResponse = await loanInstallmentOptionService.getLoanInstallmentOptions();
        if (periodsResponse.succeeded && periodsResponse.data) {
            const periods = periodsResponse.data.map(option => ({
                id: option.interestPeriodId,
                displayName: option.interestPeriod.displayName,
                daysInPeriod: option.interestPeriod.daysInPeriod
            }));
            availablePeriods.value = periods.filter((period, index, self) =>
                index === self.findIndex(p => p.id === period.id)
            );
        }
    } catch (error) {
        console.error('Erro ao carregar dados disponíveis:', error);
    }
};

// Watchers
watch(() => props.installmentOption, (newOption) => {
    if (newOption && props.isEdit) {
        form.value = {
            loanProductId: newOption.loanProductId,
            interestPeriodId: newOption.interestPeriodId,
            maxInstallments: newOption.maxInstallments
        };
    } else {
        resetForm();
    }
}, { immediate: true });

watch(() => props.show, (newShow) => {
    if (newShow) {
        resetForm();
        loadAvailableData();
    }
});

// Lifecycle
onMounted(() => {
    loadAvailableData();
});
</script>
