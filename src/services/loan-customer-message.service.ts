import type { CustomerPaymentMethod } from '@/utils/payment-method.utils';

export interface LoanCustomerDetails {
    id: string;
    fullName?: string;
    email?: string;
}

export interface LoanForNotification {
    id?: string;
    loanNumber?: string;
    customerName?: string;
    customerDetails?: LoanCustomerDetails;
    requestedAmount?: number;
    amount?: number;
    currencySymbol?: string;
    currencyCode?: string;
}

export interface NotificationResult {
    sent: boolean;
    error?: string;
}

/** Desactivado temporariamente — não enviar mensagens de chat ao aprovar/rejeitar. */
const LOAN_CHAT_NOTIFICATIONS_ENABLED = false;

export async function notifyLoanApproved(
    _loan: LoanForNotification,
    _paymentMethod?: CustomerPaymentMethod | null
): Promise<NotificationResult> {
    if (!LOAN_CHAT_NOTIFICATIONS_ENABLED) {
        return { sent: false };
    }
    return { sent: false };
}

export async function notifyLoanRejected(
    _loan: LoanForNotification,
    _reason: string
): Promise<NotificationResult> {
    if (!LOAN_CHAT_NOTIFICATIONS_ENABLED) {
        return { sent: false };
    }
    return { sent: false };
}
