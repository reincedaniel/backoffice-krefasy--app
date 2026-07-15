<template>
    <div class="space-y-5">
        <PageHeader
            title="Empréstimos"
            subtitle="Gerencie a carteira de crédito e acompanhe o status dos empréstimos"
            :breadcrumbs="[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Empréstimos' }]"
        />

        <!-- Loading inicial -->
        <div v-if="initialLoading" class="panel flex flex-col items-center justify-center py-24">
            <span class="animate-spin border-4 border-primary border-l-transparent rounded-full w-12 h-12"></span>
            <p class="mt-4 text-sm text-gray-600 dark:text-gray-300">Carregando empréstimos...</p>
        </div>

        <template v-else>
        <!-- Estatísticas -->
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div class="panel overflow-hidden relative">
                <div class="absolute inset-y-0 left-0 w-1 bg-primary"></div>
                <div class="flex items-center justify-between pl-3">
                    <div>
                        <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total</p>
                        <p class="text-3xl font-bold text-primary mt-1">{{ totalLoans }}</p>
                    </div>
                    <div class="p-3 rounded-xl bg-primary/10">
                        <icon-file class="w-6 h-6 text-primary" />
                    </div>
                </div>
            </div>

            <div class="panel overflow-hidden relative">
                <div class="absolute inset-y-0 left-0 w-1 bg-warning"></div>
                <div class="flex items-center justify-between pl-3">
                    <div>
                        <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Nesta página — Pendentes</p>
                        <p class="text-3xl font-bold text-warning mt-1">{{ pendingCount }}</p>
                    </div>
                    <div class="p-3 rounded-xl bg-warning/10">
                        <icon-clock class="w-6 h-6 text-warning" />
                    </div>
                </div>
            </div>

            <div class="panel overflow-hidden relative">
                <div class="absolute inset-y-0 left-0 w-1 bg-success"></div>
                <div class="flex items-center justify-between pl-3">
                    <div>
                        <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Nesta página — Aprovados</p>
                        <p class="text-3xl font-bold text-success mt-1">{{ approvedCount }}</p>
                    </div>
                    <div class="p-3 rounded-xl bg-success/10">
                        <icon-square-check class="w-6 h-6 text-success" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Filtros -->
        <div class="panel">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <h2 class="text-base font-semibold text-gray-800 dark:text-gray-100">Filtros e pesquisa</h2>
                <button
                    v-if="hasActiveFilters || searchQuery"
                    @click="clearFilters"
                    type="button"
                    class="btn btn-outline-secondary btn-sm gap-1"
                >
                    <icon-x class="w-4 h-4" />
                    Limpar
                </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
                <div>
                    <label class="form-label">Status</label>
                    <select v-model="filters.status" @change="applyFilters" class="form-select w-full">
                        <option value="">Todos os Status</option>
                        <option v-for="status in activeLoanStatuses" :key="status.id" :value="status.id">
                            {{ status.name }}
                        </option>
                    </select>
                </div>
                <div>
                    <label class="form-label">Produto</label>
                    <select v-model="filters.product" @change="applyFilters" class="form-select w-full">
                        <option value="">Todos os Produtos</option>
                        <option v-for="product in loanProducts" :key="product.id" :value="product.id">
                            {{ product.name }}
                        </option>
                    </select>
                </div>
                <div>
                    <label class="form-label">Moeda</label>
                    <select v-model="filters.currency" @change="applyFilters" class="form-select w-full">
                        <option value="">Todas as Moedas</option>
                        <option v-for="currency in activeCurrencies" :key="currency.id" :value="currency.id">
                            {{ currency.code }} — {{ currency.name }}
                        </option>
                    </select>
                </div>
                <div v-if="!isRestrictedPartnerView">
                    <label class="form-label">Gestores</label>
                    <select v-model="filters.managerId" @change="applyFilters" class="form-select w-full" aria-label="Gestores">
                        <option v-for="opt in managerOptions" :key="opt.value || 'all'" :value="opt.value">
                            {{ opt.label }}
                        </option>
                    </select>
                </div>
                <div v-else>
                    <label class="form-label">Âmbito</label>
                    <select v-model="partnerManagerFilter" @change="applyFilters" class="form-select w-full" aria-label="Âmbito partner">
                        <option v-for="opt in partnerScopeOptions" :key="opt.value" :value="opt.value">
                            {{ opt.label }}
                        </option>
                    </select>
                </div>
            </div>

            <div class="mb-4">
                <label class="form-label">Buscar</label>
                <input
                    v-model="searchQuery"
                    @input="debounceSearch"
                    type="text"
                    class="form-input w-full"
                    placeholder="Número do empréstimo, cliente, email..."
                />
            </div>

            <div class="flex flex-wrap gap-2">
                <button v-if="isRestrictedPartnerView" @click="setPartnerScope('mine')" type="button" class="btn btn-info btn-sm gap-2">
                    <icon-star class="w-4 h-4" />
                    Meus Empréstimos
                </button>
                <button v-if="!isRestrictedPartnerView" @click="filterMyClients" type="button" class="btn btn-info btn-sm gap-2">
                    <icon-star class="w-4 h-4" />
                    Meus Empréstimos
                </button>
                <button @click="listPendingLoans" type="button" class="btn btn-warning btn-sm gap-2">
                    <icon-clock class="w-4 h-4" />
                    Listar Pendentes
                </button>
                <button v-if="!isRestrictedPartnerView" @click="listAllLoans" type="button" class="btn btn-outline-primary btn-sm gap-2">
                    <icon-file class="w-4 h-4" />
                    Ver TODOS
                </button>
            </div>
        </div>

        <!-- Lista -->
        <div class="panel !p-0 overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 class="text-base font-semibold text-gray-800 dark:text-gray-100">Empréstimos</h2>
                    <p v-if="totalLoans > 0" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {{ paginationSummary }}
                    </p>
                </div>
                <div class="flex items-center gap-2">
                    <label class="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Por página:</label>
                    <select v-model.number="pageSize" @change="changePageSize" class="form-select form-select-sm w-auto">
                        <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
                    </select>
                </div>
            </div>

            <div v-if="loading" class="flex items-center justify-center py-16">
                <div class="flex flex-col items-center gap-4">
                    <span class="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10"></span>
                    <span class="text-sm text-gray-600 dark:text-gray-300">Carregando empréstimos...</span>
                </div>
            </div>

            <div v-else-if="loans.length > 0" class="divide-y divide-gray-200 dark:divide-gray-700">
                <article
                    v-for="loan in loans"
                    :key="loan.id"
                    class="p-5 hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors"
                    :class="getStatusBorderClass(loan.loanStatusName)"
                >
                    <div class="flex flex-col xl:flex-row xl:items-start gap-5">
                        <div class="flex-1 min-w-0 space-y-4">
                            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div>
                                    <div class="flex items-center gap-2 flex-wrap">
                                        <h3 class="text-lg font-bold text-primary">{{ loan.loanNumber }}</h3>
                                        <span class="badge" :class="getStatusBadgeClass(loan.loanStatusName)">
                                            {{ loan.loanStatusName }}
                                        </span>
                                    </div>
                                    <p class="text-sm font-medium text-gray-800 dark:text-gray-200 mt-1">{{ loan.customerName }}</p>
                                    <p class="text-xs text-gray-500">{{ loan.customerEmail }}</p>
                                </div>
                                <div class="text-left sm:text-right shrink-0">
                                    <p class="text-xs text-gray-500">Valor solicitado</p>
                                    <p class="text-xl font-bold text-gray-900 dark:text-white">
                                        {{ formatCurrency(loan.requestedAmount, loan.currencySymbol, loan.currencyCode) }}
                                    </p>
                                    <p class="text-xs text-gray-500 mt-1">Criado em {{ formatDate(loan.createdAt) }}</p>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div class="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                                    <p class="text-xs text-gray-500">Produto</p>
                                    <p class="text-sm font-semibold truncate">{{ loan.loanProductName }}</p>
                                </div>
                                <div class="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                                    <p class="text-xs text-gray-500">Aprovado</p>
                                    <p class="text-sm font-semibold">
                                        {{ loan.approvedAmount > 0 ? formatCurrency(loan.approvedAmount, loan.currencySymbol, loan.currencyCode) : '—' }}
                                    </p>
                                </div>
                                <div class="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                                    <p class="text-xs text-gray-500">Parcelas</p>
                                    <p class="text-sm font-semibold">
                                        {{ loan.numberOfInstallments }}× {{ formatCurrency(loan.monthlyPayment || 0, loan.currencySymbol, loan.currencyCode) }}
                                    </p>
                                </div>
                                <div class="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                                    <p class="text-xs text-gray-500">Juros / Período</p>
                                    <p class="text-sm font-semibold">{{ loan.interestRate }}% · {{ loan.interestPeriodName }}</p>
                                </div>
                            </div>

                            <p v-if="loan.managerName" class="text-xs text-gray-500">
                                Gestor: <span class="font-medium text-gray-700 dark:text-gray-300">{{ loan.managerName }}</span>
                            </p>
                        </div>

                        <div class="flex flex-row xl:flex-col gap-2 xl:min-w-[140px] shrink-0">
                            <router-link :to="`/loans/view/${loan.id}`" class="btn btn-primary btn-sm gap-2 flex-1 xl:flex-none justify-center">
                                <icon-eye class="w-4 h-4" />
                                Ver Detalhes
                            </router-link>
                            <router-link
                                v-if="canApproveLoan(loan)"
                                :to="`/loans/view/${loan.id}`"
                                class="btn btn-outline-success btn-sm gap-2 flex-1 xl:flex-none justify-center"
                            >
                                <icon-square-check class="w-4 h-4" />
                                Aprovar
                            </router-link>
                            <button
                                v-if="canRejectLoan(loan)"
                                @click="quickReject(loan)"
                                class="btn btn-outline-danger btn-sm gap-2 flex-1 xl:flex-none justify-center"
                            >
                                <icon-x-circle class="w-4 h-4" />
                                Rejeitar
                            </button>
                            <span
                                v-if="!canApproveLoan(loan) && !canRejectLoan(loan)"
                                class="text-xs text-gray-500 text-center py-2"
                            >
                                {{ getActionButtonText(loan) }}
                            </span>
                        </div>
                    </div>
                </article>
            </div>

            <div v-else class="text-center py-16 px-5">
                <icon-file class="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Nenhum empréstimo encontrado</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ searchQuery || hasActiveFilters ? 'Tente ajustar os filtros de busca.' : 'Não há empréstimos para exibir.' }}
                </p>
            </div>

            <!-- Paginação -->
            <div
                v-if="totalLoans > 0"
                class="px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20"
            >
                <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p class="text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
                        Página <strong>{{ currentPage }}</strong> de <strong>{{ totalPages }}</strong>
                        · {{ paginationSummary }}
                    </p>

                    <div class="flex items-center gap-1 order-1 sm:order-2">
                        <button
                            @click="changePage(1)"
                            :disabled="currentPage === 1"
                            class="btn btn-outline-secondary btn-sm px-2"
                            title="Primeira página"
                        >
                            «
                        </button>
                        <button
                            @click="changePage(currentPage - 1)"
                            :disabled="currentPage === 1"
                            class="btn btn-outline-secondary btn-sm gap-1"
                        >
                            <icon-arrow-left class="w-4 h-4" />
                            Anterior
                        </button>

                        <button
                            v-for="page in visiblePages"
                            :key="page"
                            @click="changePage(page)"
                            :class="[
                                'btn btn-sm min-w-[2.25rem]',
                                page === currentPage ? 'btn-primary' : 'btn-outline-secondary'
                            ]"
                        >
                            {{ page }}
                        </button>

                        <button
                            @click="changePage(currentPage + 1)"
                            :disabled="currentPage >= totalPages"
                            class="btn btn-outline-secondary btn-sm gap-1"
                        >
                            Próximo
                            <icon-arrow-forward class="w-4 h-4" />
                        </button>
                        <button
                            @click="changePage(totalPages)"
                            :disabled="currentPage >= totalPages"
                            class="btn btn-outline-secondary btn-sm px-2"
                            title="Última página"
                        >
                            »
                        </button>
                    </div>
                </div>
            </div>
        </div>
        </template>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMeta } from '@/composables/use-meta';
