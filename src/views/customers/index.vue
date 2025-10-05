<template>
    <div>
        <!-- Breadcrumb -->
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <router-link to="/dashboard" class="text-primary hover:underline">Dashboard</router-link>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Clientes</span>
            </li>
        </ul>

        <div class="pt-5">
            <!-- Header da página -->
            <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h4 class="text-2xl font-semibold dark:text-white-light">Gestão de Clientes</h4>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Gerencie todos os customers do sistema</p>
                </div>
                <div class="flex gap-4">
                    <button
                        type="button"
                        class="btn btn-outline-primary"
                        @click="exportCustomers"
                    >
                        <svg class="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Exportar
                    </button>
                    <button
                        type="button"
                        class="btn btn-outline-primary"
                        @click="showImportModal = true"
                    >
                        <svg class="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"></path>
                        </svg>
                        Importar
                    </button>
                    <button
                        type="button"
                        class="btn btn-primary"
                        @click="openModal"
                    >
                        <svg class="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                        </svg>
                        Novo Clientes
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
                            placeholder="Buscar por nome, email ou telefone..."
                            class="form-input"
                            @input="debounceSearch"
                        />
                    </div>
                    <div>
                        <select v-model="countryFilter" class="form-select">
                            <option value="">Todos os países</option>
                            <option v-for="country in uniqueCountries" :key="country" :value="country">
                                {{ country }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <select v-model="cityFilter" class="form-select">
                            <option value="">Todas as cidades</option>
                            <option v-for="city in uniqueCities" :key="city" :value="city">
                                {{ city }}
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
                                <th>Cidade</th>
                                <th>País</th>
                                <th>Documento</th>
                                <th>Data de Cadastro</th>
                                <th class="text-center">Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            <template v-if="loading">
                                <tr>
                                    <td colspan="8" class="text-center py-8">
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
                            <template v-else-if="filteredCustomers.length === 0">
                                <tr>
                                    <td colspan="8" class="text-center py-8 text-gray-500">
                                        Nenhum customer encontrado
                                    </td>
                                </tr>
                            </template>
                            <template v-else>
                                <tr v-for="customer in filteredCustomers" :key="customer.id">
                                    <td class="font-semibold">{{ customer.fullName }}</td>
                                    <td>{{ customer.email }}</td>
                                    <td>{{ customer.phoneNumber }}</td>
                                    <td>{{ customer.city || '-' }}</td>
                                    <td>{{ customer.country || '-' }}</td>
                                    <td>
                                        <span v-if="customer.documentNumber" class="badge badge-outline-primary">
                                            {{ customer.documentType }}: {{ customer.documentNumber }}
                                        </span>
                                        <span v-else class="text-gray-400">Não informado</span>
                                    </td>
                                    <td>{{ formatDate(customer.createdAt) }}</td>
                                    <td class="text-center">
                                        <div class="flex items-center justify-center gap-2">
                                            <button
                                                type="button"
                                                class="btn btn-sm btn-outline-primary"
                                                @click="viewCustomer(customer)"
                                                title="Visualizar"
                                            >
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                class="btn btn-sm btn-outline-primary"
                                                @click="editCustomer(customer)"
                                                title="Editar"
                                            >
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                                </svg>
                                            </button>
                                            <button
                                                type="button"
                                                class="btn btn-sm btn-outline-danger"
                                                @click="deleteCustomer(customer)"
                                                title="Excluir"
                                            >
                                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
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

            <!-- Modal de Customer -->
            <CustomerModal
                :show="showModal"
                :customer="selectedCustomer"
                :is-edit="isEdit"
                @close="closeModal"
                @save="handleSave"
            />

            <!-- Modal de Importação -->
            <div v-if="showImportModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div class="bg-white rounded-lg p-6 w-full max-w-md">
                    <h3 class="text-lg font-semibold mb-4">Importar Clientes</h3>
                    <div class="mb-4">
                        <input
                            ref="fileInput"
                            type="file"
                            accept=".csv,.xlsx"
                            class="form-input"
                            @change="handleFileSelect"
                        />
                    </div>
                    <div class="flex justify-end gap-2">
                        <button
                            type="button"
                            class="btn btn-outline-primary"
                            @click="showImportModal = false"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            class="btn btn-primary"
                            @click="importCustomers"
                            :disabled="!selectedFile"
                        >
                            Importar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { customerService, type Customer, type CustomerCreateUpdate } from '@/services/customers.service';
import Swal from 'sweetalert2';
import CustomerModal from './CustomerModal.vue';

const router = useRouter();

// Refs
const customers = ref<Customer[]>([]);
const loading = ref(false);
const showModal = ref(false);
const showImportModal = ref(false);
const selectedCustomer = ref<Customer | null>(null);
const isEdit = ref(false);
const searchQuery = ref('');
const countryFilter = ref('');
const cityFilter = ref('');
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement>();

// Computed
const uniqueCountries = computed(() => {
    const countries = customers.value.map(c => c.country).filter(Boolean);
    return [...new Set(countries)];
});

const uniqueCities = computed(() => {
    const cities = customers.value.map(c => c.city).filter(Boolean);
    return [...new Set(cities)];
});

const filteredCustomers = computed(() => {
    let filtered = customers.value;

    // Filtro por busca
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(customer =>
            customer.fullName.toLowerCase().includes(query) ||
            customer.email.toLowerCase().includes(query) ||
            customer.phoneNumber.toLowerCase().includes(query) ||
            (customer.documentNumber && customer.documentNumber.toLowerCase().includes(query))
        );
    }

    // Filtro por país
    if (countryFilter.value) {
        filtered = filtered.filter(customer => customer.country === countryFilter.value);
    }

    // Filtro por cidade
    if (cityFilter.value) {
        filtered = filtered.filter(customer => customer.city === cityFilter.value);
    }

    return filtered;
});

