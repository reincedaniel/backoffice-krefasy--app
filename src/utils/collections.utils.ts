import type { LoansService } from '@/services/loans.service';
import { calculateLateInterest } from '@/utils/late-interest.utils';

export type CollectionDueFilter = 'all' | 'overdue' | 'on_time' | 'due_soon';
export type CollectionStatus = 'overdue' | 'on_time' | 'due_soon';

export interface CollectionLoan {
    id: string;
    createdAt?: string;
    loanNumber?: string;
    customerName?: string;
    clientName?: string;
    customerId?: string;
    clientId?: string;
    loanStatusName?: string;
    status?: string;
    managerId?: string | null;
    managerName?: string;
    currencyCode?: string;
    currencySymbol?: string;
}

export interface CollectionInstallment {
    id: string;
    loanId: string;
    loanNumber?: string;
    installmentNumber?: number;
    clientId?: string;
    clientName: string;
    managerId?: string;
    managerName?: string;
    dueDate: string;
    amount: number;
    lateInterest: number;
    totalDue: number;
    daysOverdue: number;
    currencyCode: string;
    currencySymbol?: string;
    isOverdue: boolean;
    collectionStatus: CollectionStatus;
}

export interface CollectionFilters {
    managerId?: string;
    currencyCode?: string;
    dueDateFrom?: string;
    dueDateTo?: string;
    dueFilter?: CollectionDueFilter;
    search?: string;
}

export interface CollectionCurrencySummary {
    currencyCode: string;
    currencySymbol?: string;
    totalCount: number;
    overdueCount: number;
    onTimeCount: number;
    totalDueAmount: number;
    overdueAmount: number;
    onTimeAmount: number;
    lateInterestTotal: number;
}

export interface CollectionSummary {
    totalCount: number;
    overdueCount: number;
    onTimeCount: number;
    dueSoonCount: number;
    totalDueAmount: number;
    overdueAmount: number;
    onTimeAmount: number;
    lateInterestTotal: number;
    byCurrency: CollectionCurrencySummary[];
}

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function parseDateOnly(value: string | undefined): Date | null {
    if (!value) return null;
    const date = startOfDay(new Date(value));
    return Number.isNaN(date.getTime()) ? null : date;
}

function getLoanStatus(loan: CollectionLoan): string {
    return (loan.loanStatusName || loan.status || '').toLowerCase();
}

export function isPendingCollectionLoan(loan: CollectionLoan): boolean {
    const status = getLoanStatus(loan);
    return status === 'pendente' || status === 'pending';
}

export function isRejectedCollectionLoan(loan: CollectionLoan): boolean {
    const status = getLoanStatus(loan);
    return status.includes('rejeit') || status.includes('reject');
}

export function isCandidateForCollectionFetch(loan: CollectionLoan): boolean {
    if (!loan.id) return false;
    if (isPendingCollectionLoan(loan) || isRejectedCollectionLoan(loan)) return false;
    return true;
}

export function getDefaultCollectionDateRange(): { from: string; to: string } {
    const today = startOfDay(new Date());
    const from = new Date(today);
    from.setDate(from.getDate() - 30);
    const to = new Date(today);
    to.setDate(to.getDate() + 60);

    return {
        from: from.toISOString().slice(0, 10),
        to: to.toISOString().slice(0, 10),
    };
}

function resolveCollectionStatus(daysOverdue: number, dueDate: string): CollectionStatus {
    if (daysOverdue > 0) return 'overdue';

    const due = parseDateOnly(dueDate);
    if (!due) return 'on_time';

    const today = startOfDay(new Date());
    const diffMs = due.getTime() - today.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays >= 0 && diffDays <= 7) return 'due_soon';

    return 'on_time';
}

