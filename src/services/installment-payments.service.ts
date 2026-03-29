import apiService from './api';

export interface InstallmentPaymentReceipt {
    id: string;
    loanInstallmentId: string;
    originalFileName: string;
    contentType: string;
    fileSize: number;
    description: string | null;
    downloadUrl: string;
    submittedByUserId: string;
    createdAt: string;
}

export interface InstallmentPaymentReviewRequest {
    approved: boolean;
    notes: string;
    paidAmount: number;
}

async function unwrapList(res: Awaited<ReturnType<typeof apiService.get<InstallmentPaymentReceipt[]>>>): Promise<InstallmentPaymentReceipt[]> {
    if (!res.succeeded && res.data == null) {
        throw new Error(res.message || res.description || 'Não foi possível carregar os comprovativos');
    }
    return res.data ?? [];
}

export async function getInstallmentPaymentReceipts(installmentId: string): Promise<InstallmentPaymentReceipt[]> {
    const res = await apiService.get<InstallmentPaymentReceipt[]>(`/installment-payments/${installmentId}/receipts`);
    return unwrapList(res);
}

export async function reviewInstallmentPayment(
    installmentId: string,
    body: InstallmentPaymentReviewRequest
): Promise<void> {
    const res = await apiService.post<unknown>(`/installment-payments/${installmentId}/review`, body);
    if (!res.succeeded) {
        throw new Error(res.message || res.description || 'Não foi possível guardar a revisão');
    }
}
