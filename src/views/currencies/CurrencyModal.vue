<template>
    <div class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md mx-4">
            <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-lg font-semibold text-gray-900 dark:text-white">
                    {{ isEdit ? 'Editar Moeda' : 'Adicionar Moeda' }}
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

            <form @submit.prevent="saveCurrency" class="p-6">
                <div class="space-y-4">
                    <!-- Nome -->
                    <div>
                        <label class="form-label">
                            Nome da Moeda <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.name"
                            type="text"
                            class="form-input"
                            :class="{ 'border-red-500': errors.name }"
                            placeholder="Ex: Real Brasileiro"
                            required
                        />
                        <span v-if="errors.name" class="text-red-500 text-sm">{{ errors.name }}</span>
                    </div>

                    <!-- Símbolo -->
                    <div>
                        <label class="form-label">
                            Símbolo <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.symbol"
                            type="text"
                            class="form-input"
                            :class="{ 'border-red-500': errors.symbol }"
                            placeholder="Ex: R$"
                            maxlength="5"
                            required
                        />
                        <span v-if="errors.symbol" class="text-red-500 text-sm">{{ errors.symbol }}</span>
                    </div>

                    <!-- Código -->
                    <div>
                        <label class="form-label">
                            Código <span class="text-red-500">*</span>
                        </label>
                        <input
                            v-model="form.code"
                            type="text"
                            class="form-input"
                            :class="{ 'border-red-500': errors.code }"
                            placeholder="Ex: BRL"
                            maxlength="3"
                            style="text-transform: uppercase;"
                            required
                        />
                        <span v-if="errors.code" class="text-red-500 text-sm">{{ errors.code }}</span>
                        <p class="text-gray-500 text-sm mt-1">Código ISO 4217 (3 letras)</p>
                    </div>

                    <!-- Status -->
                    <div>
                        <label class="flex items-center space-x-2">
                            <input
                                v-model="form.isActive"
                                type="checkbox"
                                class="form-checkbox"
                            />
                            <span class="form-label mb-0">Moeda ativa</span>
                        </label>
                        <p class="text-gray-500 text-sm mt-1">Moedas inativas não aparecerão nas listagens</p>
                    </div>

                    <!-- Preview -->
                    <div v-if="form.name && form.symbol && form.code" class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <h4 class="font-semibold text-gray-900 dark:text-white mb-2">Preview:</h4>
                        <div class="flex items-center space-x-4">
                            <span class="text-2xl font-mono">{{ form.symbol }}</span>
                            <div>
                                <div class="font-semibold">{{ form.name }}</div>
                                <div class="text-sm text-gray-500">{{ form.code }}</div>
                            </div>
                            <span
                                class="badge"
                                :class="form.isActive ? 'badge-outline-success' : 'badge-outline-danger'"
                            >
                                {{ form.isActive ? 'Ativa' : 'Inativa' }}
                            </span>
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
                        {{ isEdit ? 'Atualizar' : 'Criar' }} Moeda
                    </button>
                </div>
            </form>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted } from 'vue';
import { currencyService, type Currency, type CurrencyCreateUpdate } from '@/services/currencies.service';
import Swal from 'sweetalert2';

// Props
interface Props {
    currency: Currency | null;
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

const form = ref<CurrencyCreateUpdate>({
    name: '',
    symbol: '',
    code: '',
    isActive: true
});

// Computed
const isFormValid = computed(() => {
    return form.value.name.trim() &&
           form.value.symbol.trim() &&
           form.value.code.trim() &&
           form.value.code.length === 3;
});

// Métodos
const resetForm = () => {
    form.value = {
        name: '',
        symbol: '',
        code: '',
        isActive: true
    };
    errors.value = {};
};

// Watchers
watch(() => props.currency, (newCurrency) => {
    if (newCurrency && props.isEdit) {
        form.value = {
            name: newCurrency.name,
            symbol: newCurrency.symbol,
            code: newCurrency.code,
            isActive: newCurrency.isActive
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

const validateForm = (): boolean => {
    errors.value = {};

    if (!form.value.name.trim()) {
        errors.value.name = 'Nome é obrigatório';
    }

    if (!form.value.symbol.trim()) {
        errors.value.symbol = 'Símbolo é obrigatório';
    }

    if (!form.value.code.trim()) {
        errors.value.code = 'Código é obrigatório';
    } else if (form.value.code.length !== 3) {
        errors.value.code = 'Código deve ter exatamente 3 caracteres';
    }

    return Object.keys(errors.value).length === 0;
};

const saveCurrency = async () => {
    if (!validateForm()) {
        return;
    }

    loading.value = true;
    try {
        const data = {
            ...form.value,
            code: form.value.code.toUpperCase(),
            name: form.value.name.trim(),
            symbol: form.value.symbol.trim()
        };

        let response;
        if (props.isEdit && props.currency) {
            response = await currencyService.updateCurrency(props.currency.id, data);
        } else {
            response = await currencyService.createCurrency(data);
        }

        if (response.succeeded) {
            Swal.fire({
                title: 'Sucesso',
                text: props.isEdit ? 'Moeda atualizada com sucesso!' : 'Moeda criada com sucesso!',
                icon: 'success'
            });
            emit('saved');
        }
    } catch (error: any) {
        console.error('Erro ao salvar moeda:', error);

        // Tratar erros específicos da API
        if (error.response?.data?.errors) {
            const apiErrors = error.response.data.errors;
            Object.keys(apiErrors).forEach(key => {
                errors.value[key] = apiErrors[key][0] || 'Erro de validação';
            });
        } else {
            Swal.fire({
                title: 'Erro',
                text: error.message || 'Erro ao salvar moeda',
                icon: 'error'
            });
        }
    } finally {
        loading.value = false;
    }
};

// Lifecycle
onMounted(() => {
    if (props.currency && props.isEdit) {
        form.value = {
            name: props.currency.name,
            symbol: props.currency.symbol,
            code: props.currency.code,
            isActive: props.currency.isActive
        };
    }
});
</script>
