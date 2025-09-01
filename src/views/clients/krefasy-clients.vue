<template>
    <div>
        <!-- Breadcrumb -->
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <a href="javascript:;" class="text-primary hover:underline">Dashboard</a>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Clientes</span>
            </li>
        </ul>

        <div class="pt-5">
            <!-- Header da página -->
            <div class="flex flex-wrap items-center justify-between mb-6">
                <h2 class="text-2xl font-bold dark:text-white-light">Gestão de Clientes</h2>
                <div class="flex items-center space-x-2">
                    <button
                        type="button"
                        class="btn btn-outline-primary"
                        @click="showImportModal = true"
                    >
                        <icon-download class="w-4 h-4 mr-2" />
                        Importar
                    </button>
                    <button
                        type="button"
                        class="btn btn-primary"
                        @click="showCreateModal = true"
                    >
                        <icon-user-plus class="w-4 h-4 mr-2" />
                        Novo Cliente
                    </button>
                </div>
            </div>

            <!-- Filtros -->
            <div class="panel mb-6">
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                        <label class="form-label">Pesquisar</label>
                        <input
                            v-model="filters.search"
                            type="text"
                            class="form-input"
                            placeholder="Nome, email ou documento..."
                            @input="handleSearch"
                        />
                    </div>
                    <div>
                        <label class="form-label">Status</label>
                        <select v-model="filters.status" class="form-select" @change="handleFilter">
                            <option value="">Todos</option>
                            <option value="ACTIVE">Ativo</option>
                            <option value="INACTIVE">Inativo</option>
                            <option value="BLOCKED">Bloqueado</option>
                            <option value="PENDING_VERIFICATION">Pendente</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Tipo de Documento</label>
                        <select v-model="filters.documentType" class="form-select" @change="handleFilter">
                            <option value="">Todos</option>
                            <option value="CPF">CPF</option>
                            <option value="CNPJ">CNPJ</option>
                            <option value="RG">RG</option>
                            <option value="PASSAPORTE">Passaporte</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Score de Crédito</label>
                        <select v-model="filters.creditScore" class="form-select" @change="handleFilter">
                            <option value="">Todos</option>
                            <option value="0-300">0-300 (Baixo)</option>
                            <option value="301-600">301-600 (Médio)</option>
                            <option value="601-900">601-900 (Alto)</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Tabela de clientes -->
            <div class="panel">
                <div class="table-responsive">
                    <table class="table-striped">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Documento</th>
                                <th>Email</th>
                                <th>Score</th>
                                <th>Status</th>
                                <th>Empréstimos</th>
                                <th>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="client in clients" :key="client.id">
                                <td>
                                    <div class="flex items-center">
                                        <div class="w-10 h-10 rounded-full bg-primary-light dark:bg-primary flex items-center justify-center mr-3">
                                            <span class="text-white font-semibold">
                                                {{ getInitials(client.firstName, client.lastName) }}
                                            </span>
                                        </div>
                                        <div>
                                            <div class="font-semibold">{{ client.firstName }} {{ client.lastName }}</div>
                                            <div class="text-sm text-gray-500">{{ client.phone }}</div>
                                        </div>
                                    </div>
                                </td>
                                <td>
                                    <div>
                                        <div class="font-medium">{{ client.documentNumber }}</div>
                                        <div class="text-sm text-gray-500">{{ client.documentType }}</div>
                                    </div>
                                </td>
                                <td>{{ client.email }}</td>
                                <td>
                                    <span
                                        class="badge"
                                        :class="getCreditScoreClass(client.creditScore)"
                                    >
                                        {{ client.creditScore }}
                                    </span>
                                </td>
                                <td>
                                    <span
                                        class="badge"
                                        :class="getStatusClass(client.status)"
                                    >
                                        {{ getStatusLabel(client.status) }}
                                    </span>
                                </td>
                                <td>
                                    <div class="text-center">
                                        <div class="font-semibold">{{ client.activeLoans }}</div>
                                        <div class="text-sm text-gray-500">ativos</div>
                                    </div>
                                </td>
                                <td>
                                    <div class="flex items-center space-x-2">
                                        <button
                                            class="btn btn-sm btn-outline-primary"
                                            @click="viewClient(client.id)"
                                        >
                                            Ver
                                        </button>
                                        <button
                                            class="btn btn-sm btn-outline-warning"
                                            @click="editClient(client)"
                                        >
                                            Editar
                                        </button>
                                        <button
                                            class="btn btn-sm btn-outline-danger"
                                            @click="deleteClient(client.id)"
                                        >
                                            Excluir
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <!-- Paginação -->
                <div class="flex items-center justify-between mt-4">
                                            <div class="text-sm text-gray-500">
                            Mostrando {{ ((currentPage - 1) * pageSize) + 1 }} a {{ Math.min(currentPage * pageSize, total) }} de {{ total }} clientes
                        </div>
                    <div class="flex items-center space-x-2">
                        <button
                            class="btn btn-outline-primary btn-sm"
                            :disabled="currentPage === 1"
                            @click="changePage(currentPage - 1)"
                        >
                            Anterior
                        </button>
                        <span class="px-3 py-1 bg-gray-100 dark:bg-dark-light rounded">
                            {{ currentPage }} de {{ totalPages }}
                        </span>
                        <button
                            class="btn btn-outline-primary btn-sm"
                            :disabled="currentPage === totalPages"
                            @click="changePage(currentPage + 1)"
                        >
                            Próxima
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Modal de criação/edição -->
        <div v-if="showCreateModal || showEditModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white dark:bg-dark-light rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <h3 class="text-lg font-semibold mb-4">
                    {{ showEditModal ? 'Editar Cliente' : 'Novo Cliente' }}
                </h3>

                <form @submit.prevent="handleSubmit">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label class="form-label">Nome</label>
                            <input
                                v-model="clientForm.firstName"
                                type="text"
                                class="form-input"
                                required
                            />
                        </div>
                        <div>
                            <label class="form-label">Sobrenome</label>
                            <input
                                v-model="clientForm.lastName"
                                type="text"
                                class="form-input"
                                required
                            />
                        </div>
                        <div>
                            <label class="form-label">Email</label>
                            <input
                                v-model="clientForm.email"
                                type="email"
                                class="form-input"
                                required
                            />
                        </div>
                        <div>
                            <label class="form-label">Telefone</label>
                            <input
                                v-model="clientForm.phone"
                                type="tel"
                                class="form-input"
                                required
                            />
                        </div>
                        <div>
                            <label class="form-label">Tipo de Documento</label>
                            <select v-model="clientForm.documentType" class="form-select" required>
                                <option value="CPF">CPF</option>
                                <option value="CNPJ">CNPJ</option>
                                <option value="RG">RG</option>
                                <option value="PASSAPORTE">Passaporte</option>
                            </select>
                        </div>
                        <div>
                            <label class="form-label">Número do Documento</label>
                            <input
                                v-model="clientForm.documentNumber"
                                type="text"
                                class="form-input"
                                required
                            />
                        </div>
                        <div>
                            <label class="form-label">Data de Nascimento</label>
                            <input
                                v-model="clientForm.birthDate"
                                type="date"
                                class="form-input"
                                required
                            />
                        </div>
                        <div>
                            <label class="form-label">Status</label>
                            <select v-model="clientForm.status" class="form-select" required>
                                <option value="ACTIVE">Ativo</option>
                                <option value="INACTIVE">Inativo</option>
                                <option value="BLOCKED">Bloqueado</option>
                                <option value="PENDING_VERIFICATION">Pendente</option>
                            </select>
                        </div>
                    </div>

                    <!-- Endereço -->
                    <div class="mt-4">
                        <h4 class="font-semibold mb-3">Endereço</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="form-label">Rua</label>
                                <input
                                    v-model="clientForm.address.street"
                                    type="text"
                                    class="form-input"
                                    required
                                />
                            </div>
                            <div>
                                <label class="form-label">Número</label>
                                <input
                                    v-model="clientForm.address.number"
                                    type="text"
                                    class="form-input"
                                    required
                                />
                            </div>
                            <div>
                                <label class="form-label">Complemento</label>
                                <input
                                    v-model="clientForm.address.complement"
                                    type="text"
                                    class="form-input"
                                />
                            </div>
                            <div>
                                <label class="form-label">Bairro</label>
                                <input
                                    v-model="clientForm.address.neighborhood"
                                    type="text"
                                    class="form-input"
                                    required
                                />
                            </div>
                            <div>
                                <label class="form-label">Cidade</label>
                                <input
                                    v-model="clientForm.address.city"
                                    type="text"
                                    class="form-input"
                                    required
                                />
                            </div>
                            <div>
                                <label class="form-label">Estado</label>
                                <input
                                    v-model="clientForm.address.state"
                                    type="text"
                                    class="form-input"
                                    required
                                />
                            </div>
                            <div>
                                <label class="form-label">CEP</label>
                                <input
                                    v-model="clientForm.address.zipCode"
                                    type="text"
                                    class="form-input"
                                    required
                                />
                            </div>
                            <div>
                                <label class="form-label">País</label>
                                <input
                                    v-model="clientForm.address.country"
                                    type="text"
                                    class="form-input"
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div class="flex justify-end space-x-2 mt-6">
                        <button
                            type="button"
                            class="btn btn-outline-secondary"
                            @click="closeModals"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            class="btn btn-primary"
                            :disabled="loading"
                        >
                            {{ loading ? 'Salvando...' : (showEditModal ? 'Atualizar' : 'Criar') }}
                        </button>
                    </div>
                </form>
            </div>
        </div>

        <!-- Modal de importação -->
        <div v-if="showImportModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div class="bg-white dark:bg-dark-light rounded-lg p-6 w-full max-w-md">
                <h3 class="text-lg font-semibold mb-4">Importar Clientes</h3>

                <div class="mb-4">
                    <label class="form-label">Arquivo CSV</label>
                    <input
                        ref="fileInput"
                        type="file"
                        accept=".csv"
                        class="form-input"
                        @change="handleFileSelect"
                    />
                    <p class="text-sm text-gray-500 mt-1">
                        Formato: Nome, Email, Telefone, Documento, Tipo
                    </p>
                </div>

                <div class="flex justify-end space-x-2">
                    <button
                        type="button"
                        class="btn btn-outline-secondary"
                        @click="showImportModal = false"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        class="btn btn-primary"
                        :disabled="!selectedFile || loading"
                        @click="handleImport"
                    >
                        {{ loading ? 'Importando...' : 'Importar' }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useKrefasyStore } from '@/stores/index';