// Métodos
const loadCustomers = async () => {
    loading.value = true;
    try {
        const response = await customerService.getCustomers();
        if (response.succeeded && response.data) {
            customers.value = response.data;
        } else {
            console.error('Resposta da API:', response);
            Swal.fire('Erro', 'Erro ao carregar customers', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar customers:', error);
        Swal.fire('Erro', 'Erro ao carregar customers', 'error');
    } finally {
        loading.value = false;
    }
};

const openModal = () => {
    selectedCustomer.value = null;
    isEdit.value = false;
    showModal.value = true;
};

const editCustomer = (customer: Customer) => {
    selectedCustomer.value = customer;
    isEdit.value = true;
    showModal.value = true;
};

const viewCustomer = (customer: Customer) => {
    router.push(`/customers/${customer.id}`);
};

const closeModal = () => {
    showModal.value = false;
    selectedCustomer.value = null;
    isEdit.value = false;
};

const handleSave = async (data: CustomerCreateUpdate) => {
    try {
        let response;
        if (isEdit.value && selectedCustomer.value) {
            response = await customerService.updateCustomer(selectedCustomer.value.id, data);
        } else {
            response = await customerService.createCustomer(data);
        }

        if (response.succeeded) {
            Swal.fire('Sucesso', 'Customer salvo com sucesso!', 'success');
            closeModal();
            loadCustomers();
        } else {
            Swal.fire('Erro', 'Erro ao salvar customer', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar customer:', error);
        Swal.fire('Erro', 'Erro ao salvar customer', 'error');
    }
};

const deleteCustomer = async (customer: Customer) => {
    const result = await Swal.fire({
        title: 'Confirmar exclusão',
        text: `Tem certeza que deseja excluir o customer "${customer.fullName}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
        try {
            const response = await customerService.deleteCustomer(customer.id);
            if (response.succeeded) {
                Swal.fire('Sucesso', 'Customer excluído com sucesso!', 'success');
                loadCustomers();
            } else {
                Swal.fire('Erro', 'Erro ao excluir customer', 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir customer:', error);
            Swal.fire('Erro', 'Erro ao excluir customer', 'error');
        }
    }
};

const exportCustomers = async () => {
    try {
        const blob = await customerService.exportCustomers();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `customers-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Erro ao exportar customers:', error);
        Swal.fire('Erro', 'Erro ao exportar customers', 'error');
    }
};

const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    selectedFile.value = target.files?.[0] || null;
};

const importCustomers = async () => {
    if (!selectedFile.value) return;

    try {
        const response = await customerService.importCustomers(selectedFile.value);
        if (response.succeeded) {
            Swal.fire('Sucesso', 'Clientes importados com sucesso!', 'success');
            showImportModal.value = false;
            selectedFile.value = null;
            if (fileInput.value) {
                fileInput.value.value = '';
            }
            loadCustomers();
        } else {
            Swal.fire('Erro', 'Erro ao importar customers', 'error');
        }
    } catch (error) {
        console.error('Erro ao importar customers:', error);
        Swal.fire('Erro', 'Erro ao importar customers', 'error');
    }
};

const clearFilters = () => {
    searchQuery.value = '';
    countryFilter.value = '';
    cityFilter.value = '';
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
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
    loadCustomers();
});
</script>
