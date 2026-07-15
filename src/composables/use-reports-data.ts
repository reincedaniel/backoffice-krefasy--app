import { ref, computed } from 'vue';
import { loansService } from '@/services/loans.service';
import { parcelsService } from '@/services/parcels.service';
import { usePartnerScope } from '@/composables/use-partner-scope';
import {
    filterLoansForPartner,
    filterFinancialsForPartner,
} from '@/utils/partner-scope.utils';
import {
    type ReportLoan,
    type ReportInstallment,
    type ReportPeriod,
    type ReportGranularity,
    type LoanFinancials,
    type ManagerReportRow,
    type TopClientRow,
    type ProductReportRow,
    type ReportsSummary,
    type ReportsTimeSeries,
    type ReportAlerts,
    buildAllLoanFinancials,
    buildManagerReport,
    buildTopClients,
    buildProductReport,
    buildReportsSummary,
    buildStatusDistribution,
    buildTimeSeries,
    buildReportAlerts,
    buildCollectionReportSummary,
    filterFinancialsByPeriod,
    filterFinancialsByManager,
    getPeriodRange,
    getUniqueManagers,
    groupInstallmentsByLoan,
    normalizeInstallmentsFromLoanDetail,
    normalizeInstallmentsFromParcels,
} from '@/utils/reports.utils';
function isPendingLoan(loan: ReportLoan): boolean {
    const status = (loan.loanStatusName || loan.status || '').toLowerCase();
    return status === 'pendente' || status === 'pending';
}

function isRejectedLoan(loan: ReportLoan): boolean {
    const status = (loan.loanStatusName || loan.status || '').toLowerCase();
    return status.includes('rejeit') || status.includes('reject');
}

function isCandidateForDetailFetch(loan: ReportLoan): boolean {
    if (!loan.id) return false;
    if (isPendingLoan(loan) || isRejectedLoan(loan)) return false;
    return true;
}

async function fetchLoanInstallmentsWithConcurrency(
    loans: ReportLoan[],
    existingByLoan: Map<string, ReportInstallment[]>,
    onProgress?: (done: number, total: number) => void,
    concurrency = 5
): Promise<Map<string, ReportInstallment[]>> {
    const result = new Map(existingByLoan);
    const candidates = loans.filter(
        (loan) => isCandidateForDetailFetch(loan) && !result.has(loan.id)
    );

    let done = 0;
    const total = candidates.length;

    for (let i = 0; i < candidates.length; i += concurrency) {
        const batch = candidates.slice(i, i + concurrency);
        const settled = await Promise.allSettled(
            batch.map((loan) => loansService.getLoanById(loan.id))
        );

        settled.forEach((outcome, idx) => {
            if (outcome.status !== 'fulfilled') return;
            const loan = batch[idx];
            const detail = outcome.value as unknown as Record<string, unknown>;
            const installments = normalizeInstallmentsFromLoanDetail(
                loan.id,
                detail.installments as Array<Record<string, unknown>> | undefined,
                String(detail.currencyCode || loan.currencyCode || 'AOA')
            );
            if (installments.length > 0) {
                result.set(loan.id, installments);
            }
        });

        done += batch.length;
        onProgress?.(done, total);
    }

    return result;
}

