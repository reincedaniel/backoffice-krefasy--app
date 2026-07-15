<template>
    <div class="dashboard">
        <PageHeader
            title="Visão Geral"
            subtitle="Acompanhe os indicadores e operações do backoffice em tempo real"
            :breadcrumbs="[{ label: 'Dashboard' }, { label: 'Krefasy' }]"
        >
            <template #actions>
                <button class="btn-refresh" :disabled="loading" @click="loadDashboardData">
                    <span class="refresh-icon" :class="{ spinning: loading }">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                        </svg>
                    </span>
                    Atualizar
                </button>
            </template>
        </PageHeader>

        <!-- KPIs -->
        <div class="kpi-grid">
            <div v-for="kpi in kpiCards" :key="kpi.label" class="kpi-card" :class="kpi.accent">
                <div class="kpi-top">
                    <div class="kpi-icon">
                        <component :is="kpi.icon" />
                    </div>
                </div>
                <p class="kpi-label">{{ kpi.label }}</p>
                <p class="kpi-value">
                    <template v-if="loading">
                        <span class="skeleton skeleton-value"></span>
                    </template>
                    <template v-else>{{ kpi.value }}</template>
                </p>
            </div>
        </div>

        <!-- Tabelas -->
        <div class="tables-grid">
            <div class="dash-panel">
                <div class="panel-header">
                    <div>
                        <h2 class="panel-title">Cobranças em Atraso</h2>
                        <p class="panel-subtitle">Parcelas vencidas com total incluindo juros de mora</p>
                    </div>
                    <router-link to="/collections" class="panel-link">Ver todas</router-link>
                </div>

                <div v-if="loading" class="table-skeleton">
                    <div v-for="n in 4" :key="n" class="skeleton skeleton-row"></div>
                </div>
                <div v-else-if="overdueParcels.length === 0" class="empty-state">
                    <icon-check-circle class="empty-icon success" />
                    <p>Nenhuma parcela vencida</p>
                </div>
                <div v-else class="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Total com mora</th>
                                <th>Vencimento</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr v-for="parcel in overdueParcels.slice(0, 5)" :key="parcel.id">
                                <td>
                                    <span class="client-name">{{ parcel.clientName }}</span>
                                </td>
                                <td>
                                    <span class="amount font-semibold">{{ formatParcelAmount(parcel) }}</span>
                                    <p
                                        v-if="parcel.lateInterest && parcel.lateInterest > 0"
                                        class="text-xs text-red-500 dark:text-red-400 mt-0.5"
                                    >
                                        + {{ formatParcelAmount(parcel, parcel.lateInterest) }} mora ({{ parcel.daysOverdue }} dias)
                                    </p>
                                </td>
                                <td><span class="due-date">{{ formatDate(parcel.dueDate) }}</span></td>
                                <td class="text-right">
                                    <button class="btn-action btn-action-warning" @click="viewParcel(parcel.loanId)">Ver</button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div v-if="!loading && dueSoonParcels.length > 0" class="border-t border-gray-200/80 dark:border-gray-700/80 px-4 py-3">
                    <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 mb-2">A vencer esta semana</p>
                    <div class="space-y-2">
                        <div
                            v-for="parcel in dueSoonParcels"
                            :key="`soon-${parcel.id}`"
                            class="flex items-center justify-between gap-3 text-sm"
                        >
                            <span class="truncate">{{ parcel.clientName }}</span>
                            <span class="text-gray-500 shrink-0">{{ formatDate(parcel.dueDate) }}</span>
                            <button class="btn-action shrink-0" @click="viewParcel(parcel.loanId)">Ver</button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Atividade Recente -->
        <div class="dash-panel">
            <div class="panel-header">
                <div>
                    <h2 class="panel-title">Atividade Recente</h2>
                    <p class="panel-subtitle">Parcelas em atraso e a vencer</p>
                </div>
            </div>

            <div v-if="loading" class="table-skeleton">
                <div v-for="n in 3" :key="n" class="skeleton skeleton-row"></div>
            </div>
            <div v-else-if="recentActivity.length === 0" class="empty-state">
                <icon-check-circle class="empty-icon success" />
                <p>Nenhuma atividade recente</p>
            </div>
            <div v-else class="activity-list">
                <div v-for="(activity, index) in recentActivity" :key="activity.id" class="activity-item">
                    <div class="activity-track">
                        <div class="activity-dot" :class="activity.type"></div>
                        <div v-if="index < recentActivity.length - 1" class="activity-line"></div>
                    </div>
                    <div class="activity-icon" :class="activity.type">
                        <component :is="activity.icon" />
                    </div>
                    <div class="activity-content">
                        <p class="activity-title">{{ activity.title }}</p>
                        <p class="activity-desc">{{ activity.description }}</p>
                    </div>
                    <span class="activity-time">{{ formatTimeAgo(activity.timestamp) }}</span>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import PageHeader from '@/components/layout/PageHeader.vue';
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useKrefasyStore } from '@/stores/index';
import { loansService } from '@/services/loans.service';
import {
    fetchAllLoans,
    buildRecentActivity,
    fetchOverdueInstallments,
    type DashboardInstallment,
} from '@/utils/dashboard-charts.utils';
import {
    fetchCollectibleInstallments,
    filterCollectionInstallments,
    formatCollectionAmount,
    toDashboardInstallment,
    type CollectionLoan,
} from '@/utils/collections.utils';
import { usePartnerScope } from '@/composables/use-partner-scope';
import {
    filterLoansForPartner,
    getScopedCustomerIdsFromLoans,
} from '@/utils/partner-scope.utils';
import IconUsers from '@/components/icon/icon-users.vue';
import IconTrendingUp from '@/components/icon/icon-trending-up.vue';
import IconDollarSign from '@/components/icon/icon-dollar-sign.vue';
import IconInfoTriangle from '@/components/icon/icon-info-triangle.vue';
import IconCheckCircle from '@/components/icon/icon-square-check.vue';
import IconAlertCircle from '@/components/icon/icon-info-triangle.vue';

