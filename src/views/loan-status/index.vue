<template>
    <div>
        <!-- Cabeçalho da página -->
        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
                <h4 class="text-2xl font-semibold dark:text-white-light">Status de Empréstimos</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">Gerencie os status disponíveis para empréstimos</p>
            </div>
            <div class="flex gap-4">
                <button type="button" class="btn btn-primary" @click="openModal">
                    <svg class="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Adicionar Status
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
            </div>
        </div>


        <!-- Tabela -->
        <div class="panel">
            <div class="table-responsive">
                <table class="table-hover">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Descrição</th>
                            <th>Status</th>
                            <th>Data de Criação</th>
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
                        <template v-else-if="filteredLoanStatuses.length === 0">
                            <tr>
                                <td colspan="5" class="text-center py-8 text-gray-500">
                                    Nenhum status encontrado
                                </td>
                            </tr>
                        </template>
                        <template v-else>
                            <tr v-for="status in filteredLoanStatuses" :key="status.id">
                                <td class="font-semibold">{{ status.name }}</td>
                                <td>{{ status.description }}</td>
                                <td>
                                    <span class="badge" :class="status.isActive ? 'badge-success' : 'badge-danger'">
                                        {{ status.isActive ? 'Ativo' : 'Inativo' }}
                                    </span>
                                </td>
                                <td>{{ formatDate(status.createdAt) }}</td>
                                <td class="text-center">
                                    <div class="flex items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-primary"
                                            @click="editLoanStatus(status)"
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-danger"
                                            @click="deleteLoanStatus(status)"
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
        <LoanStatusModal
            :show="showModal"
            :loan-status="selectedLoanStatus"
            :is-edit="isEdit"
            @close="closeModal"
            @save="handleSave"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { loanStatusService, type LoanStatus, type LoanStatusCreateUpdate } from '@/services/loan-status.service';
import Swal from 'sweetalert2';
import LoanStatusModal from './LoanStatusModal.vue';

// Refs
const loanStatuses = ref<LoanStatus[]>([]);
const loading = ref(false);
const showModal = ref(false);
const selectedLoanStatus = ref<LoanStatus | null>(null);
const isEdit = ref(false);
const searchQuery = ref('');

// Computed
const filteredLoanStatuses = computed(() => {
    let filtered = loanStatuses.value;

    // Filtro por busca
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(status =>
            status.name.toLowerCase().includes(query) ||
            status.description.toLowerCase().includes(query)
        );
    }

    return filtered;
});

// Métodos
const loadLoanStatuses = async () => {
    loading.value = true;
    try {
        const response = await loanStatusService.getLoanStatuses();
        if (response.succeeded && response.data) {
            loanStatuses.value = response.data;
        } else {
            console.error('Resposta da API:', response);
            Swal.fire('Erro', 'Erro ao carregar status de empréstimos', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar status de empréstimos:', error);
        Swal.fire('Erro', 'Erro ao carregar status de empréstimos', 'error');
    } finally {
        loading.value = false;
    }
};

const openModal = () => {
    selectedLoanStatus.value = null;
    isEdit.value = false;
    showModal.value = true;
};

const editLoanStatus = (status: LoanStatus) => {
    selectedLoanStatus.value = status;
    isEdit.value = true;
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    selectedLoanStatus.value = null;
    isEdit.value = false;
};

const handleSave = async (data: LoanStatusCreateUpdate) => {
    try {
        let response;
        if (isEdit.value && selectedLoanStatus.value) {
            response = await loanStatusService.updateLoanStatus(selectedLoanStatus.value.id, data);
        } else {
            response = await loanStatusService.createLoanStatus(data);
        }

        if (response.succeeded) {
            Swal.fire('Sucesso', 'Status salvo com sucesso!', 'success');
            closeModal();
            loadLoanStatuses();
        } else {
            Swal.fire('Erro', 'Erro ao salvar status', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar status:', error);
        Swal.fire('Erro', 'Erro ao salvar status', 'error');
    }
};

const deleteLoanStatus = async (status: LoanStatus) => {
    const result = await Swal.fire({
        title: 'Confirmar exclusão',
        text: `Tem certeza que deseja excluir o status "${status.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
        try {
            const response = await loanStatusService.deleteLoanStatus(status.id);
            if (response.succeeded) {
                Swal.fire('Sucesso', 'Status excluído com sucesso!', 'success');
                loadLoanStatuses();
            } else {
                Swal.fire('Erro', 'Erro ao excluir status', 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir status:', error);
            Swal.fire('Erro', 'Erro ao excluir status', 'error');
        }
    }
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
};

// Lifecycle
onMounted(() => {
    loadLoanStatuses();
});
</script>