import { useKrefasyStore } from '@/stores/index';
import userService from '@/services/users.service';
import loansService from '@/services/loans.service';
import authService from '@/services/auth.service';
import { loanProductService } from '@/services/loan-products.service';
import { currencyService } from '@/services/currencies.service';
import Swal from 'sweetalert2';
import { useLoanDecisionDialogs } from '@/composables/use-loan-decision-dialogs';
import { usePartnerScope } from '@/composables/use-partner-scope';
import {
    filterLoansForPartner,
    type PartnerManagerFilter,
} from '@/utils/partner-scope.utils';

import PageHeader from '@/components/layout/PageHeader.vue';
import IconFile from '@/components/icon/icon-file.vue';
import IconClock from '@/components/icon/icon-clock.vue';
import IconSquareCheck from '@/components/icon/icon-square-check.vue';
import IconX from '@/components/icon/icon-x.vue';
import IconEye from '@/components/icon/icon-eye.vue';
import IconStar from '@/components/icon/icon-star.vue';
import IconXCircle from '@/components/icon/icon-x-circle.vue';
import IconArrowLeft from '@/components/icon/icon-arrow-left.vue';
import IconArrowForward from '@/components/icon/icon-arrow-forward.vue';

useMeta({ title: 'Gestão de Empréstimos' });