export function buildCollectionInstallmentsFromLoan(
    loan: CollectionLoan,
    installments: Array<Record<string, unknown>> | undefined
): CollectionInstallment[] {
    if (!installments?.length) return [];

    const loanId = loan.id;
    const clientName = loan.customerName || loan.clientName || 'Cliente';
    const currencyCode = loan.currencyCode ? String(loan.currencyCode) : '';
    const currencySymbol = loan.currencySymbol ? String(loan.currencySymbol) : undefined;
    const clientId = loan.clientId || loan.customerId;
    const items: CollectionInstallment[] = [];

    installments.forEach((inst) => {
        const isPaid = Boolean(inst.isPaid) || inst.status === 'PAID';
        if (isPaid) return;

        const amount = Number(inst.amount ?? 0);
        const dueDate = String(inst.dueDate || '');
        const late = calculateLateInterest({
            amount,
            dueDate,
            isPaid,
            isOverdue: Boolean(inst.isOverdue),
        }, currencyCode);

        items.push({
            id: String(inst.id),
            loanId,
            loanNumber: loan.loanNumber,
            installmentNumber: inst.installmentNumber != null ? Number(inst.installmentNumber) : undefined,
            clientId,
            clientName,
            managerId: loan.managerId || undefined,
            managerName: loan.managerName || undefined,
            dueDate,
            amount,
            lateInterest: late.lateInterest,
            totalDue: late.totalDue,
            daysOverdue: late.daysOverdue,
            currencyCode,
            currencySymbol,
            isOverdue: late.isOverdue,
            collectionStatus: resolveCollectionStatus(late.daysOverdue, dueDate),
        });
    });

    return items;
}

export async function fetchCollectibleInstallments(
    loansService: LoansService,
    loans: CollectionLoan[],
    options: {
        maxLoans?: number;
        onProgress?: (done: number, total: number) => void;
        concurrency?: number;
    } = {}
): Promise<CollectionInstallment[]> {
    const { maxLoans, onProgress, concurrency = 5 } = options;

    let candidates = loans
        .filter(isCandidateForCollectionFetch)
        .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());

    if (maxLoans != null && maxLoans > 0) {
        candidates = candidates.slice(0, maxLoans);
    }

    const allItems: CollectionInstallment[] = [];
    let done = 0;
    const total = candidates.length;

    for (let i = 0; i < candidates.length; i += concurrency) {
        const batch = candidates.slice(i, i + concurrency);
        const settled = await Promise.allSettled(
            batch.map((loan) => loansService.getLoanById(loan.id))
        );

        settled.forEach((outcome, idx) => {
            if (outcome.status !== 'fulfilled') return;

            const listLoan = batch[idx];
            const detail = outcome.value as unknown as Record<string, unknown>;
            const customerDetails = detail.customerDetails as { id?: string } | undefined;
            const mergedLoan: CollectionLoan = {
                ...listLoan,
                loanNumber: (detail.loanNumber as string) || listLoan.loanNumber,
                customerName: (detail.customerName as string) || listLoan.customerName,
                clientName: (detail.clientName as string) || listLoan.clientName,
                customerId: (detail.customerId as string) || listLoan.customerId,
                clientId: customerDetails?.id || (detail.customerId as string) || listLoan.clientId || listLoan.customerId,
                managerId: (detail.managerId as string) || listLoan.managerId,
                managerName: (detail.managerName as string) || listLoan.managerName,
                currencyCode: String(detail.currencyCode || listLoan.currencyCode || ''),
                currencySymbol: detail.currencySymbol
                    ? String(detail.currencySymbol)
                    : listLoan.currencySymbol,
            };

            const installments = buildCollectionInstallmentsFromLoan(
                mergedLoan,
                detail.installments as Array<Record<string, unknown>> | undefined
            );
            allItems.push(...installments);
        });

        done += batch.length;
        onProgress?.(done, total);
    }

    allItems.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
    return allItems;
}

export function filterCollectionInstallments(
    items: CollectionInstallment[],
    filters: CollectionFilters = {}
): CollectionInstallment[] {
    const from = parseDateOnly(filters.dueDateFrom);
    const to = parseDateOnly(filters.dueDateTo);
    const search = filters.search?.trim().toLowerCase() || '';
    const dueFilter = filters.dueFilter || 'all';

    return items.filter((item) => {
        if (filters.managerId && item.managerId !== filters.managerId) return false;
        if (filters.currencyCode && item.currencyCode !== filters.currencyCode) return false;

        const due = parseDateOnly(item.dueDate);
        if (from && due && due < from) return false;
        if (to && due && due > to) return false;

        if (dueFilter === 'overdue' && !item.isOverdue) return false;
        if (dueFilter === 'on_time' && item.isOverdue) return false;
        if (dueFilter === 'due_soon' && item.collectionStatus !== 'due_soon') return false;

        if (search) {
            const haystack = [
                item.clientName,
                item.managerName,
                item.loanNumber,
                item.loanId,
            ]
                .filter(Boolean)
                .join(' ')
                .toLowerCase();
            if (!haystack.includes(search)) return false;
        }

        return true;
    });
}