const router = useRouter();
const krefasyStore = useKrefasyStore();
const { isRestrictedPartnerView, loggedUserId } = usePartnerScope();

const loading = ref(false);
const overdueParcels = ref<DashboardInstallment[]>([]);
const dueSoonParcels = ref<DashboardInstallment[]>([]);
const recentActivity = ref<any[]>([]);

const dashboardStats = computed(() => krefasyStore.dashboardStats);

const kpiCards = computed(() => [
    {
        label: 'Total de Clientes',
        value: dashboardStats.value.totalClients.toLocaleString('pt-BR'),
        icon: IconUsers,
        accent: 'accent-purple',
    },
    {
        label: 'Empréstimos Ativos',
        value: dashboardStats.value.activeLoans.toLocaleString('pt-BR'),
        icon: IconTrendingUp,
        accent: 'accent-navy',
    },
    {
        label: 'Valor Total Emprestado',
        value: `R$ ${(dashboardStats.value.totalAmount / 1000000).toFixed(1)}M`,
        icon: IconDollarSign,
        accent: 'accent-gold',
    },
    {
        label: 'Taxa de Inadimplência',
        value: `${dashboardStats.value.defaultRate.toFixed(1)}%`,
        icon: IconInfoTriangle,
        accent: 'accent-danger',
    },
]);

const viewParcel = (loanId: string) => router.push(`/loans/view/${loanId}`);

const formatDate = (date: string) => new Date(date).toLocaleDateString('pt-BR');

const formatParcelAmount = (parcel: DashboardInstallment, value?: number) => {
    const amount = value ?? parcel.totalDue ?? parcel.amount;
    return formatCollectionAmount(amount, parcel.currencyCode, parcel.currencySymbol);
};

