import { ref, computed } from 'vue';
import { loansService } from '@/services/loans.service';
import { authService } from '@/services/auth.service';
import { usePartnerScope } from '@/composables/use-partner-scope';
import {
    filterLoansForPartner,
    filterCollectionItemsForPartner,
    type PartnerManagerFilter,
} from '@/utils/partner-scope.utils';
import {
    type CollectionInstallment,
    type CollectionLoan,
    type CollectionDueFilter,
    type CollectionFilters,
    fetchCollectibleInstallments,
    filterCollectionInstallments,
    buildCollectionSummary,
    getDefaultCollectionDateRange,
    getUniqueCollectionManagers,
    getUniqueCollectionCurrencies,
} from '@/utils/collections.utils';

function getDefaultManagerId(): string {
    const data = authService.getLoginData();
    return data?.userId ?? data?.user?.id ?? '';
}

export function useCollectionsData() {
    const { isRestrictedPartnerView, loggedUserId } = usePartnerScope();

    const loading = ref(false);
    const loadingProgress = ref('');
    const error = ref<string | null>(null);

    const rawLoans = ref<CollectionLoan[]>([]);
    const allItems = ref<CollectionInstallment[]>([]);
    const partnerManagerFilter = ref<PartnerManagerFilter>('all');

    const defaultRange = getDefaultCollectionDateRange();

    const filters = ref<CollectionFilters>({
        managerId: '',
        currencyCode: '',
        dueDateFrom: defaultRange.from,
        dueDateTo: defaultRange.to,
        dueFilter: 'all',
        search: '',
    });

    const currentPage = ref(1);
    const pageSize = ref(20);

    const managers = computed(() => getUniqueCollectionManagers(rawLoans.value));

    const currencies = computed(() => getUniqueCollectionCurrencies(rawLoans.value));

    const managerOptions = computed(() => {
        if (isRestrictedPartnerView.value) {
            return [
                { value: '', label: 'Meus + sem gestor' },
                { value: loggedUserId.value, label: 'Meus empréstimos' },
            ];
        }
        const opts: { value: string; label: string }[] = [];
        if (loggedUserId.value) {
            opts.push({ value: loggedUserId.value, label: 'Meus empréstimos' });
        }
        opts.push({ value: '', label: 'Todos os gestores' });
        managers.value
            .filter((m) => m.id !== loggedUserId.value)
            .forEach((m) => opts.push({ value: m.id, label: m.name }));
        return opts;
    });

    const partnerScopeOptions = computed(() => [
        { value: 'all' as PartnerManagerFilter, label: 'Meus + sem gestor' },
        { value: 'mine' as PartnerManagerFilter, label: 'Só meus empréstimos' },
        { value: 'unassigned' as PartnerManagerFilter, label: 'Sem gestor' },
    ]);

    const scopedItems = computed(() => {
        if (!isRestrictedPartnerView.value) return allItems.value;
        const managerFilter: PartnerManagerFilter =
            filters.value.managerId === loggedUserId.value
                ? 'mine'
                : partnerManagerFilter.value;
        return filterCollectionItemsForPartner(allItems.value, loggedUserId.value, managerFilter);
    });

    const filteredItems = computed(() => {
        const baseFilters = { ...filters.value };
        if (isRestrictedPartnerView.value) {
            baseFilters.managerId =
                filters.value.managerId === loggedUserId.value ? loggedUserId.value : '';
        }
        return filterCollectionInstallments(scopedItems.value, baseFilters);
    });

    const summary = computed(() => buildCollectionSummary(filteredItems.value));

    const totalPages = computed(() =>
        Math.max(1, Math.ceil(filteredItems.value.length / pageSize.value))
    );

    const paginatedItems = computed(() => {
        const start = (currentPage.value - 1) * pageSize.value;
        return filteredItems.value.slice(start, start + pageSize.value);
    });

    const paginationSummary = computed(() => {
        const total = filteredItems.value.length;
        if (total === 0) return '';
        const start = (currentPage.value - 1) * pageSize.value + 1;
        const end = Math.min(currentPage.value * pageSize.value, total);
        return `Mostrando ${start}–${end} de ${total} parcelas`;
    });

    const hasActiveFilters = computed(() => {
        const f = filters.value;
        const partnerScopeActive =
            isRestrictedPartnerView.value &&
            (partnerManagerFilter.value !== 'all' || f.managerId === loggedUserId.value);
        const defaultManagerId = isRestrictedPartnerView.value ? '' : loggedUserId.value || getDefaultManagerId();
        return Boolean(
            partnerScopeActive ||
            (!isRestrictedPartnerView.value && f.managerId && f.managerId !== defaultManagerId) ||
            f.currencyCode ||
            f.search?.trim() ||
            f.dueFilter !== 'all' ||
            f.dueDateFrom !== defaultRange.from ||
            f.dueDateTo !== defaultRange.to
        );
    });

    function applyFiltersFromQuery(query: Record<string, unknown>) {
        if (typeof query.dueFilter === 'string') {
            filters.value.dueFilter = query.dueFilter as CollectionDueFilter;
        }
        if (isRestrictedPartnerView.value) {
            if (typeof query.managerId === 'string' && query.managerId === loggedUserId.value) {
                filters.value.managerId = loggedUserId.value;
            } else {
                filters.value.managerId = '';
                partnerManagerFilter.value = 'all';
            }
        } else if (typeof query.managerId === 'string') {
            filters.value.managerId = query.managerId;
        } else {
            filters.value.managerId = getDefaultManagerId();
        }
        if (typeof query.currencyCode === 'string') {
            filters.value.currencyCode = query.currencyCode;
        }
        if (typeof query.dueDateFrom === 'string') {
            filters.value.dueDateFrom = query.dueDateFrom;
        }
        if (typeof query.dueDateTo === 'string') {
            filters.value.dueDateTo = query.dueDateTo;
        }
        if (typeof query.search === 'string') {
            filters.value.search = query.search;
        }
    }

    function resetFilters() {
        filters.value = {
            managerId: isRestrictedPartnerView.value ? '' : getDefaultManagerId(),
            currencyCode: '',
            dueDateFrom: defaultRange.from,
            dueDateTo: defaultRange.to,
            dueFilter: 'all',
            search: '',
        };
        partnerManagerFilter.value = 'all';
        currentPage.value = 1;
    }

    function setDueFilter(value: CollectionDueFilter) {
        filters.value.dueFilter = value;
        currentPage.value = 1;
    }

    async function loadCollectionsData() {
        loading.value = true;
        error.value = null;
        loadingProgress.value = 'A carregar empréstimos...';

        try {
            let loans = (await loansService.getAllLoans()) as CollectionLoan[];
            if (isRestrictedPartnerView.value) {
                loans = filterLoansForPartner(loans, loggedUserId.value, 'all');
            }
            rawLoans.value = loans.map((loan) => ({
                ...loan,
                id: loan.id!,
            }));

            let items = await fetchCollectibleInstallments(loansService, rawLoans.value, {
                onProgress: (done, total) => {
                    loadingProgress.value = `A carregar parcelas ${done}/${total}...`;
                },
            });

            if (isRestrictedPartnerView.value) {
                items = filterCollectionItemsForPartner(items, loggedUserId.value, 'all');
            }
            allItems.value = items;

            currentPage.value = 1;
        } catch (err: unknown) {
            error.value = err instanceof Error ? err.message : 'Erro ao carregar cobranças';
        } finally {
            loading.value = false;
            loadingProgress.value = '';
        }
    }

    return {
        loading,
        loadingProgress,
        error,
        filters,
        allItems,
        filteredItems,
        paginatedItems,
        summary,
        managers,
        currencies,
        managerOptions,
        partnerScopeOptions,
        partnerManagerFilter,
        isRestrictedPartnerView,
        loggedUserId,
        currentPage,
        pageSize,
        totalPages,
        paginationSummary,
        hasActiveFilters,
        defaultRange,
        applyFiltersFromQuery,
        resetFilters,
        setDueFilter,
        loadCollectionsData,
        refresh: loadCollectionsData,
    };
}
