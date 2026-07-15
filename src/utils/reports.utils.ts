import { buildProductDistribution, type ChartDistribution } from '@/utils/dashboard-charts.utils';
import { calculateLateInterest } from '@/utils/late-interest.utils';

export type ReportPeriod = '7' | '30' | '90' | '365' | 'custom';
export type ReportGranularity = 'day' | 'week' | 'month';

export interface ReportLoan {
    id: string;
    loanNumber?: string;
    customerName?: string;
    customerEmail?: string;
    loanProductName?: string;
    loanStatusName?: string;
    status?: string;
    managerId?: string | null;
    managerName?: string;
    requestedAmount?: number;
    approvedAmount?: number;
    amount?: number;
    totalAmount?: number;
    currencyCode?: string;
    currencySymbol?: string;
    createdAt?: string;
    approvedAt?: string;
}

export interface ReportInstallment {
    loanId: string;
    amount: number;
    paidAmount: number;
    isPaid: boolean;
    isOverdue: boolean;
    paidDate?: string | null;
    dueDate?: string;
    daysOverdue?: number;
    lateInterest?: number;
    totalDue?: number;
}

export interface LoanFinancials {
    loanId: string;
    loanNumber: string;
    customerName: string;
    customerEmail: string;
    managerId: string;
    managerName: string;
    productName: string;
    status: string;
    currencyCode: string;
    currencySymbol: string;
    createdAt: string;
    disbursed: number;
    totalReceivable: number;
    recovered: number;
    outstanding: number;
    capitalAtRisk: number;
    contractedProfit: number;
    realizedProfit: number;
    recoveryRate: number;
    overdueInstallments: number;
    isDefaulted: boolean;
}

export interface ManagerReportRow {
    managerId: string;
    managerName: string;
    loanCount: number;
    disbursed: number;
    recovered: number;
    outstanding: number;
    contractedProfit: number;
    realizedProfit: number;
    recoveryRate: number;
    currencyCode: string;
}

export interface TopClientRow {
    id: string;
    name: string;
    email: string;
    loanCount: number;
    volume: number;
    recovered: number;
    status: string;
    currencyCode: string;
}

export interface ProductReportRow {
    id: string;
    name: string;
    quantity: number;
    volume: number;
    recovered: number;
    currencyCode: string;
}

export interface PeriodBucket {
    key: string;
    label: string;
    disbursements: number;
    recoveries: number;
    loanCount: number;
}

export interface ReportsTimeSeries {
    categories: string[];
    disbursements: number[];
    recoveries: number[];
    loanCounts: number[];
}

export interface CurrencySummary {
    currencyCode: string;
    currencySymbol: string;
    disbursed: number;
    recovered: number;
    outstanding: number;
    contractedProfit: number;
    realizedProfit: number;
    recoveryRate: number;
    activeLoans: number;
    totalLoans: number;
}

export interface ReportsSummary {
    byCurrency: CurrencySummary[];
    totalLoans: number;
    activeLoans: number;
    pendingLoans: number;
    defaultedLoans: number;
    overdueInstallments: number;
    defaultRate: number;
}

