export interface PaymentMethodType {
    id: string;
    name: string;
    code: string;
    description?: string;
    isActive?: boolean;
    createdAt?: string;
}

export interface CustomerPaymentMethod {
    id: string;
    customerId: string;
    paymentMethodTypeId: string;
    displayName?: string | null;
    isDefault?: boolean;
    isActive?: boolean;
    pixKey?: string | null;
    pixKeyType?: string | null;
    mBwayPhoneNumber?: string | null;
    bankName?: string | null;
    bankCode?: string | null;
    accountHolderName?: string | null;
    accountNumber?: string | null;
    agencyNumber?: string | null;
    iban?: string | null;
    nib?: string | null;
    swiftCode?: string | null;
    accountType?: string | null;
    paymentMethodType?: PaymentMethodType;
    createdAt?: string | null;
    updatedAt?: string | null;
}

export interface PaymentMethodField {
    label: string;
    value: string;
}

export interface PaymentMethodHeroField {
    label: string;
    value: string;
    sublabel?: string;
}

export interface PaymentMethodDisplay {
    typeLabel: string;
    typeDescription?: string;
    isDefault: boolean;
    isActive: boolean;
    heroFields: PaymentMethodHeroField[];
    holderDetails: PaymentMethodField[];
    bankDetails: PaymentMethodField[];
    updatedAt?: string;
}

type FieldKey = keyof CustomerPaymentMethod;

interface FieldMapping {
    key: FieldKey;
    label: string;
}

const HOLDER_FIELDS: FieldMapping[] = [
    { key: 'accountHolderName', label: 'Titular' },
    { key: 'displayName', label: 'Nome de exibição' },
];

const BANK_FIELDS: FieldMapping[] = [
    { key: 'bankName', label: 'Banco' },
    { key: 'bankCode', label: 'Código do banco' },
    { key: 'agencyNumber', label: 'Agência' },
    { key: 'accountNumber', label: 'Número da conta' },
    { key: 'accountType', label: 'Tipo de conta' },
    { key: 'iban', label: 'IBAN' },
    { key: 'nib', label: 'NIB' },
    { key: 'swiftCode', label: 'SWIFT/BIC' },
];

function getFieldValue(paymentMethod: CustomerPaymentMethod, key: FieldKey): string | null {
    const value = paymentMethod[key];
    if (value === null || value === undefined) return null;
    if (typeof value === 'string' && value.trim() === '') return null;
    return String(value).trim();
}

function formatDateTime(value?: string | null): string | null {
    if (!value || !value.trim()) return null;
    try {
        return new Date(value).toLocaleString('pt-BR');
    } catch {
        return value;
    }
}

function pushDetail(fields: PaymentMethodField[], label: string, value: string | null | undefined) {
    if (value !== null && value !== undefined && String(value).trim() !== '') {
        fields.push({ label, value: String(value).trim() });
    }
}

