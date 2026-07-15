<template>
    <div class="space-y-5">
        <PageHeader
            title="Cobranças"
            subtitle="Parcelas a receber — em ordem e em atraso, com juros de mora"
            :breadcrumbs="[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Cobranças' }]"
        >
            <template #actions>
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

        <div v-if="loading" class="panel flex flex-col items-center justify-center py-24 gap-3">
            <span class="animate-spin border-4 border-primary border-l-transparent rounded-full w-12 h-12"></span>
            <p class="text-sm text-gray-600 dark:text-gray-300">
                {{ loadingProgress || 'A carregar cobranças...' }}
            </p>
        </div>

        <div v-else-if="error" class="panel text-center py-16">
            <p class="text-red-500 text-lg mb-4">Erro ao carregar cobranças</p>
            <p class="text-gray-600 dark:text-gray-400 mb-4">{{ error }}</p>
            <button type="button" class="btn btn-primary" @click="refresh">Tentar novamente</button>
        </div>

        <template v-else>
            <!-- KPIs -->
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div class="panel overflow-hidden relative">
                    <div class="absolute inset-y-0 left-0 w-1 bg-primary"></div>
                    <div class="pl-3">
                        <p class="text-xs uppercase tracking-wide text-gray-500">Total a cobrar</p>
                        <p class="text-2xl font-bold text-primary mt-1">{{ fmtPrimary(summary.totalDueAmount, summary.totalCount) }}</p>
                        <p class="text-xs text-gray-500 mt-1">{{ summary.totalCount }} parcela(s)</p>
                    </div>
                </div>
                <div class="panel overflow-hidden relative">
                    <div class="absolute inset-y-0 left-0 w-1 bg-danger"></div>
                    <div class="pl-3">
                        <p class="text-xs uppercase tracking-wide text-gray-500">Em atraso</p>
                        <p class="text-2xl font-bold text-danger mt-1">{{ fmtPrimary(summary.overdueAmount, summary.overdueCount) }}</p>
                        <p class="text-xs text-gray-500 mt-1">{{ summary.overdueCount }} parcela(s)</p>
                    </div>
                </div>
                <div class="panel overflow-hidden relative">
                    <div class="absolute inset-y-0 left-0 w-1 bg-success"></div>
                    <div class="pl-3">
                        <p class="text-xs uppercase tracking-wide text-gray-500">Em ordem</p>
                        <p class="text-2xl font-bold text-success mt-1">{{ fmtPrimary(summary.onTimeAmount, summary.onTimeCount) }}</p>
                        <p class="text-xs text-gray-500 mt-1">{{ summary.onTimeCount }} parcela(s)</p>
                    </div>
                </div>
                <div class="panel overflow-hidden relative">
                    <div class="absolute inset-y-0 left-0 w-1 bg-warning"></div>
                    <div class="pl-3">
                        <p class="text-xs uppercase tracking-wide text-gray-500">Mora acumulada</p>
                        <p class="text-2xl font-bold text-warning mt-1">{{ fmtPrimary(summary.lateInterestTotal, summary.overdueCount) }}</p>
                        <p class="text-xs text-gray-500 mt-1">{{ summary.dueSoonCount }} a vencer (7 dias)</p>
                    </div>
                </div>
            </div>

            <!-- Filtros -->
            <div class="panel">
                <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                    <h2 class="text-base font-semibold text-gray-800 dark:text-gray-100">Filtros</h2>
                    <button
                        v-if="hasActiveFilters"
                        type="button"
                        class="btn btn-outline-secondary btn-sm gap-1"
                        @click="resetFilters"
                    >
                        <icon-x class="w-4 h-4" />
                        Limpar
                    </button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-4">
                    <div>
                        <label class="form-label">{{ isRestrictedPartnerView ? 'Âmbito' : 'Gestor' }}</label>
                        <select
                            v-if="isRestrictedPartnerView"
                            v-model="partnerManagerFilter"
                            class="form-select w-full"
                            @change="onPartnerScopeChange"
                        >
                            <option v-for="opt in partnerScopeOptions" :key="opt.value" :value="opt.value">
                                {{ opt.label }}
                            </option>
                        </select>
                        <select
                            v-else
                            v-model="filters.managerId"
                            class="form-select w-full"
                            @change="currentPage = 1"
                        >
                            <option v-for="opt in managerOptions" :key="opt.value || 'all'" :value="opt.value">
                                {{ opt.label }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Moeda</label>
                        <select v-model="filters.currencyCode" class="form-select w-full" @change="currentPage = 1">
                            <option value="">Todas</option>
                            <option v-for="c in currencies" :key="c.code" :value="c.code">
                                {{ c.code }}{{ c.symbol ? ` (${c.symbol})` : '' }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Vencimento de</label>
                        <input v-model="filters.dueDateFrom" type="date" class="form-input w-full" @change="currentPage = 1" />
                    </div>
                    <div>
                        <label class="form-label">Vencimento até</label>
                        <input v-model="filters.dueDateTo" type="date" class="form-input w-full" @change="currentPage = 1" />
                    </div>
                    <div>
                        <label class="form-label">Estado</label>
                        <select v-model="filters.dueFilter" class="form-select w-full" @change="currentPage = 1">
                            <option value="all">Todas</option>
                            <option value="overdue">Em atraso</option>
                            <option value="on_time">Em ordem</option>
                            <option value="due_soon">A vencer (7 dias)</option>
                        </select>
                    </div>
                    <div>
                        <label class="form-label">Cliente</label>
                        <input
                            v-model="filters.search"
                            type="text"
                            class="form-input w-full"
                            placeholder="Nome do cliente..."
                            @input="debounceSearch"
                        />
                    </div>
                </div>
            </div>

            <!-- Tabela -->
            <div class="panel !p-0 overflow-hidden">
                <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3">
                    <div>
                        <h3 class="text-base font-semibold text-gray-800 dark:text-gray-100">Parcelas a cobrar</h3>
                        <p v-if="paginationSummary" class="text-sm text-gray-500 mt-0.5">{{ paginationSummary }}</p>
                    </div>
                </div>

                <div v-if="filteredItems.length === 0" class="text-center py-16 text-gray-500">
                    Nenhuma parcela encontrada com os filtros seleccionados.
                </div>

                <div v-else class="overflow-x-auto">
                    <table class="table w-full">
                        <thead>
                            <tr>
                                <th>Cliente</th>
                                <th>Gestor</th>
                                <th>Parcela</th>
                                <th>Vencimento</th>
                                <th>Valor</th>
                                <th>Mora</th>
                                <th>Total</th>
                                <th>Estado</th>
                                <th></th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="item in paginatedItems"
                                :key="item.id"
                                :class="item.isOverdue ? 'border-l-4 border-l-danger bg-red-50/30 dark:bg-red-900/10' : ''"
                            >
                                <td class="font-medium">{{ item.clientName }}</td>
                                <td class="text-sm">{{ item.managerName || '—' }}</td>
                                <td>
                                    <span v-if="item.installmentNumber">#{{ item.installmentNumber }}</span>
                                    <span v-else class="text-white-dark">—</span>
                                </td>
                                <td>{{ formatDate(item.dueDate) }}</td>
                                <td>{{ fmt(item.amount, item.currencyCode, item.currencySymbol) }}</td>
                                <td>
                                    <span v-if="item.lateInterest > 0" class="text-danger font-medium">
                                        + {{ fmt(item.lateInterest, item.currencyCode, item.currencySymbol) }}
                                    </span>
                                    <span v-else class="text-white-dark">—</span>
                                </td>
                                <td class="font-bold" :class="item.isOverdue ? 'text-danger' : ''">
                                    {{ fmt(item.totalDue, item.currencyCode, item.currencySymbol) }}
                                </td>
                                <td>
                                    <span
                                        class="badge"
                                        :class="statusBadgeClass(item)"
                                    >
                                        {{ statusLabel(item) }}
                                    </span>
                                </td>
                                <td>
                                    <div class="flex flex-wrap items-center gap-1">
                                        <router-link
                                            :to="`/loans/view/${item.loanId}`"
                                            class="btn btn-outline-primary btn-sm"
                                        >
                                            Abrir
                                        </router-link>
                                        <button
                                            type="button"
                                            class="btn btn-outline-secondary btn-sm gap-1"
                                            :disabled="collectionChatLoading"
                                            title="Contactar no chat"
                                            @click="handleCollectionChat(item)"
                                        >
                                            <icon-menu-chat class="w-4 h-4" />
                                            Chat
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div
                    v-if="totalPages > 1"
                    class="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex flex-wrap items-center justify-between gap-3"
                >
                    <p class="text-sm text-gray-500">{{ paginationSummary }}</p>
                    <div class="flex items-center gap-2">
                        <button
                            type="button"
                            class="btn btn-outline-primary btn-sm"
                            :disabled="currentPage <= 1"
                            @click="currentPage -= 1"
                        >
                            Anterior
                        </button>
                        <span class="text-sm text-gray-600 dark:text-gray-300">
                            Página {{ currentPage }} / {{ totalPages }}
                        </span>
                        <button
                            type="button"
                            class="btn btn-outline-primary btn-sm"
                            :disabled="currentPage >= totalPages"
                            @click="currentPage += 1"
                        >
                            Seguinte
                        </button>
                    </div>
                </div>
            </div>
        </template>
    </div>
</template>

<script lang="ts" setup>
import { onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { useMeta } from '@/composables/use-meta';
import PageHeader from '@/components/layout/PageHeader.vue';
import IconRefresh from '@/components/icon/icon-refresh.vue';
import IconX from '@/components/icon/icon-x.vue';
import IconMenuChat from '@/components/icon/menu/icon-menu-chat.vue';
import { useCollectionsData } from '@/composables/use-collections-data';
import { useCollectionChat } from '@/composables/use-collection-chat';
import {
    formatCollectionAmount,
    type CollectionInstallment,
} from '@/utils/collections.utils';
import type { CollectionChatContext } from '@/utils/collection-chat.utils';

useMeta({ title: 'Cobranças' });

const route = useRoute();

const {
    loading,
    loadingProgress,
    error,
    filters,
    filteredItems,
    paginatedItems,
    summary,
    currencies,
    managerOptions,
    partnerScopeOptions,
    partnerManagerFilter,
    isRestrictedPartnerView,
    currentPage,
    totalPages,
    paginationSummary,
    hasActiveFilters,
    applyFiltersFromQuery,
    resetFilters,
    loadCollectionsData,
    refresh,
} = useCollectionsData();

const { loading: collectionChatLoading, openCollectionChat } = useCollectionChat();

let searchTimeout: ReturnType<typeof setTimeout>;

const primaryCurrency = () => summary.value.byCurrency[0] ?? null;

function fmt(amount: number, code?: string | null, symbol?: string | null) {
    return formatCollectionAmount(amount, code, symbol);
}

function onPartnerScopeChange() {
    filters.value.managerId = '';
    currentPage.value = 1;
}

function fmtPrimary(amount: number, parcelCount?: number) {
    if (parcelCount === 0) return '—';
    const primary = primaryCurrency();
    if (summary.value.byCurrency.length > 1) return 'Várias moedas';
    if (!primary) return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    return fmt(amount, primary.currencyCode, primary.currencySymbol);
}

function formatDate(date: string) {
    return new Date(date).toLocaleDateString('pt-BR');
}

function statusLabel(item: CollectionInstallment) {
    if (item.isOverdue) return `Atraso (${item.daysOverdue}d)`;
    if (item.collectionStatus === 'due_soon') return 'A vencer';
    return 'Em ordem';
}

function statusBadgeClass(item: CollectionInstallment) {
    if (item.isOverdue) return 'badge-outline-danger';
    if (item.collectionStatus === 'due_soon') return 'badge-outline-warning';
    return 'badge-outline-success';
}

function debounceSearch() {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage.value = 1;
    }, 300);
}

function toCollectionChatContext(item: CollectionInstallment): CollectionChatContext {
    return {
        clientId: item.clientId || '',
        clientName: item.clientName,
        loanId: item.loanId,
        loanNumber: item.loanNumber,
        installmentNumber: item.installmentNumber,
        dueDate: item.dueDate,
        amount: item.amount,
        lateInterest: item.lateInterest,
        totalDue: item.totalDue,
        daysOverdue: item.daysOverdue,
        isOverdue: item.isOverdue,
        collectionStatus: item.collectionStatus,
        currencyCode: item.currencyCode,
        currencySymbol: item.currencySymbol,
    };
}

function handleCollectionChat(item: CollectionInstallment) {
    void openCollectionChat(toCollectionChatContext(item));
}

onMounted(async () => {
    applyFiltersFromQuery(route.query as Record<string, unknown>);
    await loadCollectionsData();
});
</script>
