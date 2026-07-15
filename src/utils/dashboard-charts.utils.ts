import type { LoansService } from '@/services/loans.service';
import {
    fetchCollectibleInstallments,
    filterCollectionInstallments,
    type CollectionLoan,
    toDashboardInstallment,
} from '@/utils/collections.utils';

export interface DashboardLoan {
    id?: string;
    createdAt?: string;
    loanProductName?: string;
    customerName?: string;
    clientName?: string;
    customerId?: string | null;
    clientId?: string | null;
    managerId?: string | null;
    requestedAmount?: number;
    amount?: number;
    loanStatusName?: string;
    status?: string;
}

export interface DashboardInstallment {
    id: string;
    loanId: string;
    clientName: string;
    amount: number;
    dueDate: string;
    installmentNumber?: number;
    currencyCode?: string;
    currencySymbol?: string;
    daysOverdue?: number;
    lateInterest?: number;
    totalDue?: number;
}

export interface OverdueInstallmentsResult {
    items: DashboardInstallment[];
    totalCount: number;
}

export interface DashboardStatsFromLoans {
    totalLoans: number;
    activeLoans: number;
    totalAmount: number;
    totalRepaid: number;
    defaultRate: number;
    pendingLoans: number;
    defaultedLoans: number;
}

export interface ChartEvolution {
    categories: string[];
    data: number[];
}

export interface ChartDistribution {
    labels: string[];
    series: number[];
}

export interface RecentActivityItem {
    id: string;
    type: 'success' | 'purple' | 'warning';
    title: string;
    description: string;
    timestamp: string;
    icon: unknown;
}

const MONTH_LABELS = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export async function fetchAllLoans(loansService: LoansService): Promise<DashboardLoan[]> {
    return await loansService.getAllLoans() as DashboardLoan[];
}

export function buildMonthlyLoansEvolution(loans: DashboardLoan[], months = 12): ChartEvolution {
    const now = new Date();
    const buckets: { key: string; label: string; count: number }[] = [];

    for (let i = months - 1; i >= 0; i -= 1) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        buckets.push({
            key: `${date.getFullYear()}-${date.getMonth()}`,
            label: MONTH_LABELS[date.getMonth()],
            count: 0,
        });
    }

    loans.forEach((loan) => {
        if (!loan.createdAt) return;
        const created = new Date(loan.createdAt);
        if (Number.isNaN(created.getTime())) return;

        const key = `${created.getFullYear()}-${created.getMonth()}`;
        const bucket = buckets.find((item) => item.key === key);
        if (bucket) bucket.count += 1;
    });

    return {
        categories: buckets.map((item) => item.label),
        data: buckets.map((item) => item.count),
    };
}

export function buildProductDistribution(loans: DashboardLoan[]): ChartDistribution {
    const counts = new Map<string, number>();

    loans.forEach((loan) => {
        const label = loan.loanProductName?.trim() || 'Sem produto';
        counts.set(label, (counts.get(label) || 0) + 1);
    });

    const sorted = [...counts.entries()].sort((a, b) => b[1] - a[1]);

    return {
        labels: sorted.map(([label]) => label),
        series: sorted.map(([, count]) => count),
    };
}

export function buildRecentActivity(
    pendingLoans: DashboardLoan[],
    overdueInstallments: DashboardInstallment[],
    icons: { pending: unknown; overdue: unknown }
): RecentActivityItem[] {
    const activities: RecentActivityItem[] = [];

    pendingLoans.forEach((loan) => {
        const client = loan.customerName || loan.clientName || 'Cliente';
        const amount = loan.requestedAmount ?? loan.amount ?? 0;
        activities.push({
            id: `loan-${loan.id}`,
            type: 'purple',
            title: 'Empréstimo pendente',
            description: `${client} — ${formatCurrency(amount)} aguardando análise`,
            timestamp: loan.createdAt || new Date().toISOString(),
            icon: icons.pending,
        });
    });

    overdueInstallments.forEach((installment) => {
        const totalDue = installment.totalDue ?? installment.amount;
        const moraHint = installment.lateInterest && installment.lateInterest > 0
            ? ` (+ ${formatCurrency(installment.lateInterest)} mora, ${installment.daysOverdue ?? 0} dias)`
            : '';
        activities.push({
            id: `installment-${installment.id}`,
            type: 'warning',
            title: 'Parcela vencida',
            description: `${installment.clientName} — ${formatCurrency(totalDue)} em atraso${moraHint}`,
            timestamp: installment.dueDate || new Date().toISOString(),
            icon: icons.overdue,
        });
    });

    return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5);
}

function getLoanStatus(loan: DashboardLoan): string {
    return (loan.loanStatusName || loan.status || '').toLowerCase();
}

function isActiveLoan(loan: DashboardLoan): boolean {
    const status = getLoanStatus(loan);
    return status === 'aprovado' || status === 'approved' || status === 'ativo' || status === 'active';
}

function isDefaultedLoan(loan: DashboardLoan): boolean {
    const status = getLoanStatus(loan);
    return status === 'inadimplente' || status === 'defaulted';
}

export function buildDashboardStatsFromLoans(loans: DashboardLoan[]): DashboardStatsFromLoans {
    const totalLoans = loans.length;
    const pendingLoans = loans.filter(isPendingLoan).length;
    const activeLoans = loans.filter(isActiveLoan).length;
    const defaultedLoans = loans.filter(isDefaultedLoan).length;
    const totalAmount = loans.reduce((sum, loan) => sum + (loan.requestedAmount ?? loan.amount ?? 0), 0);
    const defaultRate = totalLoans > 0 ? (defaultedLoans / totalLoans) * 100 : 0;

    return {
        totalLoans,
        activeLoans,
        totalAmount,
        totalRepaid: 0,
        defaultRate,
        pendingLoans,
        defaultedLoans,
    };
}

function isPendingLoan(loan: DashboardLoan): boolean {
    const status = (loan.loanStatusName || loan.status || '').toLowerCase();
    return status === 'pendente' || status === 'pending';
}

export function filterPendingLoans(loans: DashboardLoan[], limit = 5): DashboardLoan[] {
    return loans
        .filter(isPendingLoan)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
        .slice(0, limit);
}

export async function fetchOverdueInstallments(
    loansService: LoansService,
    loans: DashboardLoan[],
    maxLoans = 20,
    limit = 5
): Promise<OverdueInstallmentsResult> {
    const allItems = await fetchCollectibleInstallments(
        loansService,
        loans as CollectionLoan[],
        { maxLoans }
    );

    const overdueItems = filterCollectionInstallments(allItems, { dueFilter: 'overdue' })
        .map(toDashboardInstallment);

    return {
        items: overdueItems.slice(0, limit),
        totalCount: overdueItems.length,
    };
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(amount);
}
