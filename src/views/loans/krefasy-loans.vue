<template>
    <div>
        <!-- Breadcrumb -->
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <a href="javascript:;" class="text-primary hover:underline">Dashboard</a>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Empréstimos</span>
            </li>
        </ul>

        <div class="panel px-0 pb-1.5 border-[#e0e6ed] dark:border-[#1b2e4b] mt-5">
            <div class="datatable">
                <!-- Filtros - Sempre visíveis -->
                <div class="mb-4.5 px-5 flex md:items-center md:flex-row flex-col gap-5">
                    <div class="flex items-center gap-2">
                        <button type="button" class="btn btn-danger gap-2" @click="deleteRow()">
                            <icon-trash-lines />
                            Excluir
                        </button>
                        <router-link to="/loans/add" class="btn btn-primary gap-2">
                            <icon-plus />
                            Novo Empréstimo
                        </router-link>
                    </div>
                    <div class="flex items-center gap-3 ltr:ml-auto rtl:mr-auto">
                        <select
                            v-model="selectedStatus"
                            @change="handleStatusFilter"
                            class="form-select"
                        >
                            <option value="">Todos os Status</option>
                            <option v-for="status in loanStatuses" :key="status.id" :value="status.id">
                                {{ status.name }}
                            </option>
                        </select>
                        <input v-model="search" type="text" class="form-input" placeholder="Pesquisar..." />
                    </div>
                </div>

                <!-- Área da tabela com loading -->
                <div class="relative">
                    <!-- Loading Spinner - Apenas na área da tabela -->
                    <div v-if="loading" class="absolute inset-0 bg-white/50 dark:bg-dark/50 flex items-center justify-center z-10 pt-16">
                        <div class="flex flex-col items-center gap-4">
                            <span class="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10 inline-block align-middle"></span>
                            <span class="text-sm text-gray-600 dark:text-gray-300">Carregando empréstimos...</span>
                        </div>
                    </div>

                    <vue3-datatable
                        ref="datatable"
                        :rows="items"
                        :columns="cols"
                        :totalRows="totalRows"
                        :hasCheckbox="true"
                        :sortable="true"
                        :search="search"
                        skin="whitespace-nowrap bh-table-hover"
                    >
                        <template #loanNumber="data">
                            <div class="text-primary font-semibold">{{ data.value.loanNumber }}</div>
                        </template>
                        <template #requestedAmount="data">
                            <div class="font-semibold">{{ data.value.requestedAmount }}</div>
                        </template>
                        <template #loanStatusName="data">
                            <span class="badge" :class="getStatusBadgeClass(data.value.loanStatusName)">{{ data.value.loanStatusName }}</span>
                        </template>
                        <template #actions="data">
                            <div class="flex gap-4 items-center justify-center">
                                <router-link :to="`/loans/edit/${data.value.id}`" class="hover:text-info">
                                    <icon-edit class="w-4.5 h-4.5" />
                                </router-link>
                                <router-link :to="`/loans/view/${data.value.id}`" class="hover:text-primary">
                                   <icon-eye />
                                </router-link>
                                <button type="button" class="hover:text-danger" @click="deleteRow(data.value.id)">
                                    <icon-trash-lines />
                                </button>
                            </div>
                        </template>
                    </vue3-datatable>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import Vue3Datatable from '@bhplugin/vue3-datatable';
import { useMeta } from '@/composables/use-meta';
import { useKrefasyStore } from '@/stores/index';
import IconTrashLines from '@/components/icon/icon-trash-lines.vue';
import IconPlus from '@/components/icon/icon-plus.vue';
import IconEdit from '@/components/icon/icon-edit.vue';
import IconEye from '@/components/icon/icon-eye.vue';

useMeta({ title: 'Gestão de Empréstimos' });

const store = useKrefasyStore();

const datatable: any = ref(null);
const search = ref('');
const items = ref([]);
const totalRows = ref(0);
const loading = ref(false);
const loanStatuses = ref([]);
const selectedStatus = ref('');

const cols = ref([
    { field: 'loanNumber', title: 'Número' },
    { field: 'customerName', title: 'Cliente' },
    { field: 'customerEmail', title: 'Email' },
    { field: 'createdAt', title: 'Data Criação' },
    { field: 'requestedAmount', title: 'Valor Solicitado', headerClass: 'justify-end' },
    { field: 'loanStatusName', title: 'Status' },
    { field: 'actions', title: 'Ações', sort: false, headerClass: 'justify-center' },
]);

const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'Aprovado':
            return 'badge-outline-success';
        case 'Pendente':
            return 'badge-outline-warning';
        case 'Rejeitado':
            return 'badge-outline-danger';
        default:
            return 'badge-outline-info';
    }
};

const fetchLoans = async (filters: any = {}) => {
    try {
        loading.value = true;

        const response = await store.fetchLoans({
            page: 1,
            limit: 10,
            ...filters
        });

        if (response?.loans) {
            items.value = response.loans.map((loan: any) => ({
                id: loan.id,
                loanNumber: loan.loanNumber,
                customerName: loan.customerName,
                customerEmail: loan.customerEmail,
                createdAt: loan.createdAt ? new Date(loan.createdAt).toLocaleDateString() : 'N/A',
                requestedAmount: loan.requestedAmount,
                loanStatusName: loan.loanStatusName,
                actions: loan // Passando o objeto loan completo para ter acesso ao ID nas ações
            }));
            totalRows.value = response.total;
        }

        console.log('Dados processados:', items.value); // Para debug
    } catch (error) {
        console.error('Erro ao buscar empréstimos:', error);
    } finally {
        loading.value = false;
    }
};

const fetchLoanStatuses = async () => {
    try {
        const statuses = await store.fetchLoanStatuses();
        console.log('Status dos empréstimos:', statuses);
        loanStatuses.value = statuses || [];
    } catch (error) {
        console.error('Erro ao buscar status dos empréstimos:', error);
        // Define um array vazio em caso de erro para não quebrar a interface
        loanStatuses.value = [];
    }
};

const handleStatusFilter = () => {
    const filters: any = {};
    if (selectedStatus.value) {
        filters.statusId = selectedStatus.value;
    }
    fetchLoans(filters);
};

const deleteRow = async (id?: string) => {
    if (confirm('Tem certeza que deseja excluir o(s) registro(s) selecionado(s)?')) {
        if (id) {
            // Implementar lógica de exclusão individual
            items.value = items.value.filter((d: any) => d.id !== id);
        } else {
            let selectedRows = datatable.value.getSelectedRows();
            const ids = selectedRows.map((d: any) => d.id);
            items.value = items.value.filter((d: any) => !ids.includes(d.id));
        }
        datatable.value.clearSelectedRows();
    }
};

onMounted(async () => {
    // Executa as operações de forma independente para que uma não bloqueie a outra
    await fetchLoans();
    await fetchLoanStatuses();
});
</script>
