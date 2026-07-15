import { authService } from '@/services/auth.service';

const EMPTY_GUID = '00000000-0000-0000-0000-000000000000';

export type PartnerManagerFilter = 'all' | 'mine' | 'unassigned';

export interface PartnerScopedLoan {
    managerId?: string | null;
    customerId?: string | null;
    clientId?: string | null;
}

export interface PartnerScopedCollectionItem {
    managerId?: string | null;
}

export interface PartnerScopedFinancial {
    managerId?: string | null;
}

export function getLoggedUserId(): string {
    const data = authService.getLoginData();
    return data?.userId ?? data?.user?.id ?? '';
}

export function isUnassignedManager(managerId?: string | null): boolean {
    if (managerId == null) return true;
    const trimmed = String(managerId).trim();
    if (!trimmed) return true;
    return trimmed === EMPTY_GUID;
}

export function canPartnerAccessLoan(loan: PartnerScopedLoan, partnerId: string): boolean {
    if (!partnerId) return false;
    if (isUnassignedManager(loan.managerId)) return true;
    return String(loan.managerId) === partnerId;
}

export function matchesPartnerManagerFilter(
    loan: PartnerScopedLoan,
    partnerId: string,
    filter: PartnerManagerFilter
): boolean {
    if (!canPartnerAccessLoan(loan, partnerId)) return false;
    if (filter === 'all') return true;
    if (filter === 'mine') return String(loan.managerId) === partnerId;
    return isUnassignedManager(loan.managerId);
}

export function filterLoansForPartner<T extends PartnerScopedLoan>(
    loans: T[],
    partnerId: string,
    managerFilter: PartnerManagerFilter = 'all'
): T[] {
    if (!partnerId) return [];
    return loans.filter((loan) => matchesPartnerManagerFilter(loan, partnerId, managerFilter));
}

export function filterCollectionItemsForPartner<T extends PartnerScopedCollectionItem>(
    items: T[],
    partnerId: string,
    managerFilter: PartnerManagerFilter = 'all'
): T[] {
    if (!partnerId) return [];
    return items.filter((item) => {
        if (!canPartnerAccessLoan(item, partnerId)) return false;
        if (managerFilter === 'all') return true;
        if (managerFilter === 'mine') return String(item.managerId) === partnerId;
        return isUnassignedManager(item.managerId);
    });
}

export function filterFinancialsForPartner<T extends PartnerScopedFinancial>(
    financials: T[],
    partnerId: string
): T[] {
    if (!partnerId) return [];
    return financials.filter(
        (row) => isUnassignedManager(row.managerId) || String(row.managerId) === partnerId
    );
}

export function getScopedCustomerIdsFromLoans(loans: PartnerScopedLoan[]): Set<string> {
    const ids = new Set<string>();
    loans.forEach((loan) => {
        const id = loan.customerId || loan.clientId;
        if (id) ids.add(String(id));
    });
    return ids;
}

export function getPartnerRoleLabel(roles?: string[] | null): string {
    if (!roles?.length) return 'Utilizador';
    if (roles.includes('Admin')) return 'Administrador';
    if (roles.includes('Partner')) return 'Partner';
    return roles[0];
}
