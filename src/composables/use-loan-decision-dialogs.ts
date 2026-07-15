import Swal from 'sweetalert2';
import { useKrefasyStore } from '@/stores/index';
import {
    buildPaymentMethodHtml,
    type CustomerPaymentMethod,
} from '@/utils/payment-method.utils';
export interface LoanCustomerDetails {
    id: string;
    fullName?: string;
    email?: string;
    defaultPaymentMethod?: CustomerPaymentMethod | null;
}

export interface LoanDecision {
    id: string;
    loanNumber?: string;
    customerName?: string;
    customerDetails?: LoanCustomerDetails;
    requestedAmount?: number;
    amount?: number;
    currencySymbol?: string;
    currencyCode?: string;
}

const SWAL_CLASS = { popup: 'sweet-alerts' };

function formatCurrency(loan: LoanDecision): string {
    const amount = loan.requestedAmount ?? loan.amount ?? 0;
    const symbol = loan.currencySymbol;
    const code = loan.currencyCode;

    if (!amount) {
        return `${symbol || 'AOA'} 0,00`;
    }

    if (symbol && code) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: code,
            currencyDisplay: 'symbol',
        })
            .format(amount)
            .replace(/^[^\d]*/, symbol + ' ');
    }

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'AOA',
    }).format(amount);
}

function buildLoanSummaryHtml(loan: LoanDecision): string {
    const customerName = loan.customerDetails?.fullName || loan.customerName || 'N/A';
    const loanNumber = loan.loanNumber || '—';
    const amount = formatCurrency(loan);

    return `
        <div class="text-left text-sm mb-4 p-3 rounded bg-gray-50 dark:bg-gray-800/50">
            <div class="flex justify-between gap-4 py-1">
                <span class="text-gray-500 dark:text-gray-400">Empréstimo</span>
                <span class="font-semibold text-gray-800 dark:text-gray-200">${loanNumber}</span>
            </div>
            <div class="flex justify-between gap-4 py-1">
                <span class="text-gray-500 dark:text-gray-400">Cliente</span>
                <span class="font-semibold text-gray-800 dark:text-gray-200">${customerName}</span>
            </div>
            <div class="flex justify-between gap-4 py-1">
                <span class="text-gray-500 dark:text-gray-400">Valor</span>
                <span class="font-semibold text-primary">${amount}</span>
            </div>
        </div>
    `;
}

