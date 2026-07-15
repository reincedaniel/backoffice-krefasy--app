<template>
    <div class="p-6 space-y-6">
        <div
            v-if="isPending"
            class="p-4 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800"
        >
            <p class="text-sm text-amber-800 dark:text-amber-200">
                Este empréstimo ainda está pendente. Aprove-o para poder enviar o valor ao cliente.
            </p>
        </div>

        <div
            v-else-if="isApproved"
            class="p-4 rounded-lg border border-green-200 bg-green-50 dark:bg-green-900/20 dark:border-green-800"
        >
            <p class="text-sm text-green-800 dark:text-green-200">
                Empréstimo aprovado. Utilize os dados abaixo para enviar o valor ao cliente.
            </p>
        </div>

        <!-- Resumo do envio -->
        <div class="p-4 bg-primary/5 dark:bg-primary/10 rounded-lg border border-primary/20">
            <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                <icon-dollar-sign class="w-4 h-4 mr-2" />
                Resumo do Envio
            </h5>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="flex flex-col gap-1">
                    <span class="text-white-dark text-sm">Valor a transferir</span>
                    <span class="font-bold text-2xl text-primary">{{ formatCurrency(transferAmount) }}</span>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-white-dark text-sm">Estado</span>
                    <span class="font-semibold">{{ statusLabel }}</span>
                </div>
                <div v-if="loan.currencyName" class="flex flex-col gap-1">
                    <span class="text-white-dark text-sm">Moeda</span>
                    <span class="font-semibold">{{ loan.currencyName }} ({{ loan.currencySymbol || loan.currencyCode }})</span>
                </div>
            </div>
        </div>

        <!-- Cliente -->
        <div class="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
            <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                <icon-users class="w-4 h-4 mr-2" />
                Cliente
            </h5>
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div class="flex flex-col gap-1">
                    <span class="text-white-dark text-sm">Nome</span>
                    <span class="font-semibold">{{ customerName }}</span>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-white-dark text-sm">Email</span>
                    <span class="font-semibold break-all">{{ customerEmail }}</span>
                </div>
                <div class="flex flex-col gap-1">
                    <span class="text-white-dark text-sm">Telefone</span>
                    <span class="font-semibold">{{ customerPhone }}</span>
                </div>
            </div>
        </div>

        <!-- Método de pagamento -->
        <div>
            <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                <icon-credit-card class="w-4 h-4 mr-2" />
                Dados para Transferência
            </h5>
            <PaymentMethodCard :payment-method="paymentMethod" />
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import IconDollarSign from '@/components/icon/icon-dollar-sign.vue';
import IconUsers from '@/components/icon/icon-users.vue';
import IconCreditCard from '@/components/icon/icon-credit-card.vue';
import PaymentMethodCard from '@/components/loans/PaymentMethodCard.vue';
import type { CustomerPaymentMethod } from '@/utils/payment-method.utils';

interface DisbursementLoan {
    loanStatusName?: string;
    status?: string;
    requestedAmount?: number;
    approvedAmount?: number;
    amount?: number;
    currencyName?: string;
    currencySymbol?: string;
    currencyCode?: string;
    customerName?: string;
    customerEmail?: string;
    customerDetails?: {
        fullName?: string;
        email?: string;
        phoneNumber?: string;
    };
}

const props = defineProps<{
    loan: DisbursementLoan;
    paymentMethod?: CustomerPaymentMethod | null;
    formatCurrency: (amount: number) => string;
}>();

const status = computed(() => props.loan.loanStatusName || props.loan.status || '');

const isPending = computed(() => {
    const value = status.value.toLowerCase();
    return value === 'pendente' || value === 'pending';
});

const isApproved = computed(() => {
    const value = status.value.toLowerCase();
    return value === 'aprovado' || value === 'approved' || value === 'ativo' || value === 'active';
});

const statusLabel = computed(() => props.loan.loanStatusName || props.loan.status || 'N/A');

const transferAmount = computed(() => {
    if (props.loan.approvedAmount && props.loan.approvedAmount > 0) {
        return props.loan.approvedAmount;
    }
    return props.loan.requestedAmount ?? props.loan.amount ?? 0;
});

const customerName = computed(() => props.loan.customerDetails?.fullName || props.loan.customerName || 'N/A');
const customerEmail = computed(() => props.loan.customerDetails?.email || props.loan.customerEmail || 'N/A');
const customerPhone = computed(() => props.loan.customerDetails?.phoneNumber || 'N/A');
</script>
