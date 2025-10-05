<template>
    <div>
        <!-- Cabeçalho da página -->
        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
                <h4 class="text-2xl font-semibold dark:text-white-light">Períodos de Juros</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">Gerencie os períodos de juros disponíveis para empréstimos</p>
            </div>
            <div class="flex gap-4">
                <button type="button" class="btn btn-primary" @click="openModal">
                    <svg class="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Adicionar Período
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
                            <th>Nome de Exibição</th>
                            <th>Dias no Período</th>
                            <th>Status</th>
                            <th>Data de Criação</th>
                            <th class="text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-if="loading">
                            <tr>
                                <td colspan="6" class="text-center py-8">
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
                        <template v-else-if="filteredInterestPeriods.length === 0">
                            <tr>
                                <td colspan="6" class="text-center py-8 text-gray-500">
                                    Nenhum período de juros encontrado
                                </td>
                            </tr>
                        </template>
                        <template v-else>
                            <tr v-for="period in filteredInterestPeriods" :key="period.id">
                                <td class="font-semibold">{{ period.name }}</td>
                                <td>{{ period.displayName }}</td>
                                <td>{{ period.daysInPeriod }} dias</td>
                                <td>
                                    <span class="badge" :class="period.isActive ? 'badge-success' : 'badge-danger'">
                                        {{ period.isActive ? 'Ativo' : 'Inativo' }}
                                    </span>
                                </td>
                                <td>{{ formatDate(period.createdAt) }}</td>
                                <td class="text-center">
                                    <div class="flex items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-primary"
                                            @click="editInterestPeriod(period)"
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            class="btn btn-sm"
                                            :class="period.isActive ? 'btn-warning' : 'btn-success'"
                                            @click="toggleStatus(period)"
                                        >
                                            <svg v-if="period.isActive" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636M5.636 18.364l12.728-12.728"></path>
                                            </svg>
                                            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-danger"
                                            @click="deleteInterestPeriod(period)"
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
        <InterestPeriodModal
            :show="showModal"
            :interest-period="selectedInterestPeriod"
            :is-edit="isEdit"
            @close="closeModal"
            @save="handleSave"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { interestPeriodService, type InterestPeriod, type InterestPeriodCreateUpdate } from '@/services/interest-periods.service';
import Swal from 'sweetalert2';
import InterestPeriodModal from './InterestPeriodModal.vue';

// Refs
const interestPeriods = ref<InterestPeriod[]>([]);
const loading = ref(false);
const showModal = ref(false);
const selectedInterestPeriod = ref<InterestPeriod | null>(null);
const isEdit = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');

// Computed
const filteredInterestPeriods = computed(() => {
    let filtered = interestPeriods.value;

    // Filtro por busca
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(period =>
            period.name.toLowerCase().includes(query) ||
            period.displayName.toLowerCase().includes(query)
        );
    }

    // Filtro por status
    if (statusFilter.value !== '') {
        const isActive = statusFilter.value === 'true';
        filtered = filtered.filter(period => period.isActive === isActive);
    }

    return filtered;
});

// Métodos
const loadInterestPeriods = async () => {
    loading.value = true;
    try {
        const response = await interestPeriodService.getInterestPeriods();
        if (response.succeeded) {
            interestPeriods.value = response.data;
        } else {
            Swal.fire('Erro', 'Erro ao carregar períodos de juros', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar períodos de juros:', error);
        Swal.fire('Erro', 'Erro ao carregar períodos de juros', 'error');
    } finally {
        loading.value = false;
    }
};

const openModal = () => {
    selectedInterestPeriod.value = null;
    isEdit.value = false;
    showModal.value = true;
};

const editInterestPeriod = (period: InterestPeriod) => {
    selectedInterestPeriod.value = period;
    isEdit.value = true;
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    selectedInterestPeriod.value = null;
    isEdit.value = false;
};

const handleSave = async (data: InterestPeriodCreateUpdate) => {
    try {
        let response;
        if (isEdit.value && selectedInterestPeriod.value) {
            response = await interestPeriodService.updateInterestPeriod(selectedInterestPeriod.value.id, data);
        } else {
            response = await interestPeriodService.createInterestPeriod(data);
        }

        if (response.succeeded) {
            Swal.fire('Sucesso', 'Período de juros salvo com sucesso!', 'success');
            closeModal();
            loadInterestPeriods();
        } else {
            Swal.fire('Erro', 'Erro ao salvar período de juros', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar período de juros:', error);
        Swal.fire('Erro', 'Erro ao salvar período de juros', 'error');
    }
};

const toggleStatus = async (period: InterestPeriod) => {
    const action = period.isActive ? 'desativar' : 'ativar';
    const result = await Swal.fire({
        title: `Confirmar ${action}`,
        text: `Tem certeza que deseja ${action} o período "${period.displayName}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: `Sim, ${action}`,
        cancelButtonText: 'Cancelar',
        confirmButtonColor: period.isActive ? '#ef4444' : '#22c55e'
    });

    if (result.isConfirmed) {
        try {
            const response = await interestPeriodService.updateInterestPeriod(period.id, {
                name: period.name,
                displayName: period.displayName,
                daysInPeriod: period.daysInPeriod,
                isActive: !period.isActive
            });

            if (response.succeeded) {
                Swal.fire('Sucesso', `Período ${action}do com sucesso!`, 'success');
                loadInterestPeriods();
            } else {
                Swal.fire('Erro', `Erro ao ${action} período`, 'error');
            }
        } catch (error) {
            console.error(`Erro ao ${action} período:`, error);
            Swal.fire('Erro', `Erro ao ${action} período`, 'error');
        }
    }
};

const deleteInterestPeriod = async (period: InterestPeriod) => {
    const result = await Swal.fire({
        title: 'Confirmar exclusão',
        text: `Tem certeza que deseja excluir o período "${period.displayName}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
        try {
            const response = await interestPeriodService.deleteInterestPeriod(period.id);
            if (response.succeeded) {
                Swal.fire('Sucesso', 'Período excluído com sucesso!', 'success');
                loadInterestPeriods();
            } else {
                Swal.fire('Erro', 'Erro ao excluir período', 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir período:', error);
            Swal.fire('Erro', 'Erro ao excluir período', 'error');
        }
    }
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
};

// Lifecycle
onMounted(() => {
    loadInterestPeriods();
});
</script>