const store = useKrefasyStore();
const router = useRouter();
const { handleApprove, handleReject } = useLoanDecisionDialogs();
const { isRestrictedPartnerView, loggedUserId } = usePartnerScope();

const partnerManagerFilter = ref<PartnerManagerFilter>('all');
const partnerAllLoans = ref<any[]>([]);
const partnerLoansLoaded = ref(false);

const loans = ref<any[]>([]);
const initialLoading = ref(true);
const loading = ref(false);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const pageSizeOptions = [5, 10, 20, 50];
const totalLoans = ref(0);
const totalPages = ref(1);
const pendingLoans = ref(0);
const approvedLoans = ref(0);
const totalAmount = ref(0);

const getDefaultManagerId = () => {
    const data = authService.getLoginData();
    return data?.userId ?? data?.user?.id ?? '';
};

const filters = ref({
    status: '',
    product: '',
    currency: '',
    managerId: getDefaultManagerId()
});

const PENDING_STATUS_ID = 'a0000000-0000-0000-0000-000000000001';

const loanStatuses = ref<any[]>([]);
const loanProducts = ref<any[]>([]);
const currencies = ref<any[]>([]);
const managers = ref<any[]>([]);

let searchTimeout: ReturnType<typeof setTimeout>;

const pendingCount = computed(() => loans.value.filter(loan => loan.loanStatusName === 'Pendente').length);
const approvedCount = computed(() => loans.value.filter(loan => loan.loanStatusName === 'Aprovado').length);