import IconDownload from '@/components/icon/icon-download.vue';
import IconUserPlus from '@/components/icon/icon-user-plus.vue';

// Router e Store
const router = useRouter();
const krefasyStore = useKrefasyStore();

// Estado
const loading = ref(false);
const clients = ref<any[]>([]);
const total = ref(0);
const currentPage = ref(1);
const pageSize = ref(20);
const totalPages = computed(() => Math.ceil((total.value || 0) / (pageSize.value || 1)));

// Filtros
const filters = reactive({
    search: '',
    status: '',
    documentType: '',
    creditScore: ''
});

// Modais
const showCreateModal = ref(false);
const showEditModal = ref(false);
const showImportModal = ref(false);

// Formulário
const clientForm = reactive({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    documentType: 'CPF',
    documentNumber: '',
    birthDate: '',
    status: 'ACTIVE',
    address: {
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Brasil'
    }
});

// Arquivo para importação
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement>();

// Computed
const dashboardStats = computed(() => krefasyStore.dashboardStats);

// Métodos
const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const getCreditScoreClass = (score: number) => {
    if (score >= 600) return 'badge-outline-success';
    if (score >= 300) return 'badge-outline-warning';
    return 'badge-outline-danger';
};

const getStatusClass = (status: string) => {
    switch (status) {
        case 'ACTIVE': return 'badge-outline-success';
        case 'INACTIVE': return 'badge-outline-secondary';
        case 'BLOCKED': return 'badge-outline-danger';
        case 'PENDING_VERIFICATION': return 'badge-outline-warning';
        default: return 'badge-outline-secondary';
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'ACTIVE': return 'Ativo';
        case 'INACTIVE': return 'Inativo';
        case 'BLOCKED': return 'Bloqueado';
        case 'PENDING_VERIFICATION': return 'Pendente';
        default: return status;
    }
};