export function useLoanDecisionDialogs() {
    const store = useKrefasyStore();

    const ensureLoanWithCustomerDetails = async (loan: LoanDecision): Promise<LoanDecision> => {
        if (loan.customerDetails?.defaultPaymentMethod !== undefined && loan.customerDetails?.id) {
            return loan;
        }

        const fullLoan = (await store.fetchLoanById(loan.id)) as LoanDecision;
        return { ...loan, ...fullLoan };
    };

    const showApproveDialog = async (loan: LoanDecision): Promise<boolean> => {
        const paymentMethod = loan.customerDetails?.defaultPaymentMethod;
        const paymentHtml = buildPaymentMethodHtml(paymentMethod, {
            emptyMessage: 'O cliente não tem método de pagamento configurado. Verifique antes de enviar os valores.',
        });

        const summaryResult = await Swal.fire({
            title: 'Aprovar Empréstimo',
            html: `
                ${buildLoanSummaryHtml(loan)}
                <p class="text-left text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    Método de pagamento do cliente
                </p>
                <div class="p-3 rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/30">
                    ${paymentHtml}
                </div>
            `,
            icon: 'info',
            showCancelButton: true,
            confirmButtonText: 'Continuar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            customClass: SWAL_CLASS,
            width: '32rem',
        });

        if (!summaryResult.isConfirmed) return false;

        const confirmResult = await Swal.fire({
            title: 'Confirmar Aprovação',
            html: `
                <p class="text-sm mb-3">Confirma a aprovação do empréstimo <strong>${loan.loanNumber || ''}</strong>?</p>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                    O envio dos valores ficará disponível para processamento após a aprovação.
                </p>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, aprovar!',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d',
            customClass: SWAL_CLASS,
        });

        return confirmResult.isConfirmed;
    };

    const showRejectDialog = async (loan: LoanDecision): Promise<string | null> => {
        const reasonResult = await Swal.fire({
            title: 'Rejeitar Empréstimo',
            html: `
                ${buildLoanSummaryHtml(loan)}
                <p class="text-left text-sm text-gray-600 dark:text-gray-400 mb-2">
                    Informe o motivo da rejeição.
                </p>
            `,
            input: 'textarea',
            inputPlaceholder: 'Descreva o motivo da rejeição...',
            inputAttributes: {
                'aria-label': 'Motivo da rejeição',
                rows: '4',
            },
            inputValidator: (value) => {
                if (!value || !value.trim()) {
                    return 'O motivo da rejeição é obrigatório.';
                }
                return null;
            },
            showCancelButton: true,
            confirmButtonText: 'Continuar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            customClass: SWAL_CLASS,
            width: '32rem',
        });

        if (!reasonResult.isConfirmed || !reasonResult.value) return null;

        const reason = String(reasonResult.value).trim();

        const confirmResult = await Swal.fire({
            title: 'Confirmar Rejeição',
            html: `
                <p class="text-sm mb-3">
                    Tem certeza que deseja rejeitar o empréstimo <strong>${loan.loanNumber || ''}</strong>?
                </p>
                <div class="text-left p-3 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
                    <p class="text-xs text-red-600 dark:text-red-400 mb-1 font-semibold">Motivo informado:</p>
                    <p class="text-sm text-red-800 dark:text-red-200 whitespace-pre-wrap">${reason}</p>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">
                    Esta ação não pode ser desfeita.
                </p>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, rejeitar!',
            cancelButtonText: 'Voltar',
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            customClass: SWAL_CLASS,
            width: '32rem',
        });

        return confirmResult.isConfirmed ? reason : null;
    };

    const executeApprove = async (loan: LoanDecision): Promise<boolean> => {
        try {
            await store.approveManual(loan.id, '');

            await Swal.fire({
                title: 'Sucesso!',
                text: 'Empréstimo aprovado com sucesso.',
                icon: 'success',
                confirmButtonColor: '#28a745',
                customClass: SWAL_CLASS,
            });

            return true;
        } catch (error: any) {
            await Swal.fire({
                title: 'Erro!',
                text: error?.message || 'Erro ao aprovar empréstimo. Tente novamente.',
                icon: 'error',
                confirmButtonColor: '#dc3545',
                customClass: SWAL_CLASS,
            });
            return false;
        }
    };

    const executeReject = async (loan: LoanDecision, reason: string): Promise<boolean> => {
        try {
            await store.approveLoan(loan.id, {
                approved: false,
                rejectionReason: reason,
                modifiedAmount: loan.requestedAmount ?? loan.amount,
            });

            await Swal.fire({
                title: 'Empréstimo Rejeitado',
                text: 'O empréstimo foi rejeitado com sucesso.',
                icon: 'success',
                confirmButtonColor: '#28a745',
                customClass: SWAL_CLASS,
            });

            return true;
        } catch (error: any) {
            await Swal.fire({
                title: 'Erro!',
                text: error?.message || 'Erro ao rejeitar empréstimo. Tente novamente.',
                icon: 'error',
                confirmButtonColor: '#dc3545',
                customClass: SWAL_CLASS,
            });
            return false;
        }
    };

    const handleApprove = async (loan: LoanDecision, onSuccess?: () => Promise<void> | void): Promise<void> => {
        const fullLoan = await ensureLoanWithCustomerDetails(loan);
        const confirmed = await showApproveDialog(fullLoan);
        if (!confirmed) return;

        const success = await executeApprove(fullLoan);
        if (success && onSuccess) {
            await onSuccess();
        }
    };

    const handleReject = async (loan: LoanDecision, onSuccess?: () => Promise<void> | void): Promise<void> => {
        const fullLoan = await ensureLoanWithCustomerDetails(loan);
        const reason = await showRejectDialog(fullLoan);
        if (!reason) return;

        const success = await executeReject(fullLoan, reason);
        if (success && onSuccess) {
            await onSuccess();
        }
    };

    return {
        ensureLoanWithCustomerDetails,
        showApproveDialog,
        showRejectDialog,
        executeApprove,
        executeReject,
        handleApprove,
        handleReject,
    };
}
