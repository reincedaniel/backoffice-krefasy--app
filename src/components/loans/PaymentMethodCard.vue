<template>
    <div
        v-if="display"
        class="rounded-xl border border-teal-200 dark:border-teal-800 bg-gradient-to-br from-teal-50/80 to-white dark:from-teal-900/20 dark:to-gray-900/40 overflow-hidden"
    >
        <div class="px-5 py-4 border-b border-teal-200/80 dark:border-teal-800/80 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div class="min-w-0">
                <div class="flex flex-wrap items-center gap-2">
                    <span class="badge badge-primary text-sm">{{ display.typeLabel }}</span>
                    <span v-if="display.isDefault" class="badge badge-outline-success">Padrão</span>
                    <span
                        class="badge"
                        :class="display.isActive ? 'badge-outline-success' : 'badge-outline-danger'"
                    >
                        {{ display.isActive ? 'Activo' : 'Inactivo' }}
                    </span>
                </div>
                <p v-if="display.typeDescription" class="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {{ display.typeDescription }}
                </p>
            </div>
            <button
                v-if="hasCopyContent"
                type="button"
                class="btn btn-outline-primary btn-sm gap-2 shrink-0"
                @click="copyAll"
            >
                Copiar tudo
            </button>
        </div>

        <div v-if="display.heroFields.length > 0" class="divide-y divide-teal-100 dark:divide-teal-900/40">
            <div
                v-for="(hero, index) in display.heroFields"
                :key="`${hero.label}-${index}`"
                class="px-5 py-4 bg-white/70 dark:bg-gray-900/30"
            >
                <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div class="min-w-0 flex-1">
                        <p class="text-xs font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">
                            {{ hero.label }}
                        </p>
                        <p v-if="hero.sublabel" class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            {{ hero.sublabel }}
                        </p>
                        <p class="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mt-2 break-all font-mono leading-tight">
                            {{ hero.value }}
                        </p>
                    </div>
                    <button
                        type="button"
                        class="btn btn-primary btn-sm shrink-0 self-start sm:self-center"
                        @click="copyValue(hero.value, hero.label)"
                    >
                        Copiar
                    </button>
                </div>
            </div>
        </div>

        <div
            v-if="display.holderDetails.length > 0"
            class="px-5 py-4 border-t border-teal-100 dark:border-teal-900/40"
        >
            <p class="text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">
                Titular
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                    v-for="field in display.holderDetails"
                    :key="field.label"
                    class="rounded-lg bg-white/60 dark:bg-gray-900/25 px-3 py-2.5 border border-gray-200/80 dark:border-gray-700/80"
                >
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ field.label }}</p>
                    <p class="text-sm font-semibold text-gray-900 dark:text-gray-100 break-all mt-0.5">{{ field.value }}</p>
                </div>
            </div>
        </div>

        <div
            v-if="display.bankDetails.length > 0"
            class="px-5 py-4 border-t border-teal-100 dark:border-teal-900/40 bg-slate-50/80 dark:bg-slate-900/20"
        >
            <p class="text-xs font-semibold uppercase tracking-wide text-slate-600 dark:text-slate-300 mb-3">
                Dados bancários
            </p>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div
                    v-for="field in display.bankDetails"
                    :key="field.label"
                    class="rounded-lg bg-white dark:bg-gray-900/40 px-3 py-2.5 border border-slate-200 dark:border-slate-700"
                >
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ field.label }}</p>
                    <p
                        class="text-sm font-semibold text-gray-900 dark:text-gray-100 break-all mt-0.5"
                        :class="{ 'font-mono': isMonospaceField(field.label) }"
                    >
                        {{ field.value }}
                    </p>
                </div>
            </div>
        </div>

        <div
            v-if="display.updatedAt"
            class="px-5 py-2.5 text-xs text-gray-500 dark:text-gray-400 border-t border-teal-100 dark:border-teal-900/40 bg-teal-50/50 dark:bg-teal-900/10"
        >
            Actualizado em {{ display.updatedAt }}
        </div>
    </div>

    <div
        v-else
        class="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-5 py-4"
    >
        <p class="text-sm text-amber-800 dark:text-amber-200">{{ emptyMessage }}</p>
    </div>
</template>

<script lang="ts" setup>
import { computed } from 'vue';
import Swal from 'sweetalert2';
import {
    getPaymentMethodDisplay,
    getPaymentMethodFields,
    type CustomerPaymentMethod,
} from '@/utils/payment-method.utils';

const props = withDefaults(
    defineProps<{
        paymentMethod?: CustomerPaymentMethod | null;
        emptyMessage?: string;
    }>(),
    {
        paymentMethod: null,
        emptyMessage: 'O cliente não tem método de pagamento configurado.',
    }
);

const display = computed(() => getPaymentMethodDisplay(props.paymentMethod));

const hasCopyContent = computed(() => {
    const d = display.value;
    return Boolean(
        d &&
            (d.heroFields.length > 0 || d.holderDetails.length > 0 || d.bankDetails.length > 0)
    );
});

const monospaceLabels = new Set([
    'Número da conta',
    'IBAN',
    'NIB',
    'SWIFT/BIC',
    'Código do banco',
    'Agência',
]);

function isMonospaceField(label: string): boolean {
    return monospaceLabels.has(label);
}

async function copyToClipboard(value: string): Promise<boolean> {
    try {
        await navigator.clipboard.writeText(value);
        return true;
    } catch {
        return false;
    }
}

async function copyValue(value: string, label: string) {
    const copied = await copyToClipboard(value);
    await Swal.fire({
        title: copied ? 'Copiado!' : 'Erro',
        text: copied ? `${label} copiado para a área de transferência.` : 'Não foi possível copiar.',
        icon: copied ? 'success' : 'error',
        timer: copied ? 1500 : undefined,
        showConfirmButton: !copied,
        confirmButtonColor: '#28a745',
    });
}

async function copyAll() {
    const lines = getPaymentMethodFields(props.paymentMethod).map((field) => `${field.label}: ${field.value}`);
    const copied = await copyToClipboard(lines.join('\n'));
    await Swal.fire({
        title: copied ? 'Copiado!' : 'Erro',
        text: copied ? 'Dados do método de pagamento copiados.' : 'Não foi possível copiar.',
        icon: copied ? 'success' : 'error',
        timer: copied ? 1500 : undefined,
        showConfirmButton: !copied,
        confirmButtonColor: '#28a745',
    });
}
</script>
