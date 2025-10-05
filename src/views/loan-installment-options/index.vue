<template>
    <div>
        <!-- Cabeçalho da página -->
        <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
            <div>
                <h4 class="text-2xl font-semibold dark:text-white-light">Opções de Parcelamento</h4>
                <p class="text-sm text-gray-600 dark:text-gray-400">Gerencie as opções de parcelamento para diferentes produtos e períodos</p>
            </div>
            <div class="flex gap-4">
                <button type="button" class="btn btn-primary" @click="openModal">
                    <svg class="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Adicionar Opção
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
                        placeholder="Buscar por produto ou período..."
                        class="form-input"
                    />
                </div>
                <div>
                    <select v-model="productFilter" class="form-select">
                        <option value="">Todos os produtos</option>
                        <option v-for="product in uniqueProducts" :key="product.id" :value="product.id">
                            {{ product.name }}
                        </option>
                    </select>
                </div>
                <div>
                    <select v-model="periodFilter" class="form-select">
                        <option value="">Todos os períodos</option>
                        <option v-for="period in uniquePeriods" :key="period.id" :value="period.id">
                            {{ period.displayName }}
                        </option>
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
                            <th>Produto</th>
                            <th>Período</th>
                            <th>Dias no Período</th>
                            <th>Máx. Parcelas</th>
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
                        <template v-else-if="filteredInstallmentOptions.length === 0">
                            <tr>
                                <td colspan="5" class="text-center py-8 text-gray-500">
                                    Nenhuma opção de parcelamento encontrada
                                </td>
                            </tr>
                        </template>
                        <template v-else>
                            <tr v-for="option in filteredInstallmentOptions" :key="option.id">
                                <td class="font-semibold">{{ option.loanProductName }}</td>
                                <td>{{ option.interestPeriod.displayName }}</td>
                                <td>{{ option.interestPeriod.daysInPeriod }} dias</td>
                                <td class="font-semibold text-primary">{{ option.maxInstallments }} parcelas</td>
                                <td class="text-center">
                                    <div class="flex items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-primary"
                                            @click="editInstallmentOption(option)"
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-danger"
                                            @click="deleteInstallmentOption(option)"
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
        <InstallmentOptionModal
            :show="showModal"
            :installment-option="selectedInstallmentOption"
            :is-edit="isEdit"
            @close="closeModal"
            @save="handleSave"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { loanInstallmentOptionService, type LoanInstallmentOption, type LoanInstallmentOptionCreateUpdate } from '@/services/loan-installment-options.service';
import Swal from 'sweetalert2';
import InstallmentOptionModal from './InstallmentOptionModal.vue';

// Refs
const installmentOptions = ref<LoanInstallmentOption[]>([]);
const loading = ref(false);
const showModal = ref(false);
const selectedInstallmentOption = ref<LoanInstallmentOption | null>(null);
const isEdit = ref(false);
const searchQuery = ref('');
const productFilter = ref('');
const periodFilter = ref('');

// Computed
const uniqueProducts = computed(() => {
    const products = installmentOptions.value.map(option => ({
        id: option.loanProductId,
        name: option.loanProductName
    }));
    return products.filter((product, index, self) =>
        index === self.findIndex(p => p.id === product.id)
    );
});

const uniquePeriods = computed(() => {
    const periods = installmentOptions.value.map(option => ({
        id: option.interestPeriodId,
        displayName: option.interestPeriod.displayName
    }));
    return periods.filter((period, index, self) =>
        index === self.findIndex(p => p.id === period.id)
    );
});

const filteredInstallmentOptions = computed(() => {
    let filtered = installmentOptions.value;

    // Filtro por busca
    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(option =>
            option.loanProductName.toLowerCase().includes(query) ||
            option.interestPeriod.displayName.toLowerCase().includes(query)
        );
    }

    // Filtro por produto
    if (productFilter.value) {
        filtered = filtered.filter(option => option.loanProductId === productFilter.value);
    }

    // Filtro por período
    if (periodFilter.value) {
        filtered = filtered.filter(option => option.interestPeriodId === periodFilter.value);
    }

    return filtered;
});

// Métodos
const loadInstallmentOptions = async () => {
    loading.value = true;
    try {
        const response = await loanInstallmentOptionService.getLoanInstallmentOptions();
        if (response.succeeded && response.data) {
            installmentOptions.value = response.data;
        } else {
            console.error('Resposta da API:', response);
            Swal.fire('Erro', 'Erro ao carregar opções de parcelamento', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar opções de parcelamento:', error);
        Swal.fire('Erro', 'Erro ao carregar opções de parcelamento', 'error');
    } finally {
        loading.value = false;
    }
};

const openModal = () => {
    selectedInstallmentOption.value = null;
    isEdit.value = false;
    showModal.value = true;
};

const editInstallmentOption = (option: LoanInstallmentOption) => {
    selectedInstallmentOption.value = option;
    isEdit.value = true;
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    selectedInstallmentOption.value = null;
    isEdit.value = false;
};

const handleSave = async (data: LoanInstallmentOptionCreateUpdate) => {
    try {
        let response;
        if (isEdit.value && selectedInstallmentOption.value) {
            response = await loanInstallmentOptionService.updateLoanInstallmentOption(selectedInstallmentOption.value.id, data);
        } else {
            response = await loanInstallmentOptionService.createLoanInstallmentOption(data);
        }

        if (response.succeeded) {
            Swal.fire('Sucesso', 'Opção de parcelamento salva com sucesso!', 'success');
            closeModal();
            loadInstallmentOptions();
        } else {
            Swal.fire('Erro', 'Erro ao salvar opção de parcelamento', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar opção de parcelamento:', error);
        Swal.fire('Erro', 'Erro ao salvar opção de parcelamento', 'error');
    }
};

const deleteInstallmentOption = async (option: LoanInstallmentOption) => {
    const result = await Swal.fire({
        title: 'Confirmar exclusão',
        text: `Tem certeza que deseja excluir a opção de parcelamento "${option.loanProductName} - ${option.interestPeriod.displayName}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
        try {
            const response = await loanInstallmentOptionService.deleteLoanInstallmentOption(option.id);
            if (response.succeeded) {
                Swal.fire('Sucesso', 'Opção de parcelamento excluída com sucesso!', 'success');
                loadInstallmentOptions();
            } else {
                Swal.fire('Erro', 'Erro ao excluir opção de parcelamento', 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir opção de parcelamento:', error);
            Swal.fire('Erro', 'Erro ao excluir opção de parcelamento', 'error');
        }
    }
};

// Lifecycle
onMounted(() => {
    loadInstallmentOptions();
});
</script>
