<template>
    <div class="space-y-5">
        <PageHeader
            title="Relatórios e Analytics"
            subtitle="Desempenho financeiro real da carteira de crédito"
            :breadcrumbs="[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Relatórios' }]"
        >
            <template #actions>
                <button
                    type="button"
                    class="btn btn-outline-secondary btn-sm gap-2"
                    :disabled="loading || loanRows.length === 0"
                    @click="handleExport"
                >
                    <icon-download class="w-4 h-4" />
                    Exportar CSV
                </button>
                <button
                    type="button"
                    class="btn btn-primary btn-sm gap-2"
                    :disabled="loading"
                    @click="refresh"
                >
                    <icon-refresh class="w-4 h-4" :class="{ 'animate-spin': loading }" />
                    Atualizar
                </button>
            </template>
        </PageHeader>

        <!-- Filtros -->
        <div class="panel">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <h2 class="text-base font-semibold text-gray-800 dark:text-gray-100">Filtros</h2>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                    <label class="form-label">Período</label>
                    <select v-model="selectedPeriod" class="form-select w-full">
                        <option value="7">Últimos 7 dias</option>
                        <option value="30">Últimos 30 dias</option>
                        <option value="90">Últimos 90 dias</option>
                        <option value="365">Último ano</option>
                        <option value="custom">Personalizado</option>
                    </select>
                </div>
                <div v-if="selectedPeriod === 'custom'">
                    <label class="form-label">Data início</label>
                    <input v-model="customStartDate" type="date" class="form-input w-full" />
                </div>
                <div v-if="selectedPeriod === 'custom'">
                    <label class="form-label">Data fim</label>
                    <input v-model="customEndDate" type="date" class="form-input w-full" />
                </div>
                <div>
                    <label class="form-label">Granularidade</label>
                    <select v-model="granularity" class="form-select w-full">
                        <option value="day">Diário</option>
                        <option value="week">Semanal</option>
                        <option value="month">Mensal</option>
                    </select>
                </div>
                <div v-if="!isRestrictedPartnerView">
                    <label class="form-label">Gestor</label>
                    <select v-model="selectedManagerId" class="form-select w-full">
                        <option value="">Todos os gestores</option>
                        <option v-for="m in managers" :key="m.id" :value="m.id">{{ m.name }}</option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Loading / Error -->
        <div v-if="loading" class="panel">
            <div class="flex flex-col items-center justify-center py-16 gap-4">
                <span class="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10"></span>
                <span class="text-sm text-gray-600 dark:text-gray-300">
                    {{ loadingProgress || 'A carregar relatórios...' }}
                </span>
            </div>
        </div>

        <div v-else-if="error" class="panel">
            <div class="text-center py-16">
                <p class="text-red-500 text-lg mb-4">Erro ao carregar relatórios</p>
                <p class="text-gray-600 dark:text-gray-400 mb-4">{{ error }}</p>
                <button type="button" class="btn btn-primary" @click="refresh">Tentar novamente</button>
            </div>
        </div>

        <template v-else>
            <p v-if="hasMultipleCurrencies" class="text-sm text-amber-600 dark:text-amber-400 px-1">
                Atenção: existem múltiplas moedas na carteira. Os totais abaixo referem-se à moeda principal ({{ primaryCurrency.currencyCode }}).
            </p>

            <!-- KPI Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                <div class="panel overflow-hidden relative">
                    <div class="absolute inset-y-0 left-0 w-1 bg-primary"></div>
                    <div class="pl-3">
                        <p class="text-xs uppercase tracking-wide text-gray-500">Emprestado</p>
                        <p class="text-xl font-bold text-primary mt-1">{{ fmt(primaryCurrency.disbursed) }}</p>
                    </div>
                </div>
                <div class="panel overflow-hidden relative">
                    <div class="absolute inset-y-0 left-0 w-1 bg-success"></div>
                    <div class="pl-3">
                        <p class="text-xs uppercase tracking-wide text-gray-500">Recuperado</p>
                        <p class="text-xl font-bold text-success mt-1">{{ fmt(primaryCurrency.recovered) }}</p>
                    </div>
                </div>
                <div class="panel overflow-hidden relative">
                    <div class="absolute inset-y-0 left-0 w-1 bg-warning"></div>
                    <div class="pl-3">
                        <p class="text-xs uppercase tracking-wide text-gray-500">Em aberto</p>
                        <p class="text-xl font-bold text-warning mt-1">{{ fmt(primaryCurrency.outstanding) }}</p>
                    </div>
                </div>
                <div class="panel overflow-hidden relative">
                    <div class="absolute inset-y-0 left-0 w-1 bg-info"></div>
                    <div class="pl-3">
                        <p class="text-xs uppercase tracking-wide text-gray-500">Lucro contratado</p>
                        <p class="text-xl font-bold text-info mt-1">{{ fmt(primaryCurrency.contractedProfit) }}</p>
                    </div>
                </div>
                <div class="panel overflow-hidden relative">
                    <div class="absolute inset-y-0 left-0 w-1 bg-secondary"></div>
                    <div class="pl-3">
                        <p class="text-xs uppercase tracking-wide text-gray-500">Lucro realizado</p>
                        <p class="text-xl font-bold mt-1">{{ fmt(primaryCurrency.realizedProfit) }}</p>
                    </div>
                </div>
                <div class="panel overflow-hidden relative">
                    <div class="absolute inset-y-0 left-0 w-1" :class="summary.defaultRate > 5 ? 'bg-danger' : 'bg-success'"></div>
                    <div class="pl-3">
                        <p class="text-xs uppercase tracking-wide text-gray-500">Recuperação / Ativos</p>
                        <p class="text-xl font-bold mt-1">{{ primaryCurrency.recoveryRate.toFixed(1) }}%</p>
                        <p class="text-xs text-gray-500">{{ summary.activeLoans }} ativos</p>
                    </div>
                </div>
            </div>

            <!-- Alertas reais -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div class="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 flex items-center gap-3">
                    <icon-clock class="w-8 h-8 text-amber-600 shrink-0" />
                    <div>
                        <p class="text-2xl font-bold text-amber-700 dark:text-amber-300">{{ alerts.pendingLoans }}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Empréstimos pendentes</p>
                    </div>
                </div>
                <div class="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4 flex items-center gap-3">
                    <icon-info-triangle class="w-8 h-8 text-red-600 shrink-0" />
                    <div>
                        <p class="text-2xl font-bold text-red-700 dark:text-red-300">{{ alerts.overdueInstallments }}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Parcelas em atraso</p>
                        <p v-if="alerts.overdueAmountDue > 0" class="text-xs text-red-600 dark:text-red-400 mt-1">
                            Valor em atraso: {{ fmt(alerts.overdueAmountDue) }}
                        </p>
                    </div>
                </div>
                <div class="rounded-xl border border-rose-200 dark:border-rose-800 bg-rose-50 dark:bg-rose-900/20 p-4 flex items-center gap-3">
                    <icon-dollar-sign class="w-8 h-8 text-rose-600 shrink-0" />
                    <div>
                        <p class="text-2xl font-bold text-rose-700 dark:text-rose-300">{{ fmt(alerts.accumulatedLateInterest) }}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Mora acumulada</p>
                    </div>
                </div>
                <div class="rounded-xl border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-4 flex items-center gap-3">
                    <icon-x-circle class="w-8 h-8 text-orange-600 shrink-0" />
                    <div>
                        <p class="text-2xl font-bold text-orange-700 dark:text-orange-300">{{ alerts.defaultedLoans }}</p>
                        <p class="text-sm text-gray-600 dark:text-gray-400">Empréstimos inadimplentes</p>
                    </div>
                </div>
            </div>

            <!-- Cobranças no período -->
            <div class="panel !p-0 overflow-hidden">
                <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">Cobranças no período</h3>
                        <p class="text-sm text-gray-500 mt-0.5">
                            Parcelas a receber com vencimento no intervalo seleccionado
                        </p>
                    </div>
                    <router-link
                        :to="collectionsLink"
                        class="btn btn-outline-primary btn-sm"
                    >
                        Ver todas em Cobranças
                    </router-link>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 p-5 border-b border-gray-200 dark:border-gray-700">
                    <div>
                        <p class="text-xs uppercase tracking-wide text-gray-500">Total a cobrar</p>
                        <p class="text-xl font-bold text-primary mt-1">{{ fmt(collectionReport.totalDueAmount) }}</p>
                        <p class="text-xs text-gray-500">{{ collectionReport.totalCount }} parcela(s)</p>
                    </div>
                    <div>
                        <p class="text-xs uppercase tracking-wide text-gray-500">Em atraso</p>
                        <p class="text-xl font-bold text-danger mt-1">{{ fmt(collectionReport.overdueAmount) }}</p>
                        <p class="text-xs text-gray-500">{{ collectionReport.overdueCount }} parcela(s)</p>
                    </div>
                    <div>
                        <p class="text-xs uppercase tracking-wide text-gray-500">Em ordem</p>
                        <p class="text-xl font-bold text-success mt-1">{{ fmt(collectionReport.onTimeAmount) }}</p>
                        <p class="text-xs text-gray-500">{{ collectionReport.onTimeCount }} parcela(s)</p>
                    </div>
                    <div>
                        <p class="text-xs uppercase tracking-wide text-gray-500">Mora acumulada</p>
                        <p class="text-xl font-bold text-warning mt-1">{{ fmt(collectionReport.lateInterestTotal) }}</p>
                    </div>
                </div>

                <div v-if="collectionReport.rows.length === 0" class="text-center py-12 text-gray-500">
                    Sem parcelas a cobrar no período
                </div>
                <div v-else class="overflow-x-auto">
                    <table class="table w-full">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Gestor</th>
                                <th>Vencimento</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in collectionReport.rows" :key="row.id">
                                <td class="font-medium">{{ row.clientName }}</td>
                                <td>{{ row.managerName }}</td>
                                <td>{{ formatReportDate(row.dueDate) }}</td>
                                <td class="font-semibold" :class="row.isOverdue ? 'text-danger' : ''">
                                    {{ fmt(row.totalDue, row.currencyCode, row.currencySymbol) }}
                                </td>
                                <td>
                                    <span class="badge" :class="row.isOverdue ? 'badge-outline-danger' : 'badge-outline-success'">
                                        {{ row.isOverdue ? 'Em atraso' : 'Em ordem' }}
                                    </span>
                                </td>
                                <td>
                                    <router-link :to="`/loans/view/${row.loanId}`" class="btn btn-outline-primary btn-sm">
                                        Ver
                                    </router-link>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Gráficos -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div class="panel">
                    <div class="mb-4">
                        <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">Concessões vs Recuperações</h3>
                        <p class="text-sm text-gray-500">Valores no período selecionado — granularidade {{ granularityLabel }}</p>
                    </div>
                    <div v-if="hasChartData" class="chart-wrap">
                        <apexchart height="320" :options="evolutionChartOptions" :series="evolutionSeries" />
                    </div>
                    <div v-else class="text-center py-16 text-gray-500">Sem dados para o período</div>
                </div>

                <div class="panel">
                    <div class="mb-4">
                        <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">Distribuição por Status</h3>
                        <p class="text-sm text-gray-500">{{ summary.totalLoans }} empréstimos no período</p>
                    </div>
                    <div v-if="statusDistribution.series.length > 0" class="chart-wrap">
                        <apexchart height="320" :options="statusChartOptions" :series="statusSeries" />
                    </div>
                    <div v-else class="text-center py-16 text-gray-500">Sem dados de status</div>
                </div>
            </div>

            <!-- Tabela por gestor -->
            <div v-if="!isRestrictedPartnerView" class="panel !p-0 overflow-hidden">
                <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                    <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">Desempenho por Gestor</h3>
                </div>
                <div v-if="managerRows.length === 0" class="text-center py-12 text-gray-500">Sem dados de gestores</div>
                <div v-else class="overflow-x-auto">
                    <table class="table w-full">
                        <thead>
                            <tr>
                                <th>Gestor</th>
                                <th>Empréstimos</th>
                                <th>Emprestado</th>
                                <th>Recuperado</th>
                                <th>Em aberto</th>
                                <th>Lucro contratado</th>
                                <th>Lucro realizado</th>
                                <th>Recuperação</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in managerRows" :key="row.managerId">
                                <td class="font-semibold">{{ row.managerName }}</td>
                                <td>{{ row.loanCount }}</td>
                                <td>{{ fmt(row.disbursed, row.currencyCode) }}</td>
                                <td class="text-success">{{ fmt(row.recovered, row.currencyCode) }}</td>
                                <td class="text-warning">{{ fmt(row.outstanding, row.currencyCode) }}</td>
                                <td>{{ fmt(row.contractedProfit, row.currencyCode) }}</td>
                                <td>{{ fmt(row.realizedProfit, row.currencyCode) }}</td>
                                <td>{{ row.recoveryRate.toFixed(1) }}%</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Tabela por empréstimo -->
            <div class="panel !p-0 overflow-hidden">
                <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                    <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">Detalhe por Empréstimo</h3>
                    <span class="text-sm text-gray-500">{{ loanRows.length }} empréstimos</span>
                </div>
                <div v-if="loanRows.length === 0" class="text-center py-12 text-gray-500">Nenhum empréstimo no período</div>
                <div v-else class="overflow-x-auto">
                    <table class="table w-full">
                        <thead>
                            <tr>
                                <th>Nº</th>
                                <th>Cliente</th>
                                <th>Gestor</th>
                                <th>Emprestado</th>
                                <th>Recuperado</th>
                                <th>Em aberto</th>
                                <th>Lucro contr.</th>
                                <th>Lucro real.</th>
                                <th>Status</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="row in loanRows" :key="row.loanId">
                                <td class="font-semibold text-primary">{{ row.loanNumber }}</td>
                                <td>
                                    <p class="font-medium">{{ row.customerName }}</p>
                                    <p class="text-xs text-gray-500">{{ row.productName }}</p>
                                </td>
                                <td class="text-sm">{{ row.managerName }}</td>
                                <td>{{ fmt(row.disbursed, row.currencyCode, row.currencySymbol) }}</td>
                                <td class="text-success">{{ fmt(row.recovered, row.currencyCode, row.currencySymbol) }}</td>
                                <td class="text-warning">{{ fmt(row.outstanding, row.currencyCode, row.currencySymbol) }}</td>
                                <td>{{ fmt(row.contractedProfit, row.currencyCode, row.currencySymbol) }}</td>
                                <td>{{ fmt(row.realizedProfit, row.currencyCode, row.currencySymbol) }}</td>
                                <td>
                                    <span class="badge badge-outline-primary text-xs">{{ row.status }}</span>
                                </td>
                                <td>
                                    <router-link :to="`/loans/view/${row.loanId}`" class="btn btn-outline-primary btn-sm">
                                        Ver
                                    </router-link>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </div>

            <!-- Top clientes + produtos -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-5">
                <div class="panel !p-0 overflow-hidden">
                    <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                        <h3 class="text-base font-semibold">Top Clientes por Volume</h3>
                        <span class="badge badge-primary">Top 10</span>
                    </div>
                    <div v-if="topClients.length === 0" class="text-center py-12 text-gray-500">Sem clientes</div>
                    <div v-else class="divide-y divide-gray-200 dark:divide-gray-700">
                        <div
                            v-for="client in topClients"
                            :key="client.id"
                            class="px-5 py-3 flex items-center justify-between gap-3"
                        >
                            <div class="flex items-center gap-3 min-w-0">
                                <div class="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                                    <span class="text-xs font-bold text-primary">{{ getInitials(client.name) }}</span>
                                </div>
                                <div class="min-w-0">
                                    <p class="font-semibold text-sm truncate">{{ client.name }}</p>
                                    <p class="text-xs text-gray-500 truncate">{{ client.email || `${client.loanCount} empréstimo(s)` }}</p>
                                </div>
                            </div>
                            <div class="text-right shrink-0">
                                <p class="font-bold text-sm">{{ fmt(client.volume, client.currencyCode) }}</p>
                                <span class="badge text-xs" :class="client.status === 'Em Atraso' ? 'badge-outline-warning' : 'badge-outline-success'">
                                    {{ client.status }}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="panel !p-0 overflow-hidden">
                    <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-base font-semibold">Produtos Mais Utilizados</h3>
                    </div>
                    <div v-if="productRows.length === 0" class="text-center py-12 text-gray-500">Sem produtos</div>
                    <div v-else class="overflow-x-auto">
                        <table class="table w-full">
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th>Qtd</th>
                                    <th>Volume</th>
                                    <th>Recuperado</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="product in productRows" :key="product.id">
                                    <td class="font-semibold">{{ product.name }}</td>
                                    <td>{{ product.quantity }}</td>
                                    <td>{{ fmt(product.volume, product.currencyCode) }}</td>
                                    <td class="text-success">{{ fmt(product.recovered, product.currencyCode) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue';
import { useMeta } from '@/composables/use-meta';
import { useReportsData } from '@/composables/use-reports-data';
import { exportReportsToCsv, formatReportCurrency } from '@/utils/reports.utils';
import PageHeader from '@/components/layout/PageHeader.vue';
import apexchart from 'vue3-apexcharts';
import IconDownload from '@/components/icon/icon-download.vue';
import IconRefresh from '@/components/icon/icon-refresh.vue';
import IconClock from '@/components/icon/icon-clock.vue';
import IconInfoTriangle from '@/components/icon/icon-info-triangle.vue';
import IconXCircle from '@/components/icon/icon-x-circle.vue';
import IconDollarSign from '@/components/icon/icon-dollar-sign.vue';

useMeta({ title: 'Relatórios e Analytics' });

const KREFASY_PURPLE = '#801f82';
const KREFASY_NAVY = '#0e1133';

const {
    loading,
    loadingProgress,
    error,
    selectedPeriod,
    customStartDate,
    customEndDate,
    granularity,
    selectedManagerId,
    summary,
    managerRows,
    loanRows,
    topClients,
    productRows,
    statusDistribution,
    timeSeries,
    alerts,
    collectionReport,
    managers,
    hasMultipleCurrencies,
    primaryCurrency,
    periodRange,
    isRestrictedPartnerView,
    refresh,
    loadReportsData,
} = useReportsData();

const granularityLabel = computed(() => {
    if (granularity.value === 'day') return 'diária';
    if (granularity.value === 'week') return 'semanal';
    return 'mensal';
});

const hasChartData = computed(() =>
    timeSeries.value.disbursements.some((v) => v > 0) ||
    timeSeries.value.recoveries.some((v) => v > 0)
);

const evolutionSeries = computed(() => [
    { name: 'Concessões', data: timeSeries.value.disbursements },
    { name: 'Recuperações', data: timeSeries.value.recoveries },
]);

const evolutionChartOptions = computed(() => ({
    chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit' },
    plotOptions: { bar: { borderRadius: 4, columnWidth: '55%' } },
    colors: [KREFASY_PURPLE, '#22c55e'],
    dataLabels: { enabled: false },
    xaxis: {
        categories: timeSeries.value.categories,
        labels: { rotate: -45, style: { fontSize: '11px', colors: '#94a3b8' } },
    },
    yaxis: {
        labels: {
            formatter: (v: number) => {
                if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
                if (v >= 1_000) return `${(v / 1_000).toFixed(0)}k`;
                return String(Math.round(v));
            },
            style: { colors: '#94a3b8' },
        },
    },
    legend: { position: 'top' },
    grid: { borderColor: '#f1f5f9', strokeDashArray: 4 },
    tooltip: { theme: 'dark' },
}));

const statusSeries = computed(() => statusDistribution.value.series);

const statusChartOptions = computed(() => ({
    chart: { type: 'donut', fontFamily: 'inherit' },
    colors: [KREFASY_PURPLE, KREFASY_NAVY, '#22c55e', '#f59e0b', '#ef4444', '#6366f1'],
    labels: statusDistribution.value.labels,
    legend: { position: 'bottom', fontSize: '12px' },
    plotOptions: {
        pie: {
            donut: {
                size: '65%',
                labels: {
                    show: true,
                    total: { show: true, label: 'Total', fontSize: '13px' },
                },
            },
        },
    },
    tooltip: { theme: 'dark' },
}));

const fmt = (amount: number, code?: string, symbol?: string) =>
    formatReportCurrency(amount, code || primaryCurrency.value.currencyCode, symbol || primaryCurrency.value.currencySymbol);

const collectionsLink = computed(() => {
    const query: Record<string, string> = {
        dueDateFrom: periodRange.value.start.toISOString().slice(0, 10),
        dueDateTo: periodRange.value.end.toISOString().slice(0, 10),
    };
    if (selectedManagerId.value) {
        query.managerId = selectedManagerId.value;
    }
    return { path: '/collections', query };
});

const formatReportDate = (date: string) => {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('pt-BR');
};

const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const handleExport = () => {
    exportReportsToCsv(managerRows.value, loanRows.value);
};

onMounted(() => loadReportsData());
</script>

<style scoped>
.chart-wrap {
    min-height: 320px;
}
</style>
