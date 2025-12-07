<template>
    <div>
        <!-- Breadcrumb -->
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <router-link to="/dashboard" class="text-primary hover:underline">Dashboard</router-link>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Utilizadores / Sócios</span>
            </li>
        </ul>

        <div class="pt-5">
            <!-- Header da página -->
            <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h4 class="text-2xl font-semibold dark:text-white-light">Gestão de Utilizadores / Sócios</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Gerencie todos os utilizadores / sócios e suas permissões</p>
                </div>
                <div class="flex gap-4">
                    <button
                        type="button"
                        class="btn btn-outline-primary"
                        @click="exportUsers"
                    >
                        <svg class="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Exportar
                    </button>
                    <button
                        type="button"
                        class="btn btn-primary"
                        @click="openModal"
                    >
                        <svg class="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Novo Utilizador
                    </button>
                </div>
            </div>

            <!-- Filtros -->
            <div class="mb-6">
                <div class="flex flex-wrap gap-4">
                    <div class="flex-1 min-w-64">
                        <input
                            v-model="searchQuery"
                            type="text"
                            placeholder="Buscar por nome ou email..."
                            class="form-input"
                            @input="debounceSearch"
                        />
                    </div>
                    <div>
                        <select v-model="roleFilter" class="form-select">
                            <option value="">Todos os roles</option>
                            <option v-for="role in availableRoles" :key="role.id" :value="role.name">
                                {{ role.name }}
                            </option>
                        </select>
                    </div>
                    <button
                        type="button"
                        class="btn btn-outline-primary"
                        @click="clearFilters"
                    >
                        Limpar Filtros
                    </button>
                </div>
            </div>


            <!-- Tabela -->
            <div class="panel">
                <div class="table-responsive">
                    <table class="table-hover">
                        <thead>
                            <tr>
                                <th>Nome</th>
                                <th>Email</th>
                                <th>Telefone</th>
                                <th>Roles</th>
                                <th class="text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-if="loading">
                                <tr>
                                    <td colspan="5" class="text-center py-8">
                                        <div class="flex items-center justify-center">
                                            <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Carregando...
                                        </div>
                                    </td>
                                </tr>
                            </template>
                            <template v-else-if="filteredUsers.length === 0">
                                <tr>
                                    <td colspan="5" class="text-center py-8 text-gray-500">
                                        Nenhum utilizador encontrado
                                    </td>
                                </tr>
                            </template>
                            <template v-else>
                                <tr v-for="user in filteredUsers" :key="user.id">
                                    <td class="font-semibold">{{ user.name }}</td>
                                    <td>{{ user.email }}</td>
                                    <td>{{ user.phoneNumber }}</td>
                                    <td>
                                        <div class="flex flex-wrap gap-1">
                                            <span
                                                v-for="role in user.roles"
                                                :key="role"
                                                class="badge badge-outline-primary text-xs"
                                            >
                                                {{ role }}
                                            </span>
                                        </div>
                                    </td>
                                    <td class="text-center">
                                        <div class="flex items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                class="btn btn-sm btn-outline-primary"
                                                @click="editUser(user)"
                                                title="Editar"
                                            >
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                class="btn btn-sm btn-outline-warning"
                                                @click="resetUserPassword(user)"
                                                title="Resetar Senha"
                                            >
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                class="btn btn-sm btn-outline-info"
                                                @click="manageUserRoles(user)"
                                                title="Gerir Roles"
                                            >
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            </template>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Modal de User -->
            <UserModal
                :show="showModal"
                :user="selectedUser"
                :is-edit="isEdit"
                @close="closeModal"
                @save="handleSave"
            />

            <!-- Modal de Gestão de Roles -->
            <div v-if="showRoleModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 w-full max-w-md">
                    <h3 class="text-lg font-semibold mb-4">Gerir Roles - {{ selectedUser?.name }}</h3>

                    <!-- Roles Atuais -->
                    <div class="mb-4">
                        <label class="form-label">Roles Atuais:</label>
                        <div class="flex flex-wrap gap-2">
                            <span
                                v-for="role in selectedUser?.roles || []"
                                :key="role"
                                class="badge badge-primary"
                            >
                                {{ role }}
                                <button
                                    type="button"
                                    class="ml-1 text-white hover:text-red-200"
                                    @click="removeRole(role)"
                                >
                                    ×
                                </button>
                            </span>
                        </div>
                    </div>

                    <!-- Adicionar Role -->
                    <div class="mb-4">
                        <label class="form-label">Adicionar Role:</label>
                        <div class="flex gap-2">
                            <select v-model="newRole" class="form-select flex-1">
                                <option value="">Selecionar role</option>
                                <option
                                    v-for="role in availableRoles"
                                    :key="role.id"
                                    :value="role.name"
                                    :disabled="selectedUser?.roles?.includes(role.name)"
                                >
                                    {{ role.name }}
                                </option>
                            </select>
                            <button
                                type="button"
                                class="btn btn-primary"
                                @click="addRole"
                                :disabled="!newRole"
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>

                    <div class="flex justify-end gap-2">
                        <button
                            type="button"
                            class="btn btn-outline-primary"
                            @click="showRoleModal = false"
                        >
                            Fechar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { userService, type User, type UserCreate } from '@/services/users.service';