const handleSearch = () => {
    currentPage.value = 1;
    loadClients();
};

const handleFilter = () => {
    currentPage.value = 1;
    loadClients();
};

const changePage = (page: number) => {
    currentPage.value = page;
    loadClients();
};

const loadClients = async () => {
    try {
        loading.value = true;
        const response = await krefasyStore.fetchClients({
            page: currentPage.value,
            limit: pageSize.value,
            ...filters
        });
        clients.value = response.clients;
        total.value = response.total;
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
    } finally {
        loading.value = false;
    }
};

const viewClient = (id: string) => {
    router.push(`/clients/${id}`);
};

const editClient = (client: any) => {
    Object.assign(clientForm, client);
    showEditModal.value = true;
};

const deleteClient = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este cliente?')) {
        try {
            // Implementar exclusão quando disponível no store
            console.log('Excluir cliente:', id);
            loadClients();
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
        }
    }
};

const handleSubmit = async () => {
    try {
        loading.value = true;

        if (showEditModal.value) {
            // Atualizar cliente existente
            await krefasyStore.updateClient((clientForm as any).id, clientForm);
        } else {
            // Criar novo cliente
            await krefasyStore.createClient(clientForm);
        }

        closeModals();
        loadClients();
        resetForm();
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
    } finally {
        loading.value = false;
    }
};