const paginationSummary = computed(() => {
    if (totalLoans.value === 0) return '';
    const start = (currentPage.value - 1) * pageSize.value + 1;
    const end = Math.min(currentPage.value * pageSize.value, totalLoans.value);
    return `Mostrando ${start}–${end} de ${totalLoans.value} empréstimos`;
});

const managerOptions = computed(() => {
    const opts: { value: string; label: string; isBold?: boolean }[] = [
        { value: '', label: 'Todos os Gestores', isBold: true }
    ];
    if (loggedUserId.value) {
        opts.push({ isBold: true, value: loggedUserId.value, label: 'MEUS EMPRÉSTIMOS' });
    }
    managers.value
        .filter((u: any) => u.id !== loggedUserId.value)
        .forEach((u: any) => opts.push({ value: u.id, label: u.name || u.email }));
    return opts;
});

const partnerScopeOptions = computed(() => [
    { value: 'all' as PartnerManagerFilter, label: 'Meus + sem gestor' },
    { value: 'mine' as PartnerManagerFilter, label: 'Só meus empréstimos' },
    { value: 'unassigned' as PartnerManagerFilter, label: 'Sem gestor' },
]);

const hasActiveFilters = computed(() => {
    const partnerScopeActive = isRestrictedPartnerView.value && partnerManagerFilter.value !== 'all';
    return (
        filters.value.status ||
        filters.value.product ||
        filters.value.currency ||
        partnerScopeActive ||
        (!isRestrictedPartnerView.value && filters.value.managerId && filters.value.managerId !== loggedUserId.value)
    );
});

