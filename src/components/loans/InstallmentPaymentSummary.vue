<template>
    <div
        class="rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 overflow-hidden"
        :class="compact ? 'text-sm' : ''"
    >
        <div class="px-4 py-3 space-y-2">
            <div class="flex items-center justify-between gap-3">
                <span class="text-gray-500 dark:text-gray-400">Valor da parcela</span>
                <span class="font-semibold text-gray-900 dark:text-gray-100">{{ formatAmount(summary.baseAmount) }}</span>
            </div>

            <div
                v-if="summary.isOverdue && summary.lateInterest > 0"
                class="flex items-start justify-between gap-3 pt-2 border-t border-gray-200/80 dark:border-gray-700/80"
            >
                <div class="min-w-0">
                    <span class="text-red-600 dark:text-red-400">Juros de mora ({{ summary.daysOverdue }} dias)</span>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ lateHint }}</p>
                </div>
                <span class="font-semibold text-red-600 dark:text-red-400 shrink-0">+ {{ formatAmount(summary.lateInterest) }}</span>
            </div>

            <div
                class="flex items-center justify-between gap-3 pt-2 border-t border-gray-200 dark:border-gray-700"
                :class="summary.isOverdue && summary.lateInterest > 0 ? 'mt-1' : ''"
            >
                <span class="font-semibold text-gray-800 dark:text-gray-200">Total a pagar</span>
                <span
                    class="font-bold text-primary"
                    :class="compact ? 'text-lg' : 'text-xl'"
                >
                    {{ formatAmount(summary.totalDue) }}
                </span>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import {
    calculateLateInterest,
    formatLateInterestHint,
    type LateInterestInstallment,
} from '@/utils/late-interest.utils';

const props = withDefaults(
    defineProps<{
        installment: LateInterestInstallment;
        currencyCode?: string | null;
        currencySymbol?: string | null;
        formatCurrency?: (amount: number) => string;
        compact?: boolean;
    }>(),
    {
        currencyCode: 'AOA',
        currencySymbol: undefined,
        formatCurrency: undefined,
        compact: false,
    }
);

const summary = computed(() => calculateLateInterest(props.installment, props.currencyCode));

const lateHint = computed(() => formatLateInterestHint(summary.value));

function formatAmount(amount: number): string {
    if (props.formatCurrency) {
        return props.formatCurrency(amount);
    }

    const code = props.currencyCode || 'AOA';
    try {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: code,
            minimumFractionDigits: 2,
        }).format(amount);
    } catch {
        const symbol = props.currencySymbol || code;
        return `${symbol} ${amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }
}
</script>