const closeModals = () => {
    showCreateModal.value = false;
    showEditModal.value = false;
    showImportModal.value = false;
    resetForm();
};

const resetForm = () => {
    Object.assign(clientForm, {
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        documentType: 'CPF',
        documentNumber: '',
        birthDate: '',
        status: 'ACTIVE',
        address: {
            street: '',
            number: '',
            complement: '',
            neighborhood: '',
            city: '',
            state: '',
            zipCode: '',
            country: 'Brasil'
        }
    });
};

const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    if (target.files && target.files[0]) {
        selectedFile.value = target.files[0];
    }
};

const handleImport = async () => {
    if (!selectedFile.value) return;

    try {
        loading.value = true;
        // Implementar importação quando disponível no store
        console.log('Importar arquivo:', selectedFile.value);
        showImportModal.value = false;
        selectedFile.value = null;
        if (fileInput.value) fileInput.value.value = '';
        loadClients();
    } catch (error) {
        console.error('Erro ao importar clientes:', error);
    } finally {
        loading.value = false;
    }
};

// Lifecycle
onMounted(() => {
    loadClients();
});
</script>

<style scoped>
.table-responsive {
    overflow-x: auto;
}

.table-striped tbody tr:nth-child(even) {
    background-color: rgba(0, 0, 0, 0.02);
}

:global(.dark) .table-striped tbody tr:nth-child(even) {
    background-color: rgba(255, 255, 255, 0.02);
}

.badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 0.375rem;
}

.badge-outline-success {
    color: #00ab55;
    border: 1px solid #00ab55;
    background-color: transparent;
}

.badge-outline-warning {
    color: #e2a03f;
    border: 1px solid #e2a03f;
    background-color: transparent;
}

.badge-outline-danger {
    color: #e7515a;
    border: 1px solid #e7515a;
    background-color: transparent;
}

.badge-outline-secondary {
    color: #6c757d;
    border: 1px solid #6c757d;
    background-color: transparent;
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
}

.btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
}

.btn-primary {
    background-color: #4361ee;
    color: white;
}

.btn-primary:hover:not(:disabled) {
    background-color: #3a56d4;
}

.btn-outline-primary {
    background-color: transparent;
    color: #4361ee;
    border: 1px solid #4361ee;
}

.btn-outline-primary:hover {
    background-color: #4361ee;
    color: white;
}

.btn-outline-warning {
    background-color: transparent;
    color: #e2a03f;
    border: 1px solid #e2a03f;
}

.btn-outline-warning:hover {
    background-color: #e2a03f;
    color: white;
}

.btn-outline-danger {
    background-color: transparent;
    color: #e7515a;
    border: 1px solid #e7515a;
}

.btn-outline-danger:hover {
    background-color: #e7515a;
    color: white;
}

.btn-outline-secondary {
    background-color: transparent;
    color: #6c757d;
    border: 1px solid #6c757d;
}

.btn-outline-secondary:hover {
    background-color: #6c757d;
    color: white;
}

.form-input, .form-select {
    width: 100%;
    padding: 0.5rem 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    transition: border-color 0.2s ease;
}

.form-input:focus, .form-select:focus {
    outline: none;
    border-color: #4361ee;
    box-shadow: 0 0 0 3px rgba(67, 97, 238, 0.1);
}

.form-label {
    display: block;
    font-weight: 500;
    color: #374151;
    margin-bottom: 0.5rem;
    font-size: 0.875rem;
}

:global(.dark) .form-label {
    color: #d1d5db;
}

:global(.dark) .form-input,
:global(.dark) .form-select {
    background-color: #374151;
    border-color: #4b5563;
    color: white;
}
</style>