const visiblePages = computed(() => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage.value - 2);
    const end = Math.min(totalPages.value, currentPage.value + 2);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
});

const activeLoanStatuses = computed(() =>
    loanStatuses.value.filter((s: { isActive?: boolean }) => s.isActive !== false)
);

const activeCurrencies = computed(() =>
    currencies.value.filter((c: { isActive?: boolean }) => c.isActive !== false)
);

function applyLoanResponse(response: { loans?: any[]; total?: number; totalPages?: number; page?: number; limit?: number }) {
    if (response?.loans) {
        loans.value = response.loans;
        totalLoans.value = response.total ?? 0;
        totalPages.value = Math.max(1, response.totalPages ?? 1);
        if (response.page) currentPage.value = response.page;
        pendingLoans.value = loans.value.filter(loan => loan.loanStatusName === 'Pendente').length;
        approvedLoans.value = loans.value.filter(loan => loan.loanStatusName === 'Aprovado').length;
        totalAmount.value = loans.value.reduce((sum, loan) => sum + (loan.requestedAmount || 0), 0);
    } else {
        loans.value = [];
        totalLoans.value = 0;
        totalPages.value = 1;
        pendingLoans.value = 0;
        approvedLoans.value = 0;
        totalAmount.value = 0;
    }
}

function matchesLocalLoanFilters(loan: any): boolean {
    if (filters.value.status) {
        const statusId = loan.loanStatusId || loan.statusId;
        if (String(statusId) !== String(filters.value.status)) return false;
    }
    if (filters.value.product) {
        const productId = loan.loanProductId || loan.productId;
        if (String(productId) !== String(filters.value.product)) return false;
    }
    if (filters.value.currency) {
        const currencyId = loan.currencyId;
        if (String(currencyId) !== String(filters.value.currency)) return false;
    }
    if (searchQuery.value.trim()) {
        const q = searchQuery.value.trim().toLowerCase();
        const haystack = [
            loan.loanNumber,
            loan.customerName,
            loan.clientName,
            loan.customerEmail,
            loan.clientEmail,
        ]
            .filter(Boolean)
            .join(' ')
            .toLowerCase();
        if (!haystack.includes(q)) return false;
    }
    return true;
}

