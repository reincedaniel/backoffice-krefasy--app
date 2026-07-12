<template>
    <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div
                class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
                aria-hidden="true"
                @click="!loading && close()"
            ></div>

            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div class="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full dark:bg-[#1b2e4b]">
                <div class="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4 dark:bg-[#1b2e4b]">
                    <div class="sm:flex sm:items-start">
                        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white-light" id="modal-title">
                                {{ isEdit ? 'Editar Método de Pagamento' : 'Novo Método de Pagamento' }}
                            </h3>
                            <div class="mt-4">
                                <form @submit.prevent="save">
                                    <div class="space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-white-dark">Nome *</label>
                                            <input
                                                v-model="form.name"
                                                type="text"
                                                class="form-input mt-1"
                                                :class="{ 'border-red-500': errors.name }"
                                                placeholder="Ex: Pix"
                                                :disabled="loading"
                                            />
                                            <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-white-dark">Código *</label>
                                            <input
                                                v-model="form.code"
                                                type="text"
                                                class="form-input mt-1 uppercase"
                                                :class="{ 'border-red-500': errors.code }"
                                                placeholder="Ex: PIX"
                                                :disabled="loading"
                                                @input="form.code = form.code.toUpperCase()"
                                            />
                                            <p v-if="errors.code" class="mt-1 text-sm text-red-600">{{ errors.code }}</p>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-white-dark">Descrição *</label>
                                            <textarea
                                                v-model="form.description"
                                                rows="3"
                                                class="form-textarea mt-1"
                                                :class="{ 'border-red-500': errors.description }"
                                                placeholder="Ex: Pagamento por PIX"
                                                :disabled="loading"
                                            ></textarea>
                                            <p v-if="errors.description" class="mt-1 text-sm text-red-600">{{ errors.description }}</p>
                                        </div>

                                        <div>
                                            <label class="flex items-center">
                                                <input
                                                    v-model="form.isActive"
                                                    type="checkbox"
                                                    class="form-checkbox text-primary"
                                                    :disabled="loading"
                                                />
                                                <span class="ml-2 text-sm text-gray-700 dark:text-white-dark">Ativo</span>
                                            </label>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse dark:bg-[#1a2941]">
                    <button
                        type="button"
                        class="btn btn-primary sm:ml-3 inline-flex items-center"
                        @click="save"
                        :disabled="loading"
                    >
                        <svg
                            v-if="loading"
                            class="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                        >
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        {{ loading ? 'A processar...' : (isEdit ? 'Atualizar' : 'Criar') }}
                    </button>
                    <button
                        type="button"
                        class="btn btn-outline-secondary mt-3 sm:mt-0"
                        @click="close"
                        :disabled="loading"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Swal from 'sweetalert2';
import {
    paymentMethodTypeService,
    type PaymentMethodType,
    type PaymentMethodTypeCreateUpdate,
} from '@/services/payment-method-types.service';

const props = defineProps<{
    show: boolean;
    paymentMethodType?: PaymentMethodType | null;
    isEdit: boolean;
}>();

const emit = defineEmits<{
    close: [];
    saved: [];
}>();

const form = ref<PaymentMethodTypeCreateUpdate>({
    name: '',
    code: '',
    description: '',
    isActive: true,
});

const errors = ref<Record<string, string>>({});
const loading = ref(false);

const resetForm = () => {
    form.value = {
        name: '',
        code: '',
        description: '',
        isActive: true,
    };
    errors.value = {};
};

const validateForm = () => {
    errors.value = {};

    if (!form.value.name?.trim()) {
        errors.value.name = 'Nome é obrigatório';
    }

    if (!form.value.code?.trim()) {
        errors.value.code = 'Código é obrigatório';
    }

    if (!form.value.description?.trim()) {
        errors.value.description = 'Descrição é obrigatória';
    }

    return Object.keys(errors.value).length === 0;
};

const save = async () => {
    if (!validateForm() || loading.value) return;

    loading.value = true;
    try {
        const data: PaymentMethodTypeCreateUpdate = {
            ...form.value,
            name: form.value.name.trim(),
            code: form.value.code.trim().toUpperCase(),
            description: form.value.description.trim(),
        };

        let response;
        if (props.isEdit && props.paymentMethodType) {
            response = await paymentMethodTypeService.updatePaymentMethodType(props.paymentMethodType.id, data);
        } else {
            response = await paymentMethodTypeService.createPaymentMethodType(data);
        }

        if (response.succeeded) {
            Swal.fire('Sucesso', response.message || 'Método de pagamento salvo com sucesso!', 'success');
            emit('saved');
        } else {
            Swal.fire('Erro', response.message || 'Erro ao salvar método de pagamento', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar método de pagamento:', error);
        Swal.fire('Erro', 'Erro ao salvar método de pagamento', 'error');
    } finally {
        loading.value = false;
    }
};

const close = () => {
    if (loading.value) return;
    emit('close');
};

watch(() => props.paymentMethodType, (item) => {
    if (item && props.isEdit) {
        form.value = {
            name: item.name,
            code: item.code,
            description: item.description,
            isActive: item.isActive,
        };
    } else if (!props.isEdit) {
        resetForm();
    }
}, { immediate: true });

watch(() => props.show, (visible) => {
    if (visible && !props.isEdit) {
        resetForm();
    }
    if (visible && props.isEdit && props.paymentMethodType) {
        form.value = {
            name: props.paymentMethodType.name,
            code: props.paymentMethodType.code,
            description: props.paymentMethodType.description,
            isActive: props.paymentMethodType.isActive,
        };
    }
    if (!visible) {
        loading.value = false;
    }
});
</script>