export function useReportsData() {
    const { isRestrictedPartnerView, loggedUserId } = usePartnerScope();

    const loading = ref(false);
    const loadingProgress = ref('');
    const error = ref<string | null>(null);

    const rawLoans = ref<ReportLoan[]>([]);
    const installmentsByLoan = ref<Map<string, ReportInstallment[]>>(new Map());

    const selectedPeriod = ref<ReportPeriod>('30');
    const customStartDate = ref('');
    const customEndDate = ref('');
    const granularity = ref<ReportGranularity>('day');
    const selectedManagerId = ref('');

    const allFinancials = computed(() =>
        buildAllLoanFinancials(rawLoans.value, installmentsByLoan.value)
    );

    const periodRange = computed(() =>
        getPeriodRange(selectedPeriod.value, customStartDate.value, customEndDate.value)
    );

    const filteredFinancials = computed(() => {
        let rows = allFinancials.value;

        if (isRestrictedPartnerView.value) {
            rows = filterFinancialsForPartner(rows, loggedUserId.value);
        } else if (selectedManagerId.value) {
            rows = filterFinancialsByManager(rows, selectedManagerId.value);
        }

        rows = filterFinancialsByPeriod(
            rawLoans.value,
            rows,
            periodRange.value.start,
            periodRange.value.end,
            installmentsByLoan.value
        );

        return rows;
    });

    const filteredLoans = computed(() => {
        const ids = new Set(filteredFinancials.value.map((f) => f.loanId));
        return rawLoans.value.filter((l) => ids.has(l.id));
    });

    const summary = computed<ReportsSummary>(() =>
        buildReportsSummary(filteredLoans.value, filteredFinancials.value)
    );

    const managerRows = computed<ManagerReportRow[]>(() =>
        buildManagerReport(filteredFinancials.value)
    );

    const loanRows = computed<LoanFinancials[]>(() =>
        [...filteredFinancials.value].sort((a, b) => b.disbursed - a.disbursed)
    );

    const topClients = computed<TopClientRow[]>(() =>
        buildTopClients(filteredFinancials.value, filteredLoans.value)
    );

    const productRows = computed<ProductReportRow[]>(() =>
        buildProductReport(filteredFinancials.value)
    );

    const statusDistribution = computed(() =>
        buildStatusDistribution(filteredLoans.value)
    );

    const timeSeries = computed<ReportsTimeSeries>(() =>
        buildTimeSeries(
            filteredLoans.value,
            installmentsByLoan.value,
            periodRange.value.start,
            periodRange.value.end,
            granularity.value
        )
    );

    const alerts = computed<ReportAlerts>(() =>
        buildReportAlerts(filteredLoans.value, filteredFinancials.value, installmentsByLoan.value)
    );

    const collectionReport = computed(() =>
        buildCollectionReportSummary(
            filteredLoans.value,
            installmentsByLoan.value,
            periodRange.value.start,
            periodRange.value.end,
            isRestrictedPartnerView.value ? undefined : selectedManagerId.value || undefined
        )
    );

    const managers = computed(() => getUniqueManagers(rawLoans.value));

    const hasMultipleCurrencies = computed(() => summary.value.byCurrency.length > 1);

    const primaryCurrency = computed(() =>
        summary.value.byCurrency[0] || {
            currencyCode: 'AOA',
            currencySymbol: 'Kz',
            disbursed: 0,
            recovered: 0,
            outstanding: 0,
            contractedProfit: 0,
            realizedProfit: 0,
            recoveryRate: 0,
            activeLoans: 0,
            totalLoans: 0,
        }
    );

    async function loadReportsData() {
        loading.value = true;
        error.value = null;
        loadingProgress.value = 'A carregar empréstimos...';

        try {
            let loans = (await loansService.getAllLoans()) as ReportLoan[];
            if (isRestrictedPartnerView.value) {
                loans = filterLoansForPartner(loans, loggedUserId.value, 'all');
            }
            rawLoans.value = loans;

            let installmentsMap = new Map<string, ReportInstallment[]>();

            loadingProgress.value = 'A carregar parcelas...';
            try {
                const parcels = await parcelsService.getAllParcels();
                if (parcels.length > 0 && parcels[0].loanId) {
                    const loanCurrencyMap = new Map(
                        loans.map((loan) => [loan.id, loan.currencyCode || 'AOA'])
                    );
                    const byLoan = new Map<string, ReportInstallment[]>();
                    parcels.forEach((parcel) => {
                        const normalized = normalizeInstallmentsFromParcels(
                            [parcel],
                            loanCurrencyMap.get(parcel.loanId) || 'AOA'
                        );
                        const list = byLoan.get(parcel.loanId) || [];
                        list.push(...normalized);
                        byLoan.set(parcel.loanId, list);
                    });
                    installmentsMap = byLoan;
                }
            } catch (parcelErr) {
                console.warn('Parcelas globais indisponíveis, a usar detalhe de empréstimos:', parcelErr);
            }

            const loansNeedingDetail = loans.filter(
                (l) => isCandidateForDetailFetch(l) && !installmentsMap.has(l.id)
            );

            if (loansNeedingDetail.length > 0) {
                installmentsMap = await fetchLoanInstallmentsWithConcurrency(
                    loans,
                    installmentsMap,
                    (done, total) => {
                        loadingProgress.value = `A carregar empréstimos ${done}/${total}...`;
                    }
                );
            }

            installmentsByLoan.value = installmentsMap;
            loadingProgress.value = '';
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Erro ao carregar relatórios';
            error.value = message;
            console.error('Erro ao carregar relatórios:', err);
        } finally {
            loading.value = false;
            loadingProgress.value = '';
        }
    }

    return {
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
        refresh: loadReportsData,
        loadReportsData,
    };
}
