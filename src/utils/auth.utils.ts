/** Roles com permissão para aceder ao backoffice Krefasy. */
export const BACKOFFICE_ACCESS_ROLES = ['Admin', 'Partner'] as const;

export type BackofficeAccessRole = (typeof BACKOFFICE_ACCESS_ROLES)[number];

export interface NormalizedUserData {
    id: string;
    email: string;
    name: string;
    roles: string[];
    permissions: string[];
    avatar?: string;
    lastLogin?: string;
}

export interface NormalizedLoginResponse {
    token: string;
    user: NormalizedUserData;
    roles: string[];
    userId?: string;
}

function normalizeRoleName(role: string): string {
    const lower = role.trim().toLowerCase();
    if (lower === 'admin') return 'Admin';
    if (lower === 'partner') return 'Partner';
    if (lower === 'client') return 'Client';
    return role.trim();
}

function asStringArray(value: unknown): string[] {
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is string => typeof item === 'string');
}

/** Une roles do payload de login (top-level + user), incluindo PascalCase da API .NET. */
export function mergeLoginRoles(loginData: {
    roles?: string[];
    Roles?: string[];
    user?: { roles?: string[]; Roles?: string[] };
    User?: { roles?: string[]; Roles?: string[] };
}): string[] {
    const merged = [
        ...asStringArray(loginData.roles),
        ...asStringArray(loginData.Roles),
        ...asStringArray(loginData.user?.roles),
        ...asStringArray(loginData.user?.Roles),
        ...asStringArray(loginData.User?.roles),
        ...asStringArray(loginData.User?.Roles),
    ].map(normalizeRoleName);

    return [...new Set(merged.filter(Boolean))];
}

export function canAccessBackoffice(roles: string[] | undefined | null): boolean {
    if (!roles?.length) return false;
    const normalized = roles.map((role) => role.toLowerCase());
    return BACKOFFICE_ACCESS_ROLES.some((role) => normalized.includes(role.toLowerCase()));
}

/** Normaliza a resposta de login da API (.NET PascalCase → camelCase interno). */
export function normalizeLoginResponse(raw: Record<string, unknown>): NormalizedLoginResponse {
    const userRaw = (raw.user ?? raw.User ?? {}) as Record<string, unknown>;
    const roles = mergeLoginRoles(raw as Parameters<typeof mergeLoginRoles>[0]);
    const userId =
        (raw.userId as string | undefined) ??
        (raw.UserId as string | undefined) ??
        (userRaw.id as string | undefined) ??
        (userRaw.Id as string | undefined) ??
        '';

    const user: NormalizedUserData = {
        id: userId,
        email: String(userRaw.email ?? userRaw.Email ?? ''),
        name: String(userRaw.name ?? userRaw.Name ?? ''),
        roles,
        permissions: asStringArray(userRaw.permissions ?? userRaw.Permissions),
        avatar: (userRaw.avatar ?? userRaw.Avatar) as string | undefined,
        lastLogin: (userRaw.lastLogin ?? userRaw.LastLogin) as string | undefined,
    };

    return {
        token: String(raw.token ?? raw.Token ?? ''),
        user,
        roles,
        userId: userId || user.id,
    };
}