export interface ReportAlerts {
    overdueInstallments: number;
    defaultedLoans: number;
    pendingLoans: number;
    overdueAmountDue: number;
    accumulatedLateInterest: number;
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

function getLoanStatus(loan: ReportLoan): string {
    return (loan.loanStatusName || loan.status || '').toLowerCase();
}

export function isPendingLoan(loan: ReportLoan): boolean {
    const status = getLoanStatus(loan);
    return status === 'pendente' || status === 'pending';
}

export function isRejectedLoan(loan: ReportLoan): boolean {
    const status = getLoanStatus(loan);
    return status.includes('rejeit') || status.includes('reject');
}

export function isActiveLoan(loan: ReportLoan): boolean {
    const status = getLoanStatus(loan);
    return status === 'aprovado' || status === 'approved' || status === 'ativo' || status === 'active';
}

export function isDisbursedLoan(loan: ReportLoan): boolean {
    if (isPendingLoan(loan) || isRejectedLoan(loan)) return false;
    const status = getLoanStatus(loan);
    return (
        isActiveLoan(loan) ||
        status === 'finalizado' ||
        status === 'completed' ||
        status === 'inadimplente' ||
        status === 'defaulted'
    );
}

export function isDefaultedLoan(loan: ReportLoan): boolean {
    const status = getLoanStatus(loan);
    return status === 'inadimplente' || status === 'defaulted';
}

export function getPeriodRange(
    period: ReportPeriod,
    customStart?: string,
    customEnd?: string
): { start: Date; end: Date } {
    const end = new Date();
    end.setHours(23, 59, 59, 999);

    if (period === 'custom' && customStart && customEnd) {
        const start = new Date(customStart);
        start.setHours(0, 0, 0, 0);
        const customEndDate = new Date(customEnd);
        customEndDate.setHours(23, 59, 59, 999);
        return { start, end: customEndDate };
    }

    const start = new Date();
    start.setHours(0, 0, 0, 0);

    const days = period === '7' ? 7 : period === '30' ? 30 : period === '90' ? 90 : 365;
    start.setDate(start.getDate() - days + 1);

    return { start, end };
}

export function isDateInRange(dateStr: string | undefined | null, start: Date, end: Date): boolean {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    if (Number.isNaN(date.getTime())) return false;
    return date >= start && date <= end;
}

export function normalizeInstallmentsFromLoanDetail(
    loanId: string,
    installments: Array<Record<string, unknown>> | undefined,
    currencyCode = 'AOA'
): ReportInstallment[] {
    if (!installments?.length) return [];

    return installments.map((inst) => {
        const isPaid = Boolean(inst.isPaid) || inst.status === 'PAID';
        const amount = Number(inst.amount ?? 0);
        const paidAmount = Number(inst.paidAmount ?? (isPaid ? amount : 0));
        const dueDate = inst.dueDate as string | undefined;
        const isOverdue = Boolean(inst.isOverdue);

        const late = calculateLateInterest({
            amount,
            dueDate: dueDate || '',
            isPaid,
            isOverdue,
        }, currencyCode);

        return {
            loanId,
            amount,
            paidAmount: isPaid ? paidAmount : 0,
            isPaid,
            isOverdue: isOverdue || late.isOverdue,
            paidDate: (inst.paidDate as string) || null,
            dueDate,
            daysOverdue: late.daysOverdue,
            lateInterest: late.lateInterest,
            totalDue: late.totalDue,
        };
    });
}

export function normalizeInstallmentsFromParcels(parcels: Array<{
    loanId: string;
    amount?: number;
    totalAmount?: number;
    paidAmount?: number;
    status?: string;
    paymentDate?: string;
    dueDate?: string;
    daysOverdue?: number;
}>, currencyCode = 'AOA'): ReportInstallment[] {
    return parcels.map((parcel) => {
        const isPaid = parcel.status === 'PAID' || (parcel.paidAmount ?? 0) > 0;
        const amount = Number(parcel.totalAmount ?? parcel.amount ?? 0);
        const paidAmount = Number(parcel.paidAmount ?? (isPaid ? amount : 0));
        const isOverdue = parcel.status === 'OVERDUE' || (parcel.daysOverdue ?? 0) > 0;

        const late = calculateLateInterest({
            amount,
            dueDate: parcel.dueDate || '',
            isPaid,
            isOverdue,
        }, currencyCode);

        return {
            loanId: parcel.loanId,
            amount,
            paidAmount: isPaid ? paidAmount : 0,
            isPaid,
            isOverdue: isOverdue || late.isOverdue,
            paidDate: parcel.paymentDate || null,
            dueDate: parcel.dueDate,
            daysOverdue: late.daysOverdue,
            lateInterest: late.lateInterest,
            totalDue: late.totalDue,
        };
    });
}

export function groupInstallmentsByLoan(installments: ReportInstallment[]): Map<string, ReportInstallment[]> {
    const map = new Map<string, ReportInstallment[]>();
    installments.forEach((inst) => {
        const list = map.get(inst.loanId) || [];
        list.push(inst);
        map.set(inst.loanId, list);
    });
    return map;
}

export function buildLoanFinancials(loan: ReportLoan, installments: ReportInstallment[] = []): LoanFinancials {
    const approved = loan.approvedAmount && loan.approvedAmount > 0
        ? loan.approvedAmount
        : loan.requestedAmount ?? loan.amount ?? 0;
    const totalReceivable = loan.totalAmount ?? approved;
    const disbursed = isDisbursedLoan(loan) ? approved : 0;

    const recovered = installments.reduce((sum, inst) => sum + (inst.isPaid ? inst.paidAmount : 0), 0);
    const outstanding = Math.max(0, totalReceivable - recovered);
    const capitalAtRisk = Math.max(0, disbursed - Math.min(recovered, disbursed));
    const contractedProfit = Math.max(0, totalReceivable - approved);
    const realizedProfit = Math.max(0, recovered - approved);
    const recoveryRate = totalReceivable > 0 ? (recovered / totalReceivable) * 100 : 0;
    const overdueInstallments = installments.filter((inst) => inst.isOverdue && !inst.isPaid).length;

    return {
        loanId: loan.id,
        loanNumber: loan.loanNumber || loan.id.slice(0, 8),
        customerName: loan.customerName || '—',
        customerEmail: loan.customerEmail || '',
        managerId: loan.managerId || 'unknown',
        managerName: loan.managerName || 'Sem gestor',
        productName: loan.loanProductName || 'Sem produto',
        status: loan.loanStatusName || loan.status || '—',
        currencyCode: loan.currencyCode || 'AOA',
        currencySymbol: loan.currencySymbol || 'Kz',
        createdAt: loan.createdAt || '',
        disbursed,
        totalReceivable,
        recovered,
        outstanding,
        capitalAtRisk,
        contractedProfit,
        realizedProfit,
        recoveryRate,
        overdueInstallments,
        isDefaulted: isDefaultedLoan(loan) || overdueInstallments > 0,
    };
}

export function buildAllLoanFinancials(
    loans: ReportLoan[],
    installmentsByLoan: Map<string, ReportInstallment[]>
): LoanFinancials[] {
    return loans.map((loan) => buildLoanFinancials(loan, installmentsByLoan.get(loan.id) || []));
}

export function filterFinancialsByPeriod(
    loans: ReportLoan[],
    financials: LoanFinancials[],
    start: Date,
    end: Date,
    installmentsByLoan: Map<string, ReportInstallment[]> = new Map()
): LoanFinancials[] {
    const loanMap = new Map(loans.map((l) => [l.id, l]));
    return financials.filter((f) => {
        const loan = loanMap.get(f.loanId);
        if (!loan) return false;
        if (isDateInRange(loan.createdAt, start, end) || isDateInRange(loan.approvedAt, start, end)) {
            return true;
        }
        const installments = installmentsByLoan.get(f.loanId) || [];
        return installments.some(
            (inst) => inst.isPaid && isDateInRange(inst.paidDate, start, end)
        );
    });
}

export function filterFinancialsByManager(financials: LoanFinancials[], managerId: string): LoanFinancials[] {
    if (!managerId) return financials;
    return financials.filter((f) => f.managerId === managerId);
}

export function buildReportsSummary(loans: ReportLoan[], financials: LoanFinancials[]): ReportsSummary {
    const currencyMap = new Map<string, CurrencySummary>();

    financials.forEach((f) => {
        const existing = currencyMap.get(f.currencyCode) || {
            currencyCode: f.currencyCode,
            currencySymbol: f.currencySymbol,
            disbursed: 0,
            recovered: 0,
            outstanding: 0,
            contractedProfit: 0,
            realizedProfit: 0,
            recoveryRate: 0,
            activeLoans: 0,
            totalLoans: 0,
        };

        existing.disbursed += f.disbursed;
        existing.recovered += f.recovered;
        existing.outstanding += f.outstanding;
        existing.contractedProfit += f.contractedProfit;
        existing.realizedProfit += f.realizedProfit;
        existing.totalLoans += 1;
        if (isActiveLoan({ loanStatusName: f.status } as ReportLoan)) {
            existing.activeLoans += 1;
        }
        currencyMap.set(f.currencyCode, existing);
    });

    currencyMap.forEach((summary) => {
        const totalReceivable = summary.recovered + summary.outstanding;
        summary.recoveryRate = totalReceivable > 0 ? (summary.recovered / totalReceivable) * 100 : 0;
    });

    const defaultedLoans = loans.filter(isDefaultedLoan).length;
    const pendingLoans = loans.filter(isPendingLoan).length;
    const activeLoans = loans.filter(isActiveLoan).length;
    const overdueInstallments = financials.reduce((sum, f) => sum + f.overdueInstallments, 0);

    return {
        byCurrency: [...currencyMap.values()],
        totalLoans: loans.length,
        activeLoans,
        pendingLoans,
        defaultedLoans,
        overdueInstallments,
        defaultRate: loans.length > 0 ? (defaultedLoans / loans.length) * 100 : 0,
    };
}

export function buildManagerReport(financials: LoanFinancials[]): ManagerReportRow[] {
    const map = new Map<string, ManagerReportRow>();

    financials.forEach((f) => {
        const key = f.managerId;
        const existing = map.get(key) || {
            managerId: f.managerId,
            managerName: f.managerName,
            loanCount: 0,
            disbursed: 0,
            recovered: 0,
            outstanding: 0,
            contractedProfit: 0,
            realizedProfit: 0,
            recoveryRate: 0,
            currencyCode: f.currencyCode,
        };

        existing.loanCount += 1;
        existing.disbursed += f.disbursed;
        existing.recovered += f.recovered;
        existing.outstanding += f.outstanding;
        existing.contractedProfit += f.contractedProfit;
        existing.realizedProfit += f.realizedProfit;
        map.set(key, existing);
    });

    return [...map.values()]
        .map((row) => {
            const totalReceivable = row.recovered + row.outstanding;
            return {
                ...row,
                recoveryRate: totalReceivable > 0 ? (row.recovered / totalReceivable) * 100 : 0,
            };
        })
        .sort((a, b) => b.disbursed - a.disbursed);
}

export function buildTopClients(financials: LoanFinancials[], loans: ReportLoan[], limit = 10): TopClientRow[] {
    const loanMap = new Map(loans.map((l) => [l.id, l]));
    const clientMap = new Map<string, TopClientRow>();

    financials.forEach((f) => {
        const loan = loanMap.get(f.loanId);
        const email = loan?.customerEmail || f.customerEmail || '';
        const key = email || f.customerName;

        const existing = clientMap.get(key) || {
            id: key,
            name: f.customerName,
            email,
            loanCount: 0,
            volume: 0,
            recovered: 0,
            status: f.status,
            currencyCode: f.currencyCode,
        };

        existing.loanCount += 1;
        existing.volume += f.disbursed || f.totalReceivable;
        existing.recovered += f.recovered;
        if (f.isDefaulted) existing.status = 'Em Atraso';
        else if (isActiveLoan({ loanStatusName: f.status } as ReportLoan)) existing.status = 'Ativo';

        clientMap.set(key, existing);
    });

    return [...clientMap.values()].sort((a, b) => b.volume - a.volume).slice(0, limit);
}

export function buildProductReport(financials: LoanFinancials[], limit = 10): ProductReportRow[] {
    const map = new Map<string, ProductReportRow>();

    financials.forEach((f) => {
        const existing = map.get(f.productName) || {
            id: f.productName,
            name: f.productName,
            quantity: 0,
            volume: 0,
            recovered: 0,
            currencyCode: f.currencyCode,
        };

        existing.quantity += 1;
        existing.volume += f.disbursed || f.totalReceivable;
        existing.recovered += f.recovered;
        map.set(f.productName, existing);
    });

    return [...map.values()].sort((a, b) => b.volume - a.volume).slice(0, limit);
}

export function buildStatusDistribution(loans: ReportLoan[]): ChartDistribution {
    const counts = new Map<string, number>();

    loans.forEach((loan) => {
        const label = loan.loanStatusName || loan.status || 'Desconhecido';
        counts.set(label, (counts.get(label) || 0) + 1);
    });

    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);
    return {
        labels: sorted.map(([label]) => label),
        series: sorted.map(([, count]) => count),
    };
}

