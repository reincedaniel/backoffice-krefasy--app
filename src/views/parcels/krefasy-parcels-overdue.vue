<template>
    <div>
        <PageHeader
            title="Parcelas Vencidas"
            subtitle="Pagamentos em atraso com juros de mora calculados localmente"
        />

        <div class="panel mt-5">
            <div v-if="loading" class="flex flex-col items-center justify-center py-16 gap-3">
                <span class="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10 inline-block"></span>
                <span class="text-sm text-white-dark">A carregar parcelas vencidas...</span>
            </div>

            <div v-else-if="error" class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-sm">
                {{ error }}
            </div>

            <div v-else-if="overdueParcels.length === 0" class="text-center py-16 text-white-dark">
                <p class="text-lg font-medium">Nenhuma parcela vencida</p>
                <p class="text-sm mt-1">Todas as parcelas estão em dia ou já foram pagas.</p>
            </div>

            <div v-else class="overflow-x-auto">
                <div class="flex flex-wrap items-center justify-between gap-3 mb-4 px-1">
                    <p class="text-sm text-white-dark">
                        {{ overdueParcels.length }} parcela(s) em atraso
                    </p>
                </div>
                <table class="table-hover">
                    <thead>
                        <tr>
                            <th>Cliente</th>
                            <th>Empréstimo</th>
                            <th>Parcela</th>
                            <th>Vencimento</th>
                            <th>Valor base</th>
                            <th>Dias</th>
                            <th>Mora</th>
                            <th>Total a pagar</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr v-for="parcel in overdueParcels" :key="parcel.id">
                            <td class="font-medium">{{ parcel.clientName }}</td>
                            <td>
                                <router-link
                                    :to="`/loans/view/${parcel.loanId}`"
                                    class="text-primary hover:underline text-sm"
                                >
                                    Ver empréstimo
                                </router-link>
                            </td>
                            <td>
                                <span v-if="parcel.installmentNumber">#{{ parcel.installmentNumber }}</span>
                                <span v-else class="text-white-dark">—</span>
                            </td>
                            <td>{{ formatDate(parcel.dueDate) }}</td>
                            <td>{{ formatParcelAmount(parcel, parcel.amount) }}</td>
                            <td>
                                <span class="text-red-600 dark:text-red-400 font-medium">{{ parcel.daysOverdue ?? 0 }}</span>
                            </td>
                            <td>
                                <span v-if="parcel.lateInterest && parcel.lateInterest > 0" class="text-red-600 dark:text-red-400">
                                    + {{ formatParcelAmount(parcel, parcel.lateInterest) }}
                                </span>
                                <span v-else class="text-white-dark">—</span>
                            </td>
                            <td class="font-bold text-red-700 dark:text-red-300">
                                {{ formatParcelAmount(parcel) }}
                            </td>
                            <td>
                                <router-link
                                    :to="`/loans/view/${parcel.loanId}`"
                                    class="btn btn-outline-primary btn-sm"
                                >
                                    Abrir
                                </router-link>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import PageHeader from '@/components/layout/PageHeader.vue';
import { loansService } from '@/services/loans.service';
import {
    fetchAllLoans,
    fetchOverdueInstallments,
    type DashboardInstallment,
} from '@/utils/dashboard-charts.utils';

const loading = ref(true);
const error = ref('');
const overdueParcels = ref<DashboardInstallment[]>([]);

const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

const formatAmount = (amount: number) => {
    if (amount >= 1000) return `${(amount / 1000).toFixed(1)}k`;
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
};

const formatParcelAmount = (parcel: DashboardInstallment, value?: number) => {
    const amount = value ?? parcel.totalDue ?? parcel.amount;
    const code = parcel.currencyCode || 'AOA';
    try {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: code,
            minimumFractionDigits: 2,
        }).format(amount);
    } catch {
        const symbol = parcel.currencySymbol || code;
        return `${symbol} ${formatAmount(amount)}`;
    }
};

async function loadOverdueParcels() {
    loading.value = true;
    error.value = '';

    try {
        const allLoans = await fetchAllLoans(loansService);
        const result = await fetchOverdueInstallments(loansService, allLoans, 50, 200);
        overdueParcels.value = result.items;
    } catch (err: unknown) {
        error.value = err instanceof Error ? err.message : 'Erro ao carregar parcelas vencidas';
    } finally {
        loading.value = false;
    }
}

onMounted(loadOverdueParcels);
</script>