function applyPartnerLoansPage() {
    const scoped = filterLoansForPartner(
        partnerAllLoans.value,
        loggedUserId.value,
        partnerManagerFilter.value
    );
    const filtered = scoped.filter(matchesLocalLoanFilters);
    const total = filtered.length;
    const pages = Math.max(1, Math.ceil(total / pageSize.value));
    if (currentPage.value > pages) currentPage.value = pages;

    const start = (currentPage.value - 1) * pageSize.value;
    const pageItems = filtered.slice(start, start + pageSize.value);

    applyLoanResponse({
        loans: pageItems,
        total,
        totalPages: pages,
        page: currentPage.value,
        limit: pageSize.value,
    });
}

async function ensurePartnerLoansLoaded(force = false) {
    if (partnerLoansLoaded.value && !force) return;
    partnerAllLoans.value = await loansService.getAllLoans();
    partnerLoansLoaded.value = true;
}

function buildLoanParams(overrideManagerId?: string) {
    const params: Record<string, unknown> = {
        Page: currentPage.value,
        Limit: pageSize.value,
    };
    if (filters.value.status) params.StatusId = filters.value.status;
    if (filters.value.product) params.LoanProductId = filters.value.product;
    if (filters.value.currency) params.CurrencyId = filters.value.currency;
    if (overrideManagerId) params.ManagerId = overrideManagerId;
    else if (filters.value.managerId) params.ManagerId = filters.value.managerId;
    if (searchQuery.value) params.Search = searchQuery.value;
    return params;
}

const fetchLoans = async (overrideManagerId?: string) => {
    try {
        loading.value = true;
        if (isRestrictedPartnerView.value) {
            await ensurePartnerLoansLoaded();
            applyPartnerLoansPage();
            return;
        }
        const response = await store.fetchLoans(buildLoanParams(overrideManagerId));
        applyLoanResponse(response);
    } catch (error) {
        console.error('Erro ao buscar empréstimos:', error);
        await Swal.fire({
            title: 'Erro!',
            text: 'Erro ao carregar empréstimos. Tente novamente.',
            icon: 'error',
            confirmButtonColor: '#dc3545'
        });
    } finally {
        loading.value = false;
    }
};

const fetchFilterData = async () => {
    try {
        const [statuses, productsRes, currenciesRes] = await Promise.all([
            store.fetchLoanStatuses(),
            loanProductService.getLoanProducts({ search: '', country: '', page: 1, limit: 100 }),
            currencyService.getCurrencies({ page: 1, limit: 100 })
        ]);

        loanStatuses.value = Array.isArray(statuses) ? statuses : [];
        loanProducts.value = productsRes.succeeded && productsRes.data ? productsRes.data : [];
        currencies.value = currenciesRes.succeeded && currenciesRes.data ? currenciesRes.data : [];

        if (!isRestrictedPartnerView.value) {
            const usersRes = await userService.getUsers();
            if (usersRes.succeeded && usersRes.data?.data) {
                managers.value = usersRes.data.data.filter(
                    (u: { roles?: string[] }) => !u.roles?.includes('Client')
                );
            } else {
                managers.value = [];
            }
        }
    } catch (error) {
        console.error('Erro ao buscar dados para filtros:', error);
    }
};

const debounceSearch = () => {
    if (searchTimeout) clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage.value = 1;
        fetchLoans();
    }, 500);
};

const applyFilters = () => {
    currentPage.value = 1;
    fetchLoans();
};

const changePageSize = () => {
    currentPage.value = 1;
    fetchLoans();
};

const setPartnerScope = (scope: PartnerManagerFilter) => {
    partnerManagerFilter.value = scope;
    currentPage.value = 1;
    fetchLoans();
};

const filterMyClients = async () => {
    const managerId = loggedUserId.value;
    if (!managerId) {
        await Swal.fire({
            title: 'Aviso',
            text: 'Sessão não encontrada. Faça login novamente.',
            icon: 'warning',
            confirmButtonColor: '#f59e0b'
        });
        return;
    }
    try {
        loading.value = true;
        filters.value = { ...filters.value, managerId };
        currentPage.value = 1;
        const response = await loansService.getLoans(buildLoanParams(managerId) as any);
        applyLoanResponse(response);
    } catch (error) {
        console.error('Erro ao filtrar meus clientes:', error);
        await Swal.fire({
            title: 'Erro!',
            text: 'Erro ao carregar empréstimos. Tente novamente.',
            icon: 'error',
            confirmButtonColor: '#dc3545'
        });
    } finally {
        loading.value = false;
    }
};