function getWeekKey(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - d.getDay());
    return d.toISOString().slice(0, 10);
}

function formatBucketLabel(date: Date, granularity: ReportGranularity): string {
    if (granularity === 'month') {
        return `${MONTH_LABELS[date.getMonth()]} ${String(date.getFullYear()).slice(2)}`;
    }
    if (granularity === 'week') {
        return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
    }
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function buildBucketKeys(start: Date, end: Date, granularity: ReportGranularity): PeriodBucket[] {
    const buckets: PeriodBucket[] = [];
    const cursor = new Date(start);
    cursor.setHours(0, 0, 0, 0);

    if (granularity === 'month') {
        cursor.setDate(1);
        while (cursor <= end) {
            const key = `${cursor.getFullYear()}-${cursor.getMonth()}`;
            buckets.push({
                key,
                label: formatBucketLabel(cursor, granularity),
                disbursements: 0,
                recoveries: 0,
                loanCount: 0,
            });
            cursor.setMonth(cursor.getMonth() + 1);
        }
        return buckets;
    }

    if (granularity === 'week') {
        cursor.setDate(cursor.getDate() - cursor.getDay());
        while (cursor <= end) {
            const key = getWeekKey(cursor);
            if (!buckets.find((b) => b.key === key)) {
                buckets.push({
                    key,
                    label: formatBucketLabel(cursor, granularity),
                    disbursements: 0,
                    recoveries: 0,
                    loanCount: 0,
                });
            }
            cursor.setDate(cursor.getDate() + 7);
        }
        return buckets;
    }

    while (cursor <= end) {
        const key = cursor.toISOString().slice(0, 10);
        buckets.push({
            key,
            label: formatBucketLabel(cursor, granularity),
            disbursements: 0,
            recoveries: 0,
            loanCount: 0,
        });
        cursor.setDate(cursor.getDate() + 1);
    }

    return buckets;
}

function findBucketKey(date: Date, granularity: ReportGranularity): string {
    if (granularity === 'month') {
        return `${date.getFullYear()}-${date.getMonth()}`;
    }
    if (granularity === 'week') {
        return getWeekKey(date);
    }
    return date.toISOString().slice(0, 10);
}

export function buildTimeSeries(
    loans: ReportLoan[],
    installmentsByLoan: Map<string, ReportInstallment[]>,
    start: Date,
    end: Date,
    granularity: ReportGranularity
): ReportsTimeSeries {
    const buckets = buildBucketKeys(start, end, granularity);
    const bucketMap = new Map(buckets.map((b) => [b.key, b]));

    loans.forEach((loan) => {
        if (!isDisbursedLoan(loan)) return;
        const dateStr = loan.approvedAt || loan.createdAt;
        if (!isDateInRange(dateStr, start, end)) return;

        const date = new Date(dateStr!);
        const key = findBucketKey(date, granularity);
        const bucket = bucketMap.get(key);
        if (!bucket) return;

        const amount = loan.approvedAmount && loan.approvedAmount > 0
            ? loan.approvedAmount
            : loan.requestedAmount ?? loan.amount ?? 0;

        bucket.disbursements += amount;
        bucket.loanCount += 1;
    });

    installmentsByLoan.forEach((installments) => {
        installments.forEach((inst) => {
            if (!inst.isPaid || !inst.paidDate) return;
            if (!isDateInRange(inst.paidDate, start, end)) return;

            const date = new Date(inst.paidDate);
            const key = findBucketKey(date, granularity);
            const bucket = bucketMap.get(key);
            if (bucket) bucket.recoveries += inst.paidAmount;
        });
    });

    return {
        categories: buckets.map((b) => b.label),
        disbursements: buckets.map((b) => b.disbursements),
        recoveries: buckets.map((b) => b.recoveries),
        loanCounts: buckets.map((b) => b.loanCount),
    };
}

export function buildReportAlerts(
    loans: ReportLoan[],
    financials: LoanFinancials[],
    installmentsByLoan: Map<string, ReportInstallment[]> = new Map()
): ReportAlerts {
    let overdueAmountDue = 0;
    let accumulatedLateInterest = 0;
    let overdueCount = 0;

    installmentsByLoan.forEach((installments) => {
        installments.forEach((inst) => {
            if (!inst.isOverdue || inst.isPaid) return;
            overdueCount += 1;
            overdueAmountDue += inst.totalDue ?? inst.amount;
            accumulatedLateInterest += inst.lateInterest ?? 0;
        });
    });

    return {
        overdueInstallments: overdueCount || financials.reduce((sum, f) => sum + f.overdueInstallments, 0),
        defaultedLoans: loans.filter(isDefaultedLoan).length,
        pendingLoans: loans.filter(isPendingLoan).length,
        overdueAmountDue,
        accumulatedLateInterest,
    };
}

export function getUniqueManagers(loans: ReportLoan[]): { id: string; name: string }[] {
    const map = new Map<string, string>();
    loans.forEach((loan) => {
        if (loan.managerId && loan.managerName) {
            map.set(loan.managerId, loan.managerName);
        }
    });
    return [...map.entries()]
        .map(([id, name]) => ({ id, name }))
        .sort((a, b) => a.name.localeCompare(b.name));
}

export interface CollectionReportRow {
    id: string;
    loanId: string;
    clientName: string;
    managerName: string;
    dueDate: string;
    amount: number;
    lateInterest: number;
    totalDue: number;
    isOverdue: boolean;
    currencyCode: string;
    currencySymbol?: string;
}

export interface CollectionReportSummary {
    totalCount: number;
    overdueCount: number;
    onTimeCount: number;
    totalDueAmount: number;
    overdueAmount: number;
    onTimeAmount: number;
    lateInterestTotal: number;
    rows: CollectionReportRow[];
}

export function buildCollectionReportSummary(
    loans: ReportLoan[],
    installmentsByLoan: Map<string, ReportInstallment[]>,
    start: Date,
    end: Date,
    managerId?: string,
    limit = 10
): CollectionReportSummary {
    const loanMap = new Map(loans.map((loan) => [loan.id, loan]));
    const rows: CollectionReportRow[] = [];

    installmentsByLoan.forEach((installments, loanId) => {
        const loan = loanMap.get(loanId);
        if (!loan) return;
        if (managerId && loan.managerId !== managerId) return;

        installments.forEach((inst, index) => {
            if (inst.isPaid) return;
            if (!isDateInRange(inst.dueDate, start, end)) return;

            rows.push({
                id: `${loanId}-${index}`,
                loanId,
                clientName: loan.customerName || '—',
                managerName: loan.managerName || 'Sem gestor',
                dueDate: inst.dueDate || '',
                amount: inst.amount,
                lateInterest: inst.lateInterest ?? 0,
                totalDue: inst.totalDue ?? inst.amount,
                isOverdue: inst.isOverdue,
                currencyCode: loan.currencyCode || 'AOA',
                currencySymbol: loan.currencySymbol,
            });
        });
    });

    rows.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

    let overdueCount = 0;
    let onTimeCount = 0;
    let totalDueAmount = 0;
    let overdueAmount = 0;
    let onTimeAmount = 0;
    let lateInterestTotal = 0;

    rows.forEach((row) => {
        totalDueAmount += row.totalDue;
        lateInterestTotal += row.lateInterest;
        if (row.isOverdue) {
            overdueCount += 1;
            overdueAmount += row.totalDue;
        } else {
            onTimeCount += 1;
            onTimeAmount += row.amount;
        }
    });

    return {
        totalCount: rows.length,
        overdueCount,
        onTimeCount,
        totalDueAmount,
        overdueAmount,
        onTimeAmount,
        lateInterestTotal,
        rows: rows.slice(0, limit),
    };
}

export function formatReportCurrency(
    amount: number,
    currencyCode = 'AOA',
    currencySymbol?: string
): string {
    try {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currencyCode,
            minimumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${currencySymbol || currencyCode} ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`;
    }
}

export function exportReportsToCsv(
    managerRows: ManagerReportRow[],
    loanRows: LoanFinancials[]
): void {
    const lines: string[] = [];

    lines.push('=== POR GESTOR ===');
    lines.push('Gestor,Empréstimos,Emprestado,Recuperado,Em Aberto,Lucro Contratado,Lucro Realizado,Taxa Recuperação');
    managerRows.forEach((row) => {
        lines.push([
            `"${row.managerName}"`,
            row.loanCount,
            row.disbursed.toFixed(2),
            row.recovered.toFixed(2),
            row.outstanding.toFixed(2),
            row.contractedProfit.toFixed(2),
            row.realizedProfit.toFixed(2),
            `${row.recoveryRate.toFixed(1)}%`,
        ].join(','));
    });

    lines.push('');
    lines.push('=== POR EMPRÉSTIMO ===');
    lines.push('Número,Cliente,Gestor,Emprestado,Recuperado,Em Aberto,Lucro Contratado,Lucro Realizado,Status');
    loanRows.forEach((row) => {
        lines.push([
            `"${row.loanNumber}"`,
            `"${row.customerName}"`,
            `"${row.managerName}"`,
            row.disbursed.toFixed(2),
            row.recovered.toFixed(2),
            row.outstanding.toFixed(2),
            row.contractedProfit.toFixed(2),
            row.realizedProfit.toFixed(2),
            `"${row.status}"`,
        ].join(','));
    });

    const blob = new Blob(['\ufeff' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `relatorio-krefasy-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
}

export { buildProductDistribution };
