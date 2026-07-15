import type { Conversation, ConversationStats, Message } from '@/services/messages.service';

export const CONVERSATIONS_TTL_MS = 60_000;
export const MESSAGES_TTL_MS = 120_000;
export const STATS_TTL_MS = 120_000;
export const CLIENTS_TTL_MS = 300_000;

interface CachedMessagesEntry {
    messages: Message[];
    fetchedAt: number;
    lastMessageId: string | null;
}

interface CachedConversationsEntry {
    conversations: Conversation[];
    total: number;
    filtersKey: string;
    fetchedAt: number;
}

interface CachedStatsEntry {
    stats: ConversationStats;
    fetchedAt: number;
}

const messagesCache = new Map<string, CachedMessagesEntry>();
const inFlight = new Map<string, Promise<unknown>>();

let conversationsCache: CachedConversationsEntry | null = null;
let statsCache: CachedStatsEntry | null = null;
let clientsCache: { data: unknown[]; fetchedAt: number } | null = null;
let unreadFetchScheduled: ReturnType<typeof setTimeout> | null = null;

export function isFresh(fetchedAt: number, ttl: number): boolean {
    return Date.now() - fetchedAt < ttl;
}

export function buildFiltersKey(filters?: Record<string, unknown>): string {
    if (!filters) return 'default';
    return JSON.stringify(filters, Object.keys(filters).sort());
}

export async function dedupeRequest<T>(key: string, fn: () => Promise<T>): Promise<T> {
    const existing = inFlight.get(key);
    if (existing) return existing as Promise<T>;

    const promise = fn().finally(() => {
        inFlight.delete(key);
    });
    inFlight.set(key, promise);
    return promise;
}

export function getCachedMessages(conversationId: string): CachedMessagesEntry | null {
    return messagesCache.get(conversationId) ?? null;
}

export function setCachedMessages(conversationId: string, messages: Message[]): void {
    const lastMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;
    messagesCache.set(conversationId, {
        messages: [...messages],
        fetchedAt: Date.now(),
        lastMessageId,
    });
}

export function appendCachedMessage(conversationId: string, message: Message): Message[] {
    const entry = messagesCache.get(conversationId);
    const messages = entry ? [...entry.messages] : [];
    if (!messages.some((m) => m.id === message.id)) {
        messages.push(message);
    }
    setCachedMessages(conversationId, messages);
    return messages;
}

export function getCachedConversations(filtersKey: string): CachedConversationsEntry | null {
    if (!conversationsCache || conversationsCache.filtersKey !== filtersKey) return null;
    if (!isFresh(conversationsCache.fetchedAt, CONVERSATIONS_TTL_MS)) return null;
    return conversationsCache;
}

export function setCachedConversations(
    filtersKey: string,
    conversations: Conversation[],
    total: number
): void {
    conversationsCache = {
        conversations: [...conversations],
        total,
        filtersKey,
        fetchedAt: Date.now(),
    };
}

export function invalidateConversationsCache(): void {
    conversationsCache = null;
}

export function getCachedStats(): ConversationStats | null {
    if (!statsCache || !isFresh(statsCache.fetchedAt, STATS_TTL_MS)) return null;
    return statsCache.stats;
}

export function setCachedStats(stats: ConversationStats): void {
    statsCache = { stats, fetchedAt: Date.now() };
}

export function getCachedClients<T>(): T[] | null {
    if (!clientsCache || !isFresh(clientsCache.fetchedAt, CLIENTS_TTL_MS)) return null;
    return clientsCache.data as T[];
}

export function setCachedClients<T>(data: T[]): void {
    clientsCache = { data: [...data], fetchedAt: Date.now() };
}

export function deriveUnreadFromConversations(conversations: Conversation[]): {
    unread: Conversation[];
    count: number;
} {
    const unread = conversations.filter((c) => c.unreadCount > 0);
    return {
        unread,
        count: unread.reduce((sum, c) => sum + c.unreadCount, 0),
    };
}

export function canUseConversationsForUnread(): boolean {
    return conversationsCache !== null && isFresh(conversationsCache.fetchedAt, CONVERSATIONS_TTL_MS);
}

export function scheduleUnreadRefresh(fn: () => void | Promise<void>, delayMs = 2000): void {
    if (unreadFetchScheduled) clearTimeout(unreadFetchScheduled);
    unreadFetchScheduled = setTimeout(() => {
        unreadFetchScheduled = null;
        void fn();
    }, delayMs);
}

export function clearChatCache(): void {
    messagesCache.clear();
    conversationsCache = null;
    statsCache = null;
    clientsCache = null;
    inFlight.clear();
    if (unreadFetchScheduled) {
        clearTimeout(unreadFetchScheduled);
        unreadFetchScheduled = null;
    }
}

export function touchMessagesCache(conversationId: string): boolean {
    const entry = messagesCache.get(conversationId);
    if (!entry) return false;
    return isFresh(entry.fetchedAt, MESSAGES_TTL_MS);
}
