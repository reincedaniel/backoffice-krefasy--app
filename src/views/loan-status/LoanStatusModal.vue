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
                                {{ isEdit ? 'Editar Status de Empréstimo' : 'Novo Status de Empréstimo' }}
                            </h3>
                            <div class="mt-4">
                                <form @submit.prevent="save">
                                    <div class="space-y-4">
                                        <!-- Nome -->
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700">Nome *</label>
                                            <input
                                                v-model="form.name"
                                                type="text"
                                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                                :class="{ 'border-red-500': errors.name }"
                                                placeholder="Ex: Aprovado"
                                            />
                                            <p v-if="errors.name" class="mt-1 text-sm text-red-600">{{ errors.name }}</p>
                                        </div>

                                        <!-- Descrição -->
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700">Descrição *</label>
                                            <textarea
                                                v-model="form.description"
                                                rows="3"
                                                class="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                                :class="{ 'border-red-500': errors.description }"
                                                placeholder="Ex: Empréstimo aprovado e liberado"
                                            ></textarea>
                                            <p v-if="errors.description" class="mt-1 text-sm text-red-600">{{ errors.description }}</p>
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
import { ref, watch } from 'vue';
import type { LoanStatus, LoanStatusCreateUpdate } from '@/services/loan-status.service';

// Props
const props = defineProps<{
    show: boolean;
    loanStatus?: LoanStatus | null;
    isEdit: boolean;
}>();

// Emits
const emit = defineEmits<{
    close: [];
    save: [data: LoanStatusCreateUpdate];
}>();

// Refs
const form = ref({
    name: '',
    description: ''
});

const errors = ref<Record<string, string>>({});
const loading = ref(false);

// Métodos
const resetForm = () => {
    form.value = {
        name: '',
        description: ''
    };
    errors.value = {};
};

const validateForm = () => {
    errors.value = {};

    if (!form.value.name?.trim()) {
        errors.value.name = 'Nome é obrigatório';
    }

    if (!form.value.description?.trim()) {
        errors.value.description = 'Descrição é obrigatória';
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

// Watchers
watch(() => props.loanStatus, (newLoanStatus) => {
    if (newLoanStatus && props.isEdit) {
        form.value = {
            name: newLoanStatus.name,
            description: newLoanStatus.description || ''
        };
    } else {
        resetForm();
    }
}, { immediate: true });

watch(() => props.show, (newShow) => {
    if (newShow) {
        resetForm();
    }
});
</script>
