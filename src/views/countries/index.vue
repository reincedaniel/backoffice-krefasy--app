<template>
    <div>
        <!-- Cabeçalho da página -->
        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
                <h4 class="text-2xl font-semibold dark:text-white-light">Países</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">Gerencie os países disponíveis para empréstimos</p>
            </div>
            <div class="flex gap-4">
                <button type="button" class="btn btn-primary" @click="openModal">
                    <svg class="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Adicionar País
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
                        placeholder="Buscar por nome..."
                        class="form-input"
                    />
                </div>
                <div>
                    <select v-model="statusFilter" class="form-select">
                        <option value="">Todos os status</option>
                        <option value="true">Ativos</option>
                        <option value="false">Inativos</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Tabela -->
        <div class="panel">
            <div class="table-responsive">
                <table class="table-hover">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Status</th>
                            <th>Data de Criação</th>
                            <th class="text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-if="loading">
                            <tr>
                                <td colspan="4" class="text-center py-8">
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
                        <template v-else-if="filteredCountries.length === 0">
                            <tr>
                                <td colspan="4" class="text-center py-8 text-gray-500">
                                    Nenhum país encontrado
                                </td>
                            </tr>
                        </template>
                        <template v-else>
                            <tr v-for="country in filteredCountries" :key="country.id">
                                <td class="font-semibold">{{ country.name }}</td>
                                <td>
                                    <span class="badge" :class="country.isActive ? 'badge-success' : 'badge-danger'">
                                        {{ country.isActive ? 'Ativo' : 'Inativo' }}
                                    </span>
                                </td>
                                <td>{{ formatDate(country.createdAt) }}</td>
                                <td class="text-center">
                                    <div class="flex items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-primary"
                                            @click="editCountry(country)"
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            class="btn btn-sm"
                                            :class="country.isActive ? 'btn-warning' : 'btn-success'"
                                            @click="toggleStatus(country)"
                                        >
                                            <svg v-if="country.isActive" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"></path>
                                            </svg>
                                            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-danger"
                                            @click="deleteCountry(country)"
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

        <!-- Modal -->
        <CountryModal
            :show="showModal"
            :country="selectedCountry"
            :is-edit="isEdit"
            @close="closeModal"
            @save="handleSave"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { countryService, type Country, type CountryCreateUpdate } from '@/services/countries.service';
import Swal from 'sweetalert2';
import CountryModal from './CountryModal.vue';

// Refs
const countries = ref<Country[]>([]);
const loading = ref(false);
const showModal = ref(false);
const selectedCountry = ref<Country | null>(null);
const isEdit = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');

// Computed
const filteredCountries = computed(() => {
    let filtered = countries.value;

    // Filtro por busca
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(country =>
            country.name.toLowerCase().includes(query)
        );
    }

    // Filtro por status
    if (statusFilter.value !== '') {
        const isActive = statusFilter.value === 'true';
        filtered = filtered.filter(country => country.isActive === isActive);
    }

    return filtered;
});

// Métodos
const loadCountries = async () => {
    loading.value = true;
    try {
        const response = await countryService.getCountries();
        if (response.succeeded) {
            countries.value = response.data;
        } else {
            Swal.fire('Erro', 'Erro ao carregar países', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar países:', error);
        Swal.fire('Erro', 'Erro ao carregar países', 'error');
    } finally {
        loading.value = false;
    }
};

const openModal = () => {
    selectedCountry.value = null;
    isEdit.value = false;
    showModal.value = true;
};

const editCountry = (country: Country) => {
    selectedCountry.value = country;
    isEdit.value = true;
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    selectedCountry.value = null;
    isEdit.value = false;
};

const handleSave = async (data: CountryCreateUpdate) => {
    try {
        let response;
        if (isEdit.value && selectedCountry.value) {
            response = await countryService.updateCountry(selectedCountry.value.id, data);
        } else {
            response = await countryService.createCountry(data);
        }

        if (response.succeeded) {
            Swal.fire('Sucesso', 'País salvo com sucesso!', 'success');
            closeModal();
            loadCountries();
        } else {
            Swal.fire('Erro', 'Erro ao salvar país', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar país:', error);
        Swal.fire('Erro', 'Erro ao salvar país', 'error');
    }
};

const toggleStatus = async (country: Country) => {
    const action = country.isActive ? 'desativar' : 'ativar';
    const result = await Swal.fire({
        title: `Confirmar ${action}`,
        text: `Tem certeza que deseja ${action} o país "${country.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: `Sim, ${action}`,
        cancelButtonText: 'Cancelar',
        confirmButtonColor: country.isActive ? '#ef4444' : '#22c55e'
    });

    if (result.isConfirmed) {
        try {
            const response = await countryService.updateCountry(country.id, {
                name: country.name,
                isActive: !country.isActive
            });

            if (response.succeeded) {
                Swal.fire('Sucesso', `País ${action}do com sucesso!`, 'success');
                loadCountries();
            } else {
                Swal.fire('Erro', `Erro ao ${action} país`, 'error');
            }
        } catch (error) {
            console.error(`Erro ao ${action} país:`, error);
            Swal.fire('Erro', `Erro ao ${action} país`, 'error');
        }
    }
};

const deleteCountry = async (country: Country) => {
    const result = await Swal.fire({
        title: 'Confirmar exclusão',
        text: `Tem certeza que deseja excluir o país "${country.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
        try {
            const response = await countryService.deleteCountry(country.id);
            if (response.succeeded) {
                Swal.fire('Sucesso', 'País excluído com sucesso!', 'success');
                loadCountries();
            } else {
                Swal.fire('Erro', 'Erro ao excluir país', 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir país:', error);
            Swal.fire('Erro', 'Erro ao excluir país', 'error');
        }
    }
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
};

// Lifecycle
onMounted(() => {
    loadCountries();
});
</script>