const clearFilters = () => {
    filters.value = {
        status: '',
        product: '',
        currency: '',
        managerId: getDefaultManagerId()
    };
    partnerManagerFilter.value = 'all';
    searchQuery.value = '';
    currentPage.value = 1;
    fetchLoans();
};

const listPendingLoans = () => {
    filters.value.status = PENDING_STATUS_ID;
    if (!isRestrictedPartnerView.value) {
        filters.value.managerId = '';
    }
    searchQuery.value = '';
    currentPage.value = 1;
    fetchLoans();
};

const listAllLoans = () => {
    if (isRestrictedPartnerView.value) return;
    filters.value.status = '';
    filters.value.product = '';
    filters.value.currency = '';
    filters.value.managerId = '';
    searchQuery.value = '';
    currentPage.value = 1;
    fetchLoans();
};

const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages.value && page !== currentPage.value) {
        currentPage.value = page;
        fetchLoans();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
};

const quickApprove = async (loan: any) => {
    try {
        loading.value = true;
        await handleApprove(loan, async () => {
            await router.push(`/loans/view/${loan.id}?tab=envio`);
        });
    } finally {
        loading.value = false;
    }
};

const quickReject = async (loan: any) => {
    try {
        loading.value = true;
        await handleReject(loan, fetchLoans);
    } finally {
        loading.value = false;
    }
};

const canApproveLoan = (loan: any) => {
    const status = loan?.loanStatusName || loan?.status;
    return status === 'PENDING' || status === 'Pendente';
};

const canRejectLoan = (loan: any) => {
    const status = loan?.loanStatusName || loan?.status;
    return status === 'PENDING' || status === 'Pendente';
};

const getActionButtonText = (loan: any) => {
    const status = loan?.loanStatusName || loan?.status;
    switch (status) {
        case 'Aprovado': return 'Já Aprovado';
        case 'Rejeitado': return 'Rejeitado';
        case 'Ativo': return 'Em Andamento';
        case 'Finalizado': return 'Finalizado';
        case 'Inadimplente': return 'Inadimplente';
        case 'Reestruturado': return 'Reestruturado';
        default: return status || 'Status Desconhecido';
    }
};

const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'Aprovado': return 'badge-outline-success';
        case 'Pendente': return 'badge-outline-warning';
        case 'Rejeitado': return 'badge-outline-danger';
        case 'Ativo': return 'badge-outline-info';
        case 'Finalizado': return 'badge-outline-secondary';
        default: return 'badge-outline-info';
    }
};

const getStatusBorderClass = (status: string) => {
    switch (status) {
        case 'Aprovado': return 'border-l-4 border-l-success';
        case 'Pendente': return 'border-l-4 border-l-warning';
        case 'Rejeitado': return 'border-l-4 border-l-danger';
        case 'Ativo': return 'border-l-4 border-l-info';
        default: return 'border-l-4 border-l-gray-300 dark:border-l-gray-600';
    }
};

const formatCurrency = (amount: number, currencySymbol?: string, currencyCode?: string) => {
    if (!amount) return `${currencySymbol || 'AOA'} 0,00`;
    if (currencySymbol && currencyCode) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currencyCode,
            currencyDisplay: 'symbol'
        }).format(amount).replace(/^[^\d]*/, currencySymbol + ' ');
    }
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'AOA' }).format(amount);
};

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

onMounted(async () => {
    try {
        await fetchFilterData();
        await fetchLoans();
    } finally {
        initialLoading.value = false;
    }
});
</script>
