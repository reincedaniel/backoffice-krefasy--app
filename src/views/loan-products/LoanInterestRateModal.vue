<template>
    <div v-if="show" class="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
        <div class="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div class="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" aria-hidden="true" @click="close"></div>

            <span class="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div class="inline-block align-bottom bg-white dark:bg-gray-800 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
                <div class="bg-white dark:bg-gray-800 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div class="sm:flex sm:items-start">
                        <div class="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                            <h3 class="text-lg leading-6 font-medium text-gray-900 dark:text-white" id="modal-title">
                                {{ isEdit ? 'Editar Taxa de Juros' : 'Nova Taxa de Juros' }}
                            </h3>
                            <p v-if="loanProductName" class="mt-1 text-sm text-gray-500 dark:text-gray-400">
                                {{ loanProductName }}
                            </p>
                            <div class="mt-4">
                                <form @submit.prevent="save">
                                    <div class="space-y-4">
                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Período de Juros *</label>
                                            <select
                                                v-model="form.interestPeriodId"
                                                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:text-white"
                                                :class="{ 'border-red-500': errors.interestPeriodId }"
                                            >
                                                <option value="">Selecione um período</option>
                                                <option v-for="period in availablePeriods" :key="period.id" :value="period.id">
                                                    {{ period.displayName }} ({{ period.daysInPeriod }} dias)
                                                </option>
                                            </select>
                                            <p v-if="errors.interestPeriodId" class="mt-1 text-sm text-red-600">{{ errors.interestPeriodId }}</p>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Taxa (% ao período) *</label>
                                            <input
                                                v-model.number="form.ratePercent"
                                                type="number"
                                                step="0.01"
                                                min="0.01"
                                                max="100"
                                                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:text-white"
                                                :class="{ 'border-red-500': errors.ratePercent }"
                                                placeholder="Ex: 2,5"
                                            />
                                            <p v-if="errors.ratePercent" class="mt-1 text-sm text-red-600">{{ errors.ratePercent }}</p>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Válido de *</label>
                                            <input
                                                v-model="form.effectiveFromLocal"
                                                type="datetime-local"
                                                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:text-white"
                                                :class="{ 'border-red-500': errors.effectiveFrom }"
                                            />
                                            <p v-if="errors.effectiveFrom" class="mt-1 text-sm text-red-600">{{ errors.effectiveFrom }}</p>
                                        </div>

                                        <div>
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Válido até *</label>
                                            <input
                                                v-model="form.effectiveToLocal"
                                                type="datetime-local"
                                                class="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 shadow-sm focus:border-primary focus:ring-primary sm:text-sm dark:bg-gray-700 dark:text-white"
                                                :class="{ 'border-red-500': errors.effectiveTo }"
                                            />
                                            <p v-if="errors.effectiveTo" class="mt-1 text-sm text-red-600">{{ errors.effectiveTo }}</p>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="bg-gray-50 dark:bg-gray-900/50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                    <button
                        type="button"
                        class="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary text-base font-medium text-white hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:ml-3 sm:w-auto sm:text-sm"
                        @click="save"
                        :disabled="loading"
                    >
                        {{ loading ? 'Salvando...' : (isEdit ? 'Atualizar' : 'Criar') }}
                    </button>
                    <button
                        type="button"
                        class="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-gray-600 shadow-sm px-4 py-2 bg-white dark:bg-gray-800 text-base font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                        @click="close"
                    >
                        Cancelar
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import Swal from 'sweetalert2';
import type { InterestRate } from '@/services/loan-products.service';
import type { LoanInterestRateCreateUpdate } from '@/services/loan-interest-rates.service';
import { loanInterestRateService } from '@/services/loan-interest-rates.service';
import { interestPeriodService } from '@/services/interest-periods.service';

const props = defineProps<{
    show: boolean;
    loanProductId: string;
    loanProductName?: string;
    interestRate?: InterestRate | null;
    isEdit: boolean;
}>();

const emit = defineEmits<{
    close: [];
    saved: [];
}>();