const formatTimeAgo = (timestamp: string) => {
    const diffInMinutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / 60000);
    if (diffInMinutes < 60) return `${diffInMinutes}m atrás`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h atrás`;
    return `${Math.floor(diffInMinutes / 1440)}d atrás`;
};

const loadDashboardData = async () => {
    try {
        loading.value = true;

        let allLoans = await fetchAllLoans(loansService);

        if (isRestrictedPartnerView.value) {
            allLoans = filterLoansForPartner(allLoans, loggedUserId.value, 'all');
        }

        await krefasyStore.fetchDashboardStats(allLoans);

        if (isRestrictedPartnerView.value) {
            krefasyStore.dashboardStats.totalClients = getScopedCustomerIdsFromLoans(allLoans).size;
        }

        let overdueResult = { items: [] as DashboardInstallment[], totalCount: 0 };
        try {
            overdueResult = await fetchOverdueInstallments(loansService, allLoans, 20, 5);
        } catch (overdueError) {
            console.error('Erro ao buscar parcelas vencidas:', overdueError);
        }

        overdueParcels.value = overdueResult.items;
        krefasyStore.setDashboardOverdueParcels(
            overdueResult.totalCount > 0
                ? overdueResult.totalCount
                : krefasyStore.dashboardStats.overdueParcels
        );

        try {
            const collectible = await fetchCollectibleInstallments(
                loansService,
                allLoans as CollectionLoan[],
                { maxLoans: 30 }
            );

            dueSoonParcels.value = filterCollectionInstallments(collectible, { dueFilter: 'due_soon' })
                .slice(0, 3)
                .map(toDashboardInstallment);
        } catch (collectionsError) {
            console.error('Erro ao buscar cobranças:', collectionsError);
        }

        recentActivity.value = buildRecentActivity(
            [],
            overdueParcels.value,
            { pending: IconCheckCircle, overdue: IconAlertCircle }
        );
    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
        loading.value = false;
    }
};

onMounted(() => loadDashboardData());
</script>

<style scoped>
.btn-refresh {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border: 1.5px solid var(--krefasy-border);
    border-radius: 10px;
    background: var(--krefasy-surface);
    color: var(--krefasy-text);
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    flex-shrink: 0;
}

.btn-refresh:hover:not(:disabled) {
    border-color: var(--krefasy-purple);
    color: var(--krefasy-purple);
    background: var(--krefasy-purple-light);
}

.btn-refresh:disabled {
    opacity: 0.6;
    cursor: not-allowed;
}

.refresh-icon svg {
    width: 16px;
    height: 16px;
}

.refresh-icon.spinning svg {
    animation: spin 0.8s linear infinite;
}

/* ── KPI Cards ── */
.kpi-grid {
    display: grid;
    grid-template-columns: repeat(1, 1fr);
    gap: 20px;
    margin-bottom: 24px;
}

@media (min-width: 640px) {
    .kpi-grid { grid-template-columns: repeat(2, 1fr); }
}

@media (min-width: 1280px) {
    .kpi-grid { grid-template-columns: repeat(4, 1fr); }
}

.kpi-card {
    background: var(--krefasy-surface);
    border: 1px solid var(--krefasy-border);
    border-radius: 16px;
    padding: 22px 24px;
    position: relative;
    overflow: hidden;
    transition: box-shadow 0.2s, transform 0.2s;
}

.kpi-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
}

.kpi-card.accent-purple::before { background: linear-gradient(90deg, var(--krefasy-purple), #a832aa); }
.kpi-card.accent-navy::before { background: linear-gradient(90deg, var(--krefasy-navy), #1e2a5e); }
.kpi-card.accent-gold::before { background: linear-gradient(90deg, #d97706, #f59e0b); }
.kpi-card.accent-danger::before { background: linear-gradient(90deg, #dc2626, #ef4444); }

.kpi-card:hover {
    box-shadow: 0 8px 24px rgba(14, 17, 51, 0.06);
    transform: translateY(-1px);
}

.kpi-top {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
}

.kpi-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: grid;
    place-content: center;
}

.kpi-icon :deep(svg) {
    width: 22px;
    height: 22px;
}

.accent-purple .kpi-icon { background: rgba(128, 31, 130, 0.1); color: var(--krefasy-purple); }
.accent-navy .kpi-icon { background: rgba(14, 17, 51, 0.08); color: var(--krefasy-navy); }
.accent-gold .kpi-icon { background: rgba(217, 119, 6, 0.1); color: #d97706; }
.accent-danger .kpi-icon { background: rgba(220, 38, 38, 0.1); color: #dc2626; }

.kpi-trend {
    font-size: 12px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 20px;
}

.trend-up { background: #ecfdf5; color: #059669; }
.trend-down { background: #ecfdf5; color: #059669; }

.kpi-label {
    font-size: 13px;
    font-weight: 500;
    color: var(--krefasy-text-muted);
    margin: 0 0 4px;
}

.kpi-value {
    font-size: 28px;
    font-weight: 700;
    color: var(--krefasy-text);
    margin: 0;
    letter-spacing: -0.02em;
    line-height: 1.2;
}

.kpi-period {
    font-size: 12px;
    color: #94a3b8;
    margin: 6px 0 0;
}

/* ── Panels ── */
.tables-grid {
    display: grid;
    gap: 20px;
    margin-bottom: 24px;
}

.dash-panel {
    background: var(--krefasy-surface);
    border: 1px solid var(--krefasy-border);
    border-radius: 16px;
    padding: 24px;
}

.panel-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 20px;
}

.panel-title {
    font-size: 16px;
    font-weight: 700;
    color: var(--krefasy-text);
    margin: 0 0 2px;
}

.panel-subtitle {
    font-size: 13px;
    color: var(--krefasy-text-muted);
    margin: 0;
}

.panel-link {
    font-size: 13px;
    font-weight: 600;
    color: var(--krefasy-purple);
    text-decoration: none;
    white-space: nowrap;
    transition: opacity 0.2s;
}

.panel-link:hover {
    opacity: 0.75;
    text-decoration: underline;
}

.panel-menu-btn {
    display: grid;
    place-content: center;
    width: 32px;
    height: 32px;
    border: none;
    background: var(--krefasy-surface-muted);
    border-radius: 8px;
    color: var(--krefasy-text-muted);
    cursor: pointer;
    transition: all 0.2s;
}

.panel-menu-btn:hover {
    background: var(--krefasy-purple-light);
    color: var(--krefasy-purple);
}

.panel-menu-btn :deep(svg) {
    width: 18px;
    height: 18px;
}

/* ── Tables ── */
.table-wrap {
    overflow-x: auto;
    margin: 0 -8px;
}

table {
    width: 100%;
    border-collapse: collapse;
    font-size: 14px;
}

thead th {
    text-align: left;
    padding: 10px 12px;
    font-size: 12px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: var(--krefasy-text-muted);
    border-bottom: 1px solid var(--krefasy-border);
}

tbody td {
    padding: 14px 12px;
    border-bottom: 1px solid #f1f5f9;
    vertical-align: middle;
}

tbody tr:last-child td {
    border-bottom: none;
}

tbody tr {
    transition: background 0.15s;
}

tbody tr:hover {
    background: var(--krefasy-surface-muted);
}

.client-name {
    font-weight: 600;
    color: var(--krefasy-text);
}

.amount {
    font-weight: 600;
    color: var(--krefasy-navy);
}

.due-date {
    color: #dc2626;
    font-weight: 500;
    font-size: 13px;
}

.text-right {
    text-align: right;
}

.badge {
    display: inline-block;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 20px;
    letter-spacing: 0.02em;
}

.badge-pending {
    background: #fff7ed;
    color: #c2410c;
}

.btn-action {
    padding: 6px 14px;
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    background: var(--krefasy-purple);
    color: white;
    transition: all 0.2s;
}

.btn-action:hover {
    background: #6a1a6c;
    transform: translateY(-1px);
}

.btn-action-warning {
    background: #d97706;
}

.btn-action-warning:hover {
    background: #b45309;
}

.empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: var(--krefasy-text-muted);
    font-size: 14px;
}

.empty-icon {
    width: 40px;
    height: 40px;
    margin-bottom: 12px;
    opacity: 0.5;
}

.empty-icon.success {
    color: #059669;
    opacity: 0.7;
}

/* ── Activity ── */
.activity-list {
    display: flex;
    flex-direction: column;
    gap: 0;
}

.activity-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px 0;
    position: relative;
}

.activity-item + .activity-item {
    border-top: 1px solid #f1f5f9;
}

.activity-track {
    display: none;
}

.activity-icon {
    width: 40px;
    height: 40px;
    border-radius: 12px;
    display: grid;
    place-content: center;
    flex-shrink: 0;
}

.activity-icon :deep(svg) {
    width: 18px;
    height: 18px;
}

.activity-icon.success { background: #ecfdf5; color: #059669; }
.activity-icon.purple { background: rgba(128, 31, 130, 0.1); color: var(--krefasy-purple); }
.activity-icon.warning { background: #fff7ed; color: #d97706; }

.activity-content {
    flex: 1;
    min-width: 0;
}

.activity-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--krefasy-text);
    margin: 0 0 2px;
}

.activity-desc {
    font-size: 13px;
    color: var(--krefasy-text-muted);
    margin: 0;
    line-height: 1.4;
}

.activity-time {
    font-size: 12px;
    color: #94a3b8;
    white-space: nowrap;
    flex-shrink: 0;
    padding-top: 2px;
}

/* ── Skeleton / Loading ── */
.skeleton {
    display: block;
    background: linear-gradient(90deg, #f1f5f9 25%, #e2e8f0 50%, #f1f5f9 75%);
    background-size: 200% 100%;
    animation: shimmer 1.5s infinite;
    border-radius: 8px;
}

.skeleton-value {
    width: 80px;
    height: 32px;
}

.skeleton-row {
    height: 48px;
    margin-bottom: 8px;
}

.table-skeleton {
    padding: 8px 0;
}

.spinner {
    width: 24px;
    height: 24px;
    border: 2.5px solid #e2e8f0;
    border-top-color: var(--krefasy-purple);
    border-radius: 50%;
    animation: spin 0.7s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

@keyframes shimmer {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* ── Dark mode ── */
:global(.dark) .kpi-card:hover {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
}

:global(.dark) .accent-navy .kpi-icon {
    background: rgba(255, 255, 255, 0.06);
    color: #e2e8f0;
}

:global(.dark) .amount {
    color: #e2e8f0;
}

:global(.dark) tbody td {
    border-bottom-color: #1e293b;
}

:global(.dark) tbody tr:hover {
    background: rgba(255, 255, 255, 0.03);
}

:global(.dark) .activity-item + .activity-item {
    border-top-color: #1e293b;
}

:global(.dark) .trend-up,
:global(.dark) .trend-down {
    background: rgba(5, 150, 105, 0.15);
}

:global(.dark) .badge-pending {
    background: rgba(194, 65, 12, 0.15);
    color: #fb923c;
}

/* ── Responsive ── */
@media (max-width: 640px) {
    .kpi-value {
        font-size: 24px;
    }

    .activity-time {
        display: none;
    }

    .dash-panel {
        padding: 18px;
    }
}
</style>