import { roleService } from '@/services/roles.service';
import Swal from 'sweetalert2';
import UserModal from './UserModal.vue';

// Refs
const users = ref<User[]>([]);
const userListData = ref<any>(null);
const loading = ref(false);
const showModal = ref(false);
const showRoleModal = ref(false);
const selectedUser = ref<User | null>(null);
const isEdit = ref(false);
const searchQuery = ref('');
const roleFilter = ref('');
const availableRoles = ref<{ id: string; name: string; normalizedName: string }[]>([]);
const newRole = ref('');

// Computed
const filteredUsers = computed(() => {
    let filtered = users.value;

    // Filtro por busca
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(user =>
            user.name.toLowerCase().includes(query) ||
            user.email.toLowerCase().includes(query)
        );
    }

    // Filtro por role
    if (roleFilter.value) {
        filtered = filtered.filter(user =>
            user.roles.includes(roleFilter.value)
        );
    }

    return filtered;
});

// Métodos
const loadUsers = async () => {
    loading.value = true;
    try {
        const response = await userService.getUsers();
        if (response.succeeded && response.data) {
            userListData.value = response.data;
            users.value = response.data.data;
        } else {
            console.error('Resposta da API:', response);
            Swal.fire('Erro', 'Erro ao carregar utilizadores', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar utilizadores:', error);
        Swal.fire('Erro', 'Erro ao carregar utilizadores', 'error');
    } finally {
        loading.value = false;
    }
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

const openModal = () => {
    selectedUser.value = null;
    isEdit.value = false;
    showModal.value = true;
};

const editUser = (user: User) => {
    selectedUser.value = user;
    isEdit.value = true;
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    selectedUser.value = null;
    isEdit.value = false;
};

const handleSave = async (data: UserCreate) => {
    try {
        let response;
        if (isEdit.value && selectedUser.value) {
            // Para edição, precisaríamos de um endpoint PUT/PATCH
            Swal.fire('Info', 'Funcionalidade de edição será implementada em breve', 'info');
            return;
        } else {
            response = await userService.createUser(data);
        }

        if (response.succeeded) {
            Swal.fire('Sucesso', 'Utilizador salvo com sucesso!', 'success');
            closeModal();
            loadUsers();
        } else {
            Swal.fire('Erro', 'Erro ao salvar utilizador', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar utilizador:', error);
        Swal.fire('Erro', 'Erro ao salvar utilizador', 'error');
    }
};

const resetUserPassword = async (user: User) => {
    const result = await Swal.fire({
        title: 'Confirmar reset de senha',
        text: `Tem certeza que deseja resetar a senha do utilizador "${user.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, resetar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#f59e0b'
    });

    if (result.isConfirmed) {
        try {
            const response = await userService.resetPassword({ userId: user.id });
            if (response.succeeded) {
                Swal.fire('Sucesso', 'Senha resetada com sucesso!', 'success');
            } else {
                Swal.fire('Erro', 'Erro ao resetar senha', 'error');
            }
        } catch (error) {
            console.error('Erro ao resetar senha:', error);
            Swal.fire('Erro', 'Erro ao resetar senha', 'error');
        }
    }
};

const manageUserRoles = (user: User) => {
    selectedUser.value = user;
    showRoleModal.value = true;
};

const addRole = async () => {
    if (!newRole.value || !selectedUser.value) return;

    try {
        const response = await roleService.assignRole({
            userEmail: selectedUser.value.email,
            roleName: newRole.value
        });

        if (response.succeeded) {
            Swal.fire('Sucesso', 'Role adicionado com sucesso!', 'success');
            newRole.value = '';
            loadUsers(); // Recarregar para atualizar roles
        } else {
            Swal.fire('Erro', 'Erro ao adicionar role', 'error');
        }
    } catch (error) {
        console.error('Erro ao adicionar role:', error);
        Swal.fire('Erro', 'Erro ao adicionar role', 'error');
    }
};

const removeRole = async (roleName: string) => {
    if (!selectedUser.value) return;

    const result = await Swal.fire({
        title: 'Confirmar remoção',
        text: `Tem certeza que deseja remover o role "${roleName}" do utilizador "${selectedUser.value.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, remover',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
        try {
            const response = await roleService.removeRole({
                userEmail: selectedUser.value.email,
                roleName: roleName
            });

            if (response.succeeded) {
                Swal.fire('Sucesso', 'Role removido com sucesso!', 'success');
                loadUsers(); // Recarregar para atualizar roles
            } else {
                Swal.fire('Erro', 'Erro ao remover role', 'error');
            }
        } catch (error) {
            console.error('Erro ao remover role:', error);
            Swal.fire('Erro', 'Erro ao remover role', 'error');
        }
    }
};

const exportUsers = async () => {
    try {
        const blob = await userService.exportUsers();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `utilizadores-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Erro ao exportar utilizadores:', error);
        Swal.fire('Erro', 'Erro ao exportar utilizadores', 'error');
    }
};

const clearFilters = () => {
    searchQuery.value = '';
    roleFilter.value = '';
};

// Debounce para busca
let searchTimeout: number;
const debounceSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        // A busca é reativa via computed
    }, 300);
};

// Lifecycle
onMounted(() => {
    loadUsers();
    loadRoles();
});
</script>