export function buildCollectionSummary(items: CollectionInstallment[]): CollectionSummary {
    const byCurrencyMap = new Map<string, CollectionCurrencySummary>();

    let overdueCount = 0;
    let onTimeCount = 0;
    let dueSoonCount = 0;
    let totalDueAmount = 0;
    let overdueAmount = 0;
    let onTimeAmount = 0;
    let lateInterestTotal = 0;

    items.forEach((item) => {
        totalDueAmount += item.totalDue;
        lateInterestTotal += item.lateInterest;

        if (item.isOverdue) {
            overdueCount += 1;
            overdueAmount += item.totalDue;
        } else {
            onTimeCount += 1;
            onTimeAmount += item.amount;
        }

        if (item.collectionStatus === 'due_soon') {
            dueSoonCount += 1;
        }

        const existing = byCurrencyMap.get(item.currencyCode) || {
            currencyCode: item.currencyCode,
            currencySymbol: item.currencySymbol,
            totalCount: 0,
            overdueCount: 0,
            onTimeCount: 0,
            totalDueAmount: 0,
            overdueAmount: 0,
            onTimeAmount: 0,
            lateInterestTotal: 0,
        };

        existing.totalCount += 1;
        existing.totalDueAmount += item.totalDue;
        existing.lateInterestTotal += item.lateInterest;

        if (item.isOverdue) {
            existing.overdueCount += 1;
            existing.overdueAmount += item.totalDue;
        } else {
            existing.onTimeCount += 1;
            existing.onTimeAmount += item.amount;
        }

        byCurrencyMap.set(item.currencyCode, existing);
    });

    return {
        totalCount: items.length,
        overdueCount,
        onTimeCount,
        dueSoonCount,
        totalDueAmount,
        overdueAmount,
        onTimeAmount,
        lateInterestTotal,
        byCurrency: [...byCurrencyMap.values()].sort((a, b) => a.currencyCode.localeCompare(b.currencyCode)),
    };
}

export function getUniqueCollectionManagers(loans: CollectionLoan[]): { id: string; name: string }[] {
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

export function getUniqueCollectionCurrencies(loans: CollectionLoan[]): { code: string; symbol?: string }[] {
    const map = new Map<string, string | undefined>();
    loans.forEach((loan) => {
        const code = loan.currencyCode?.trim();
        if (!code || map.has(code)) return;
        map.set(code, loan.currencySymbol);
    });
    return [...map.entries()]
        .map(([code, symbol]) => ({ code, symbol }))
        .sort((a, b) => a.code.localeCompare(b.code));
}

const DEFAULT_CURRENCY_SYMBOLS: Record<string, string> = {
    AOA: 'Kz',
    BRL: 'R$',
    EUR: '€',
    USD: 'US$',
};

/** Símbolo legível para exibição (ex.: R$, €) a partir do código/símbolo da API. */
export function getCurrencyDisplaySymbol(currencyCode?: string | null, currencySymbol?: string | null): string {
    if (currencySymbol?.trim()) return currencySymbol.trim();
    const code = currencyCode?.trim();
    if (!code) return '';
    return DEFAULT_CURRENCY_SYMBOLS[code.toUpperCase()] ?? code;
}

export function formatCollectionAmount(
    amount: number,
    currencyCode?: string | null,
    currencySymbol?: string | null
): string {
    const formatted = amount.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    const symbol = getCurrencyDisplaySymbol(currencyCode, currencySymbol);
    return symbol ? `${symbol} ${formatted}` : formatted;
}

export function toDashboardInstallment(item: CollectionInstallment) {
    return {
        id: item.id,
        loanId: item.loanId,
        clientName: item.clientName,
        amount: item.amount,
        dueDate: item.dueDate,
        installmentNumber: item.installmentNumber,
        currencyCode: item.currencyCode,
        currencySymbol: item.currencySymbol,
        daysOverdue: item.daysOverdue,
        lateInterest: item.lateInterest,
        totalDue: item.totalDue,
    };
}