function dedupeFields(fields: PaymentMethodField[]): PaymentMethodField[] {
    const seen = new Set<string>();
    return fields.filter((field) => {
        const key = `${field.label}:${field.value}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
}

function buildHeroFields(paymentMethod: CustomerPaymentMethod): PaymentMethodHeroField[] {
    const heroes: PaymentMethodHeroField[] = [];
    const typeCode = (paymentMethod.paymentMethodType?.code || '').toUpperCase();

    const pixKey = getFieldValue(paymentMethod, 'pixKey');
    if (pixKey) {
        const pixKeyType = getFieldValue(paymentMethod, 'pixKeyType');
        heroes.push({
            label: typeCode === 'MBWAY' || typeCode === 'MB_WAY' ? 'Contacto MB Way' : 'Chave PIX',
            value: pixKey,
            sublabel: pixKeyType || undefined,
        });
    }

    const mbwayPhone = getFieldValue(paymentMethod, 'mBwayPhoneNumber');
    if (mbwayPhone && mbwayPhone !== pixKey) {
        heroes.push({
            label: 'Telefone MB Way',
            value: mbwayPhone,
        });
    }

    return heroes;
}

function buildHolderDetails(paymentMethod: CustomerPaymentMethod): PaymentMethodField[] {
    const fields: PaymentMethodField[] = [];

    for (const mapping of HOLDER_FIELDS) {
        const value = getFieldValue(paymentMethod, mapping.key);
        if (!value) continue;

        if (mapping.key === 'displayName') {
            const titular = getFieldValue(paymentMethod, 'accountHolderName');
            if (titular && titular === value) continue;
        }

        pushDetail(fields, mapping.label, value);
    }

    return dedupeFields(fields);
}

function buildBankDetails(paymentMethod: CustomerPaymentMethod): PaymentMethodField[] {
    const fields: PaymentMethodField[] = [];

    for (const mapping of BANK_FIELDS) {
        pushDetail(fields, mapping.label, getFieldValue(paymentMethod, mapping.key));
    }

    return dedupeFields(fields);
}

function hasPaymentMethodContent(display: PaymentMethodDisplay): boolean {
    return (
        display.heroFields.length > 0 ||
        display.holderDetails.length > 0 ||
        display.bankDetails.length > 0
    );
}

export function getPaymentMethodDisplay(
    paymentMethod: CustomerPaymentMethod | null | undefined
): PaymentMethodDisplay | null {
    if (!paymentMethod) return null;

    const type = paymentMethod.paymentMethodType;
    const heroFields = buildHeroFields(paymentMethod);
    const holderDetails = buildHolderDetails(paymentMethod);
    const bankDetails = buildBankDetails(paymentMethod);

    return {
        typeLabel: type?.name || type?.code || 'Método de pagamento',
        typeDescription: type?.description || undefined,
        isDefault: paymentMethod.isDefault === true,
        isActive: paymentMethod.isActive !== false,
        heroFields,
        holderDetails,
        bankDetails,
        updatedAt: formatDateTime(paymentMethod.updatedAt) || undefined,
    };
}

/** Lista plana para cópia / diálogos (sem IDs). */
export function getPaymentMethodFields(paymentMethod: CustomerPaymentMethod | null | undefined): PaymentMethodField[] {
    const display = getPaymentMethodDisplay(paymentMethod);
    if (!display) return [];

    const fields: PaymentMethodField[] = [
        { label: 'Tipo', value: display.typeLabel },
    ];

    if (display.typeDescription) {
        fields.push({ label: 'Descrição', value: display.typeDescription });
    }

    for (const hero of display.heroFields) {
        fields.push({
            label: hero.sublabel ? `${hero.label} (${hero.sublabel})` : hero.label,
            value: hero.value,
        });
    }

    fields.push(...display.holderDetails);
    fields.push(...display.bankDetails);

    if (display.isDefault) {
        fields.push({ label: 'Método padrão', value: 'Sim' });
    }

    fields.push({ label: 'Estado', value: display.isActive ? 'Activo' : 'Inactivo' });

    if (display.updatedAt) {
        fields.push({ label: 'Actualizado em', value: display.updatedAt });
    }

    return dedupeFields(fields);
}

export function getPaymentMethodTypeLabel(paymentMethod: CustomerPaymentMethod | null | undefined): string {
    if (!paymentMethod) return 'Não configurado';
    return paymentMethod.paymentMethodType?.name || paymentMethod.paymentMethodType?.code || 'Método de pagamento';
}

export function buildPaymentMethodHtml(
    paymentMethod: CustomerPaymentMethod | null | undefined,
    options?: { showTitle?: boolean; emptyMessage?: string }
): string {
    const showTitle = options?.showTitle ?? true;
    const emptyMessage = options?.emptyMessage ?? 'O cliente não tem método de pagamento configurado.';

    const display = getPaymentMethodDisplay(paymentMethod);
    if (!display || !hasPaymentMethodContent(display)) {
        return `<div class="text-left text-sm text-amber-600 dark:text-amber-400">${emptyMessage}</div>`;
    }

    const titleHtml = showTitle
        ? `<p class="font-semibold text-gray-800 dark:text-gray-200 mb-2">${display.typeLabel}</p>`
        : '';

    const heroHtml = display.heroFields
        .map(
            (hero) =>
                `<div class="py-2 border-b border-gray-200 dark:border-gray-700 last:border-0">` +
                `<p class="text-xs text-gray-500 dark:text-gray-400">${hero.label}${hero.sublabel ? ` · ${hero.sublabel}` : ''}</p>` +
                `<p class="font-semibold text-gray-900 dark:text-gray-100 break-all">${hero.value}</p>` +
                `</div>`
        )
        .join('');

    const detailsHtml = [...display.holderDetails, ...display.bankDetails]
        .map(
            (field) =>
                `<div class="flex justify-between gap-4 py-1 border-b border-gray-200 dark:border-gray-700 last:border-0">` +
                `<span class="text-gray-500 dark:text-gray-400 shrink-0">${field.label}</span>` +
                `<span class="font-medium text-gray-800 dark:text-gray-200 text-right break-all">${field.value}</span>` +
                `</div>`
        )
        .join('');

    return `<div class="text-left text-sm">${titleHtml}<div class="space-y-0">${heroHtml}${detailsHtml}</div></div>`;
}
