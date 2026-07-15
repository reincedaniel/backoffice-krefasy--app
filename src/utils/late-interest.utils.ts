export interface LateInterestInstallment {
    amount: number;
    dueDate: string;
    isPaid?: boolean;
    isOverdue?: boolean;
    paidDate?: string | null;
}

export interface LateInterestConfig {
    dailyPercent: number;
    minDailyCharge: number;
    maxPercent: number;
    currencyCode: string;
}

export interface LateInterestResult {
    daysOverdue: number;
    dailyPercent: number;
    dailyCharge: number;
    lateInterest: number;
    baseAmount: number;
    totalDue: number;
    isOverdue: boolean;
    config: LateInterestConfig;
}

function round2(value: number): number {
    return Math.round(value * 100) / 100;
}

function parseEnvNumber(value: string | undefined, fallback: number): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function startOfDay(date: Date): Date {
    return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function getLateInterestConfig(currencyCode?: string | null): LateInterestConfig {
    const code = (currencyCode || 'AOA').toUpperCase();
    const dailyPercent = parseEnvNumber(import.meta.env.VITE_LATE_INTEREST_DAILY_PERCENT, 0.2);
    const maxPercent = parseEnvNumber(import.meta.env.VITE_LATE_INTEREST_MAX_PERCENT, 50);

    let minDailyCharge = parseEnvNumber(import.meta.env.VITE_LATE_INTEREST_MIN_AOA, 5);
    if (code === 'BRL') {
        minDailyCharge = parseEnvNumber(import.meta.env.VITE_LATE_INTEREST_MIN_BRL, 5);
    } else if (code === 'EUR') {
        minDailyCharge = parseEnvNumber(import.meta.env.VITE_LATE_INTEREST_MIN_EUR, 5);
    }

    return {
        dailyPercent,
        minDailyCharge,
        maxPercent,
        currencyCode: code,
    };
}

export function getDaysOverdue(
    installment: LateInterestInstallment,
    referenceDate: Date = new Date()
): number {
    if (installment.isPaid) return 0;
    if (!installment.dueDate) return 0;

    const due = startOfDay(new Date(installment.dueDate));
    const ref = startOfDay(referenceDate);
    if (Number.isNaN(due.getTime())) return 0;

    const diffMs = ref.getTime() - due.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
}

export function calculateLateInterest(
    installment: LateInterestInstallment,
    currencyCode?: string | null
): LateInterestResult {
    const config = getLateInterestConfig(currencyCode);
    const baseAmount = round2(Number(installment.amount) || 0);
    const daysOverdue = getDaysOverdue(installment);

    if (installment.isPaid || daysOverdue <= 0) {
        return {
            daysOverdue: 0,
            dailyPercent: config.dailyPercent,
            dailyCharge: 0,
            lateInterest: 0,
            baseAmount,
            totalDue: baseAmount,
            isOverdue: false,
            config,
        };
    }

    const dailyFromPercent = baseAmount * (config.dailyPercent / 100);
    const dailyCharge = round2(Math.max(dailyFromPercent, config.minDailyCharge));
    const uncappedLateInterest = dailyCharge * daysOverdue;
    const cap = baseAmount * (config.maxPercent / 100);
    const lateInterest = round2(Math.min(uncappedLateInterest, cap));

    return {
        daysOverdue,
        dailyPercent: config.dailyPercent,
        dailyCharge,
        lateInterest,
        baseAmount,
        totalDue: round2(baseAmount + lateInterest),
        isOverdue: true,
        config,
    };
}

export function getInstallmentAmountDue(
    installment: LateInterestInstallment,
    currencyCode?: string | null
): number {
    return calculateLateInterest(installment, currencyCode).totalDue;
}

export function formatLateInterestHint(result: LateInterestResult): string {
    const { config, daysOverdue, dailyPercent, dailyCharge } = result;
    const floorLabel = config.minDailyCharge.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });
    return `${dailyPercent}%/dia (mín. ${floorLabel} ${config.currencyCode}/dia) · ${daysOverdue} dia(s) · tecto ${config.maxPercent}%`;
}