function toDatetimeLocalValue(iso: string): string {
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function defaultRangeLocal(): { from: string; to: string } {
    const from = new Date();
    from.setHours(0, 0, 0, 0);
    const to = new Date(from);
    to.setFullYear(to.getFullYear() + 1);
    return {
        from: toDatetimeLocalValue(from.toISOString()),
        to: toDatetimeLocalValue(to.toISOString())
    };
}

const form = ref({
    interestPeriodId: '',
    ratePercent: 1,
    effectiveFromLocal: '',
    effectiveToLocal: ''
});

const errors = ref<Record<string, string>>({});
const loading = ref(false);
const availablePeriods = ref<Array<{ id: string; displayName: string; daysInPeriod: number }>>([]);

const resetForm = () => {
    const r = defaultRangeLocal();
    form.value = {
        interestPeriodId: '',
        ratePercent: 1,
        effectiveFromLocal: r.from,
        effectiveToLocal: r.to
    };
    errors.value = {};
};

const validateForm = (): boolean => {
    errors.value = {};

    const payload: LoanInterestRateCreateUpdate = {
        loanProductId: props.loanProductId,
        interestPeriodId: form.value.interestPeriodId,
        ratePercent: form.value.ratePercent,
        effectiveFrom: form.value.effectiveFromLocal ? new Date(form.value.effectiveFromLocal).toISOString() : '',
        effectiveTo: form.value.effectiveToLocal ? new Date(form.value.effectiveToLocal).toISOString() : ''
    };

    const apiErrors = loanInterestRateService.validateLoanInterestRate(payload);
    if (apiErrors.length) {
        apiErrors.forEach((msg) => {
            if (msg.includes('Período')) errors.value.interestPeriodId = msg;
            else if (msg.includes('Taxa')) errors.value.ratePercent = msg;
            else if (msg.includes('início') || msg.includes('Data de início')) errors.value.effectiveFrom = msg;
            else if (msg.includes('fim') || msg.includes('Data de fim')) errors.value.effectiveTo = msg;
        });
        if (!errors.value.interestPeriodId && !errors.value.ratePercent && !errors.value.effectiveFrom && !errors.value.effectiveTo) {
            errors.value.ratePercent = apiErrors[0];
        }
    }

    if (!form.value.interestPeriodId?.trim()) {
        errors.value.interestPeriodId = 'Período de juros é obrigatório';
    }

    return Object.keys(errors.value).length === 0;
};

const save = async () => {
    if (!validateForm()) return;

    const data: LoanInterestRateCreateUpdate = {
        loanProductId: props.loanProductId,
        interestPeriodId: form.value.interestPeriodId,
        ratePercent: form.value.ratePercent,
        effectiveFrom: new Date(form.value.effectiveFromLocal).toISOString(),
        effectiveTo: new Date(form.value.effectiveToLocal).toISOString()
    };

    loading.value = true;
    try {
        let response;
        if (props.isEdit && props.interestRate) {
            response = await loanInterestRateService.updateLoanInterestRate(props.interestRate.id, data);
        } else {
            response = await loanInterestRateService.createLoanInterestRate(data);
        }

        if (response.succeeded) {
            emit('saved');
        } else {
            const msg =
                response.message ||
                response.description ||
                response.errors?.join(', ') ||
                'Não foi possível salvar a taxa de juros.';
            await Swal.fire({ title: 'Erro', text: msg, icon: 'error' });
        }
    } catch (e: any) {
        console.error('Erro ao salvar taxa de juros:', e);
        await Swal.fire({
            title: 'Erro',
            text: e?.message || 'Erro ao salvar taxa de juros.',
            icon: 'error'
        });
    } finally {
        loading.value = false;
    }
};

const close = () => {
    emit('close');
};

const loadPeriods = async () => {
    try {
        const res = await interestPeriodService.getInterestPeriods();
        if (res.succeeded && res.data) {
            availablePeriods.value = res.data.map((p) => ({
                id: p.id,
                displayName: p.displayName,
                daysInPeriod: p.daysInPeriod
            }));
        }
    } catch (e) {
        console.error('Erro ao carregar períodos:', e);
    }
};

watch(
    () => props.show,
    (open) => {
        if (open) {
            void loadPeriods();
            if (props.isEdit && props.interestRate) {
                const rate = props.interestRate;
                form.value = {
                    interestPeriodId: rate.interestPeriodId,
                    ratePercent: rate.ratePercent,
                    effectiveFromLocal: toDatetimeLocalValue(rate.effectiveFrom),
                    effectiveToLocal: toDatetimeLocalValue(rate.effectiveTo)
                };
                errors.value = {};
            } else {
                resetForm();
            }
        }
    }
);
</script>
