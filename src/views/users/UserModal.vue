<template>
    <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <!-- Header -->
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-semibold">
                        {{ isEdit ? 'Editar Utilizador' : 'Novo Utilizador' }}
                    </h3>
                    <button
                        type="button"
                        class="btn btn-outline-primary btn-sm"
                        @click="$emit('close')"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <form @submit.prevent="handleSubmit">
                    <!-- Informações Pessoais -->
                    <div class="space-y-4">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="form-label">Nome *</label>
                                <input
                                    v-model="form.firstName"
                                    type="text"
                                    class="form-input"
                                    :class="{ 'border-red-500': errors.firstName }"
                                    required
                                />
                                <span v-if="errors.firstName" class="text-red-500 text-sm">{{ errors.firstName }}</span>
                            </div>

                            <div>
                                <label class="form-label">Sobrenome *</label>
                                <input
                                    v-model="form.lastName"
                                    type="text"
                                    class="form-input"
                                    :class="{ 'border-red-500': errors.lastName }"
                                    required
                                />
                                <span v-if="errors.lastName" class="text-red-500 text-sm">{{ errors.lastName }}</span>
                            </div>
                        </div>

                        <div>
                            <label class="form-label">Email *</label>
                            <input
                                v-model="form.email"
                                type="email"
                                class="form-input"
                                :class="{ 'border-red-500': errors.email }"
                                required
                            />
                            <span v-if="errors.email" class="text-red-500 text-sm">{{ errors.email }}</span>
                        </div>

                        <div>
                            <label class="form-label">Telefone *</label>
                            <input
                                v-model="form.phoneNumber"
                                type="tel"
                                class="form-input"
                                :class="{ 'border-red-500': errors.phoneNumber }"
                                required
                            />
                            <span v-if="errors.phoneNumber" class="text-red-500 text-sm">{{ errors.phoneNumber }}</span>
                        </div>

                        <div v-if="!isEdit">
                            <label class="form-label">Role *</label>
                            <select
                                v-model="form.roleId"
                                class="form-select"
                                :class="{ 'border-red-500': errors.roleId }"
                                required
                            >
                                <option value="">Selecione um role</option>
                                <option v-for="role in availableRoles" :key="role.id" :value="role.id">
                                    {{ role.name }}
                                </option>
                            </select>
                            <span v-if="errors.roleId" class="text-red-500 text-sm">{{ errors.roleId }}</span>
                        </div>

                        <div v-if="!isEdit" class="grid grid-cols-2 gap-4">
                            <div>
                                <label class="form-label">Senha *</label>
                                <input
                                    v-model="form.password"
                                    type="password"
                                    class="form-input"
                                    :class="{ 'border-red-500': errors.password }"
                                    required
                                />
                                <span v-if="errors.password" class="text-red-500 text-sm">{{ errors.password }}</span>
                            </div>

                            <div>
                                <label class="form-label">Confirmar Senha *</label>
                                <input
                                    v-model="form.confirmPassword"
                                    type="password"
                                    class="form-input"
                                    :class="{ 'border-red-500': errors.confirmPassword }"
                                    required
                                />
                                <span v-if="errors.confirmPassword" class="text-red-500 text-sm">{{ errors.confirmPassword }}</span>
                            </div>
                        </div>
                    </div>

                    <!-- Botões -->
                    <div class="flex justify-end gap-4 pt-6 border-t mt-6">
                        <button
                            type="button"
                            class="btn btn-outline-primary"
                            @click="$emit('close')"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            class="btn btn-primary"
                            :disabled="loading"
                        >
                            <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {{ isEdit ? 'Atualizar' : 'Criar' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch, onMounted } from 'vue';
import { userService, type User, type UserCreate } from '@/services/users.service';

// Props
interface Props {
    show: boolean;
    user: User | null;
    isEdit: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    show: false,
    user: null,
    isEdit: false
});

// Emits
const emit = defineEmits<{
    close: [];
    save: [data: UserCreate];
}>();

// Refs
const loading = ref(false);
const errors = ref<Record<string, string>>({});
const availableRoles = ref<{ id: string; name: string; normalizedName: string }[]>([]);

const form = reactive<UserCreate>({
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    password: '',
    confirmPassword: '',
    roleId: ''
});

// Métodos
const resetForm = () => {
    Object.assign(form, {
        firstName: '',
        lastName: '',
        email: '',
        phoneNumber: '',
        password: '',
        confirmPassword: '',
        roleId: ''
    });
    errors.value = {};
};

const loadRoles = async () => {
    try {
        const response = await userService.getAvailableRoles();
        if (response.succeeded && response.data) {
            availableRoles.value = response.data;
        }
    } catch (error) {
        console.error('Erro ao carregar roles:', error);
    }
};

const validateForm = (): boolean => {
    errors.value = {};

    if (!form.firstName.trim()) {
        errors.value.firstName = 'Nome é obrigatório';
    }

    if (!form.lastName.trim()) {
        errors.value.lastName = 'Sobrenome é obrigatório';
    }

    if (!form.email.trim()) {
        errors.value.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.value.email = 'Email inválido';
    }

    if (!form.phoneNumber.trim()) {
        errors.value.phoneNumber = 'Telefone é obrigatório';
    }

    if (!props.isEdit) {
        if (!form.password.trim()) {
            errors.value.password = 'Senha é obrigatória';
        } else if (form.password.length < 6) {
            errors.value.password = 'Senha deve ter pelo menos 6 caracteres';
        }

        if (!form.confirmPassword.trim()) {
            errors.value.confirmPassword = 'Confirmação de senha é obrigatória';
        } else if (form.password !== form.confirmPassword) {
            errors.value.confirmPassword = 'Senhas não coincidem';
        }

        if (!form.roleId) {
            errors.value.roleId = 'Role é obrigatório';
        }
    }

    return Object.keys(errors.value).length === 0;
};

const handleSubmit = async () => {
    if (!validateForm()) {
        return;
    }

    loading.value = true;
    try {
        // Preparar dados para envio
        const submitData: UserCreate = {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phoneNumber: form.phoneNumber,
            password: form.password,
            confirmPassword: form.confirmPassword,
            roleId: form.roleId
        };

        emit('save', submitData);
    } finally {
        loading.value = false;
    }
};

// Watchers
watch(() => props.user, (newUser) => {
    if (newUser && props.isEdit) {
        // Para edição, preencher apenas os campos disponíveis
        // Como a API não retorna firstName/lastName separados, usar o name completo
        const nameParts = newUser.name.split(' ');
        Object.assign(form, {
            firstName: nameParts[0] || '',
            lastName: nameParts.slice(1).join(' ') || '',
            email: newUser.email,
            phoneNumber: newUser.phoneNumber,
            password: '',
            confirmPassword: '',
            roleId: '' // Role seria gerenciado separadamente
        });
    } else {
        resetForm();
    }
}, { immediate: true });

watch(() => props.show, (newShow) => {
    if (!newShow) {
        resetForm();
    }
});

// Lifecycle
onMounted(() => {
    loadRoles();
});
</script>
