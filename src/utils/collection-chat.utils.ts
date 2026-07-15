import {
    formatCollectionAmount,
    type CollectionStatus,
} from '@/utils/collections.utils';

export interface CollectionChatContext {
    clientId: string;
    clientName: string;
    loanId: string;
    loanNumber?: string;
    installmentNumber?: number;
    dueDate: string;
    amount: number;
    lateInterest: number;
    totalDue: number;
    daysOverdue: number;
    isOverdue: boolean;
    collectionStatus: CollectionStatus;
    currencyCode?: string;
    currencySymbol?: string;
}

export interface CollectionChatMeta {
    subject: string;
    category: string;
    priority: string;
}

function formatDueDate(dateStr: string): string {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('pt-BR');
}

function fmt(ctx: CollectionChatContext, amount: number): string {
    return formatCollectionAmount(amount, ctx.currencyCode || 'AOA', ctx.currencySymbol);
}

function interpolate(template: string, ctx: CollectionChatContext): string {
    const dueDate = formatDueDate(ctx.dueDate);
    const amount = fmt(ctx, ctx.amount);
    const totalDue = fmt(ctx, ctx.totalDue);
    const lateInterest = fmt(ctx, ctx.lateInterest);
    const installmentLabel = ctx.installmentNumber ? `#${ctx.installmentNumber}` : 'da parcela';
    const loanRef = ctx.loanNumber ? ` (empréstimo ${ctx.loanNumber})` : '';

    return template
        .replace(/\{clientName\}/g, ctx.clientName)
        .replace(/\{installmentNumber\}/g, installmentLabel)
        .replace(/\{dueDate\}/g, dueDate)
        .replace(/\{amount\}/g, amount)
        .replace(/\{lateInterest\}/g, lateInterest)
        .replace(/\{totalDue\}/g, totalDue)
        .replace(/\{daysOverdue\}/g, String(ctx.daysOverdue))
        .replace(/\{loanNumber\}/g, ctx.loanNumber || ctx.loanId.slice(0, 8))
        .replace(/\{loanRef\}/g, loanRef);
}

function buildOverdueVariants(ctx: CollectionChatContext): string[] {
    const moraPart = ctx.lateInterest > 0
        ? ` O valor actualizado é {totalDue}, incluindo {lateInterest} de juros de mora.`
        : ` O valor em dívida é {totalDue}.`;

    return [
        interpolate(
            `Olá {clientName}, identificámos que a parcela {installmentNumber}{loanRef} venceu em {dueDate} e encontra-se em atraso há {daysOverdue} dia(s).${moraPart} Pode regularizar o pagamento ou indicar-nos se precisa de apoio?`,
            ctx
        ),
        interpolate(
            `Prezado(a) {clientName}, a parcela {installmentNumber}{loanRef} está vencida desde {dueDate} ({daysOverdue} dia(s) de atraso). Total a regularizar: {totalDue}. Aguardamos o seu contacto.`,
            ctx
        ),
    ];
}

function buildDueSoonVariants(ctx: CollectionChatContext): string[] {
    return [
        interpolate(
            `Olá {clientName}, lembramos que a parcela {installmentNumber}{loanRef} vence em {dueDate}. Valor: {totalDue}. Precisa de ajuda com o pagamento?`,
            ctx
        ),
        interpolate(
            `Prezado(a) {clientName}, a parcela {installmentNumber}{loanRef} está prevista para {dueDate}, no valor de {totalDue}. Estamos disponíveis para esclarecer dúvidas.`,
            ctx
        ),
    ];
}

function buildOnTimeVariants(ctx: CollectionChatContext): string[] {
    return [
        interpolate(
            `Olá {clientName}, a parcela {installmentNumber}{loanRef} está agendada para {dueDate}, no valor de {totalDue}. Confirmamos o vencimento e ficamos à disposição.`,
            ctx
        ),
        interpolate(
            `Prezado(a) {clientName}, informamos que a parcela {installmentNumber}{loanRef} vence em {dueDate}. Valor: {amount}. Pode contar connosco se precisar de apoio.`,
            ctx
        ),
    ];
}

export function getCollectionQuickMessageVariants(ctx: CollectionChatContext): string[] {
    if (ctx.isOverdue || ctx.daysOverdue > 0) {
        return buildOverdueVariants(ctx);
    }
    if (ctx.collectionStatus === 'due_soon') {
        return buildDueSoonVariants(ctx);
    }
    return buildOnTimeVariants(ctx);
}

export function buildCollectionQuickMessage(
    ctx: CollectionChatContext,
    templateIndex = 0
): string {
    const variants = getCollectionQuickMessageVariants(ctx);
    const index = Math.min(Math.max(templateIndex, 0), variants.length - 1);
    return variants[index];
}

export function resolveCollectionChatMeta(ctx: CollectionChatContext): CollectionChatMeta {
    const installmentLabel = ctx.installmentNumber ? `#${ctx.installmentNumber}` : '';
    const subject = ctx.isOverdue
        ? `Cobrança — Parcela ${installmentLabel} em atraso`.trim()
        : `Cobrança — Parcela ${installmentLabel}`.trim();

    return {
        subject: subject || 'Cobrança de parcela',
        category: 'PAYMENT_ISSUE',
        priority: ctx.isOverdue ? 'HIGH' : ctx.collectionStatus === 'due_soon' ? 'MEDIUM' : 'LOW',
    };
}

export function resolveCollectionStatusFromLate(
    daysOverdue: number,
    dueDate: string
): CollectionStatus {
    if (daysOverdue > 0) return 'overdue';

    const due = new Date(dueDate);
    if (Number.isNaN(due.getTime())) return 'on_time';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    const diffDays = Math.floor((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays >= 0 && diffDays <= 7) return 'due_soon';
    return 'on_time';
}
