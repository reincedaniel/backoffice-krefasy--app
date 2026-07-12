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
                                Nova conversa
                            </h3>
                            <div class="mt-4">
                                <form @submit.prevent="save">
                                    <div class="space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-white-dark">Cliente *</label>
                                            <select
                                                v-model="form.clientId"
                                                class="form-select mt-1"
                                                :class="{ 'border-red-500': errors.clientId }"
                                                :disabled="loading || customersLoading"
                                            >
                                                <option value="">Selecione um cliente</option>
                                                <option v-for="customer in customers" :key="customer.id" :value="customer.id">
                                                    {{ customer.fullName }} ({{ customer.email }})
                                                </option>
                                            </select>
                                            <p v-if="errors.clientId" class="mt-1 text-sm text-red-600">{{ errors.clientId }}</p>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-white-dark">Assunto *</label>
                                            <input
                                                v-model="form.subject"
                                                type="text"
                                                class="form-input mt-1"
                                                :class="{ 'border-red-500': errors.subject }"
                                                placeholder="Ex: Problema com pagamento"
                                                :disabled="loading"
                                            />
                                            <p v-if="errors.subject" class="mt-1 text-sm text-red-600">{{ errors.subject }}</p>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-white-dark">Categoria *</label>
                                            <select
                                                v-model="form.category"
                                                class="form-select mt-1"
                                                :class="{ 'border-red-500': errors.category }"
                                                :disabled="loading"
                                            >
                                                <option value="LOAN_INQUIRY">Consulta de empréstimo</option>
                                                <option value="PAYMENT_ISSUE">Problema de pagamento</option>
                                                <option value="TECHNICAL_SUPPORT">Suporte técnico</option>
                                                <option value="COMPLAINT">Reclamação</option>
                                                <option value="GENERAL">Geral</option>
                                            </select>
                                            <p v-if="errors.category" class="mt-1 text-sm text-red-600">{{ errors.category }}</p>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-white-dark">Prioridade *</label>
                                            <select
                                                v-model="form.priority"
                                                class="form-select mt-1"
                                                :class="{ 'border-red-500': errors.priority }"
                                                :disabled="loading"
                                            >
                                                <option value="LOW">Baixa</option>
                                                <option value="MEDIUM">Média</option>
                                                <option value="HIGH">Alta</option>
                                                <option value="URGENT">Urgente</option>
                                            </select>
                                            <p v-if="errors.priority" class="mt-1 text-sm text-red-600">{{ errors.priority }}</p>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-white-dark">Mensagem inicial *</label>
                                            <textarea
                                                v-model="form.initialMessage"
                                                rows="4"
                                                class="form-textarea mt-1"
                                                :class="{ 'border-red-500': errors.initialMessage }"
                                                placeholder="Descreva o motivo da conversa..."
                                                :disabled="loading"
                                            ></textarea>
                                            <p v-if="errors.initialMessage" class="mt-1 text-sm text-red-600">{{ errors.initialMessage }}</p>
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
                        :disabled="loading || customersLoading"
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
                        {{ loading ? 'A criar...' : 'Criar conversa' }}
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
import { customerService, type Customer } from '@/services/customers.service';
import { messagesService, type CreateConversationRequest, type Conversation } from '@/services/messages.service';

const props = defineProps<{
    show: boolean;
}>();

const emit = defineEmits<{
    close: [];
    created: [conversation: Conversation];
}>();

const form = ref<CreateConversationRequest>({
    clientId: '',
    subject: '',
    category: 'GENERAL',
    priority: 'MEDIUM',
    initialMessage: '',
});

const errors = ref<Record<string, string>>({});
const loading = ref(false);
const customersLoading = ref(false);
const customers = ref<Customer[]>([]);

const resetForm = () => {
    form.value = {
        clientId: '',
        subject: '',
        category: 'GENERAL',
        priority: 'MEDIUM',
        initialMessage: '',
    };
    errors.value = {};
};

const loadCustomers = async () => {
    customersLoading.value = true;
    try {
        const response = await customerService.getCustomers();
        if (response.succeeded && response.data) {
            customers.value = response.data;
        } else {
            Swal.fire('Erro', 'Erro ao carregar clientes', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        Swal.fire('Erro', 'Erro ao carregar clientes', 'error');
    } finally {
        customersLoading.value = false;
    }
};

const validateForm = () => {
    errors.value = {};

    if (!form.value.clientId) {
        errors.value.clientId = 'Cliente é obrigatório';
    }
    if (!form.value.subject?.trim()) {
        errors.value.subject = 'Assunto é obrigatório';
    }
    if (!form.value.category) {
        errors.value.category = 'Categoria é obrigatória';
    }
    if (!form.value.priority) {
        errors.value.priority = 'Prioridade é obrigatória';
    }
    if (!form.value.initialMessage?.trim()) {
        errors.value.initialMessage = 'Mensagem inicial é obrigatória';
    }

    return Object.keys(errors.value).length === 0;
};

const save = async () => {
    if (!validateForm() || loading.value) return;

    loading.value = true;
    try {
        const data: CreateConversationRequest = {
            clientId: form.value.clientId,
            subject: form.value.subject.trim(),
            category: form.value.category,
            priority: form.value.priority,
            initialMessage: form.value.initialMessage.trim(),
        };

        const conversation = await messagesService.createConversation(data);
        Swal.fire('Sucesso', 'Conversa criada com sucesso!', 'success');
        emit('created', conversation);
        close();
    } catch (error) {
        console.error('Erro ao criar conversa:', error);
        Swal.fire('Erro', 'Erro ao criar conversa', 'error');
    } finally {
        loading.value = false;
    }
};

const close = () => {
    if (loading.value) return;
    emit('close');
};

watch(() => props.show, (visible) => {
    if (visible) {
        resetForm();
        loadCustomers();
    } else {
        loading.value = false;
    }
});
</script>
