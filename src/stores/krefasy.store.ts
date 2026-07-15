import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService, UserData } from '@/services/auth.service';
import { canAccessBackoffice } from '@/utils/auth.utils';
import { getLoggedUserId, getPartnerRoleLabel } from '@/utils/partner-scope.utils';
import { customerService, Customer } from '@/services/customers.service';
import { loansService, Loan, LoanListResponse, LoanStats } from '@/services/loans.service';
import { buildDashboardStatsFromLoans, type DashboardLoan } from '@/utils/dashboard-charts.utils';
import { parcelsService, Parcel, ParcelListResponse, ParcelStats } from '@/services/parcels.service';
import {
    messagesService,
    Conversation,
    Message,
    ConversationListResponse,
    CreateConversationRequest,
    ConversationStats,
    CreateMessageRequest,
} from '@/services/messages.service';
import {
    appendCachedMessage,
    buildFiltersKey,
    canUseConversationsForUnread,
    dedupeRequest,
    deriveUnreadFromConversations,
    getCachedConversations,
    getCachedMessages,
    getCachedStats,
    invalidateConversationsCache,
    isFresh,
    MESSAGES_TTL_MS,
    scheduleUnreadRefresh,
    setCachedConversations,
    setCachedMessages,
    setCachedStats,
    getCachedClients,
    setCachedClients,
    clearChatCache,
    touchMessagesCache,
} from '@/utils/chat-cache.utils';

export const useKrefasyStore = defineStore('krefasy', () => {
    // Estado da autenticação
    const currentUser = ref<UserData | null>(null);
    const isAuthenticated = ref(false);
    const authLoading = ref(false);

    // Estado dos customers
    const clients = ref<Customer[]>([]);
    const clientsLoading = ref(false);
    const clientsTotal = ref(0);
    const clientsPage = ref(1);
    const clientsLimit = ref(20);
    const selectedClient = ref<Customer | null>(null);

    // Estado dos empréstimos
    const loans = ref<Loan[]>([]);
    const loansLoading = ref(false);
    const loansTotal = ref(0);
    const loansPage = ref(1);
    const loansLimit = ref(20);
    const selectedLoan = ref<Loan | null>(null);
    const loanStats = ref<LoanStats | null>(null);

    // Estado das parcelas
    const parcels = ref<Parcel[]>([]);
    const parcelsLoading = ref(false);
    const parcelsTotal = ref(0);
    const parcelsPage = ref(1);
    const parcelsLimit = ref(20);
    const selectedParcel = ref<Parcel | null>(null);
    const parcelStats = ref<ParcelStats | null>(null);

    // Estado das mensagens/conversas
    const conversations = ref<Conversation[]>([]);
    const conversationsLoading = ref(false);
    const conversationsTotal = ref(0);
    const conversationsPage = ref(1);
    const conversationsLimit = ref(20);
    const selectedConversation = ref<Conversation | null>(null);
    const currentMessages = ref<Message[]>([]);
    const messagesLoading = ref(false);
    const conversationStats = ref<ConversationStats | null>(null);
    const unreadCount = ref(0);
    const unreadConversations = ref<Conversation[]>([]);
    const pendingChatConversationId = ref<string | null>(null);
    const pendingChatDraftMessage = ref<string | null>(null);
    const activeConversationId = ref<string | null>(null);
    const messagesRefreshing = ref(false);
    const conversationsRefreshing = ref(false);
    const isChatPageActive = ref(false);
    const conversationsInitialLoad = ref(true);

    // Estado das notificações -
    const notifications = ref<any[]>([]);
    const notificationsCount = ref(0);

    // Estado do dashboard
    const dashboardStats = ref({
        totalClients: 0,
        totalLoans: 0,
        activeLoans: 0,
        totalAmount: 0,
        totalRepaid: 0,
        defaultRate: 0,
        pendingLoans: 0,
        overdueParcels: 0
    });

    // Getters computados -
    const hasRole = computed(() => (role: string) => currentUser.value?.roles.includes(role) || false);
    const hasPermission = computed(() => (permission: string) => currentUser.value?.permissions.includes(permission) || false);
    const isAdmin = computed(() => hasRole.value('Admin'));
    const isPartner = computed(() => hasRole.value('Partner'));
    const hasBackofficeAccess = computed(() => canAccessBackoffice(currentUser.value?.roles));
    const loggedUserId = computed(() => getLoggedUserId());
    const primaryRoleLabel = computed(() => getPartnerRoleLabel(currentUser.value?.roles));

    // Ações de autenticação
    const login = async (email: string, password: string) => {
        try {
            authLoading.value = true;
            const response = await authService.login({ email, password });
            currentUser.value = response.user;
            isAuthenticated.value = true;
            return response;
        } catch (error) {
            throw error;
        } finally {
            authLoading.value = false;
        }
    };

    const logout = () => {
        authService.logout();
        currentUser.value = null;
        isAuthenticated.value = false;
        resetStore();
    };

    const checkAuth = async () => {
        if (authService.isAuthenticated() && authService.canAccessBackoffice()) {
            currentUser.value = authService.getCurrentUser();
            isAuthenticated.value = true;
            return true;
        }
        if (authService.isAuthenticated()) {
            authService.logout();
        }
        return false;
    };

    // Ações dos customers
    const fetchClients = async (options?: { force?: boolean }) => {
        const cached = !options?.force ? getCachedClients<Customer>() : null;
        if (cached && cached.length > 0) {
            clients.value = cached;
            clientsTotal.value = cached.length;
            return {
                clients: cached,
                total: cached.length,
                page: 1,
                limit: cached.length,
                totalPages: 1,
            };
        }

        try {
            clientsLoading.value = true;
            const response = await customerService.getCustomers();
            if (response.succeeded && response.data) {
                clients.value = response.data;
                clientsTotal.value = response.data.length;
                setCachedClients(response.data);
                return {
                    clients: response.data,
                    total: response.data.length,
                    page: 1,
                    limit: response.data.length,
                    totalPages: 1
                };
            }
            throw new Error('Erro ao carregar customers');
        } catch (error) {
            throw error;
        } finally {
            clientsLoading.value = false;
        }
    };

    const fetchClientById = async (id: string) => {
        try {
            const response = await customerService.getCustomerById(id);
            if (response.succeeded && response.data) {
                selectedClient.value = response.data;
                return response.data;
            }
            throw new Error('Customer não encontrado');
        } catch (error) {
            throw error;
        }
    };

    const createClient = async (clientData: any) => {
        try {
            const response = await customerService.createCustomer(clientData);
            if (response.succeeded && response.data) {
                clients.value.unshift(response.data);
                clientsTotal.value++;
                return response.data;
            }
            throw new Error('Erro ao criar customer');
        } catch (error) {
            throw error;
        }
    };

    const updateClient = async (id: string, clientData: any) => {
        try {
            const response = await customerService.updateCustomer(id, clientData);
            if (response.succeeded && response.data) {
                const index = clients.value.findIndex(c => c.id === id);
                if (index !== -1) {
                    clients.value[index] = response.data;
                }
                if (selectedClient.value?.id === id) {
                    selectedClient.value = response.data;
                }
                return response.data;
            }
            throw new Error('Erro ao atualizar customer');
        } catch (error) {
            throw error;
        }
    };

    // Ações dos empréstimos
    const fetchLoans = async (filters?: any) => {
        try {
            loansLoading.value = true;
            const params = {
                page: loansPage.value,
                limit: loansLimit.value,
                ...filters
            };
            const response = await loansService.getLoans(params);
            loans.value = response.loans;
            loansTotal.value = response.total;
            return response;
        } catch (error) {
            throw error;
        } finally {
            loansLoading.value = false;
        }
    };

    const fetchLoanById = async (id: string) => {
        try {
            const loan = await loansService.getLoanById(id);
            selectedLoan.value = loan;
            return loan;
        } catch (error) {
            throw error;
        }
    };

    const fetchLoanStats = async (filters?: any) => {
        try {
            const allLoans = await loansService.getAllLoans() as DashboardLoan[];
            const derived = buildDashboardStatsFromLoans(allLoans);
            const stats: LoanStats = {
                ...derived,
                completedLoans: 0,
                totalOutstanding: 0,
                averageInterestRate: 0,
                averageTerm: 0,
            };
            loanStats.value = stats;
            return stats;
        } catch (error) {
            throw error;
        }
    };

    const approveLoan = async (id: string, approvalData: any) => {
        try {
            const loan = await loansService.approveLoan(id, approvalData);
            const index = loans.value.findIndex(l => l.id === id);
            if (index !== -1) {
                loans.value[index] = loan;
            }
            return loan;
        } catch (error) {
            throw error;
        }
    };

    const approveManual = async (id: string, stripeAccountId: string) => {
        try {
            const loan = await loansService.approveManual(id, stripeAccountId);
            const index = loans.value.findIndex(l => l.id === id);
            if (index !== -1) {
                loans.value[index] = loan;
            }
            return loan;
        } catch (error) {
            throw error;
        }
    };

    const fetchLoanStatuses = async () => {
        try {
            const statuses = await loansService.getLoanStatuses();
            console.log('Status recebidos no store:', statuses); // Para debug
            return statuses || [];
        } catch (error) {
            console.error('Erro no store ao buscar status:', error);
            throw error;
        }
    };

    // Ações das parcelas
    const fetchParcels = async (filters?: any) => {
        try {
            parcelsLoading.value = true;
            const params = {
                page: parcelsPage.value,
                limit: parcelsLimit.value,
                ...filters
            };
            const response = await parcelsService.getParcels(params);
            parcels.value = response.parcels;
            parcelsTotal.value = response.total;
            return response;
        } catch (error) {
            throw error;
        } finally {
            parcelsLoading.value = false;
        }
    };

    const fetchParcelById = async (id: string) => {
        try {
            const parcel = await parcelsService.getParcelById(id);
            selectedParcel.value = parcel;
            return parcel;
        } catch (error) {
            throw error;
        }
    };

    const fetchParcelStats = async (filters?: any) => {
        try {
            const stats = await parcelsService.getParcelStats(filters);
            parcelStats.value = stats;
            return stats;
        } catch (error) {
            throw error;
        }
    };

    // Ações das mensagens/conversas
    const syncUnreadFromList = () => {
        const { unread, count } = deriveUnreadFromConversations(conversations.value);
        unreadConversations.value = unread;
        unreadCount.value = count;
    };

    const setActiveConversation = (conversation: Conversation | null) => {
        selectedConversation.value = conversation;
        activeConversationId.value = conversation?.id ?? null;
        if (conversation) {
            const cached = getCachedMessages(conversation.id);
            if (cached) {
                currentMessages.value = cached.messages;
            }
        } else {
            currentMessages.value = [];
        }
    };

    const bumpConversationPreview = (conversationId: string, _content: string, at?: string) => {
        const conversation = conversations.value.find((c) => c.id === conversationId);
        if (conversation) {
            conversation.lastMessageAt = at || new Date().toISOString();
        }
        if (selectedConversation.value?.id === conversationId) {
            selectedConversation.value.lastMessageAt = at || new Date().toISOString();
        }
        invalidateConversationsCache();
    };

    const fetchConversations = async (
        filters?: Record<string, unknown>,
        options?: { force?: boolean; silent?: boolean }
    ) => {
        const filtersKey = buildFiltersKey(filters);
        const cached = !options?.force ? getCachedConversations(filtersKey) : null;

        if (cached) {
            conversations.value = cached.conversations;
            conversationsTotal.value = cached.total;
            syncUnreadFromList();
            conversationsInitialLoad.value = false;
            return {
                conversations: cached.conversations,
                total: cached.total,
                page: conversationsPage.value,
                limit: conversationsLimit.value,
                totalPages: 1,
            } as ConversationListResponse;
        }

        const showLoading = !options?.silent && conversationsInitialLoad.value;
        const showRefresh = !options?.silent && options?.force && !conversationsInitialLoad.value;
        try {
            if (showLoading) conversationsLoading.value = true;
            if (showRefresh) conversationsRefreshing.value = true;

            const params = {
                page: conversationsPage.value,
                limit: conversationsLimit.value,
                ...filters,
            };

            const response = await dedupeRequest(`conversations:${filtersKey}`, () =>
                messagesService.getConversations(params)
            );

            conversations.value = response.conversations;
            conversationsTotal.value = response.total;
            setCachedConversations(filtersKey, response.conversations, response.total);
            syncUnreadFromList();
            conversationsInitialLoad.value = false;
            return response;
        } catch (error) {
            throw error;
        } finally {
            if (showLoading) conversationsLoading.value = false;
            if (showRefresh) conversationsRefreshing.value = false;
        }
    };

    const fetchConversationById = async (id: string, options?: { force?: boolean }) => {
        const fromList = conversations.value.find((c) => c.id === id);
        if (fromList && !options?.force) {
            setActiveConversation(fromList);
            return fromList;
        }

        try {
            const conversation = await dedupeRequest(`conversation:${id}`, () =>
                messagesService.getConversationById(id)
            );
            setActiveConversation(conversation);
            const index = conversations.value.findIndex((c) => c.id === id);
            if (index >= 0) {
                conversations.value[index] = conversation;
            }
            return conversation;
        } catch (error) {
            throw error;
        }
    };

    const fetchMessages = async (
        conversationId: string,
        options?: { force?: boolean; silent?: boolean }
    ) => {
        activeConversationId.value = conversationId;
        const cached = getCachedMessages(conversationId);
        const hasCache = cached && cached.messages.length >= 0;
        const cacheFresh = hasCache && isFresh(cached!.fetchedAt, MESSAGES_TTL_MS);

        if (hasCache && activeConversationId.value === conversationId) {
            currentMessages.value = cached!.messages;
        }

        if (cacheFresh && !options?.force) {
            messagesLoading.value = false;
            void fetchMessages(conversationId, { force: true, silent: true });
            return { messages: cached!.messages, total: cached!.messages.length, page: 1, limit: cached!.messages.length, totalPages: 1 };
        }

        const showOverlay = !options?.silent && !hasCache;
        try {
            if (showOverlay) {
                messagesLoading.value = true;
            } else if (options?.silent || hasCache) {
                messagesRefreshing.value = true;
            }

            const response = await dedupeRequest(`messages:${conversationId}`, () =>
                messagesService.getMessages(conversationId)
            );

            setCachedMessages(conversationId, response.messages);
            if (activeConversationId.value === conversationId) {
                currentMessages.value = response.messages;
            }
            return response;
        } catch (error) {
            throw error;
        } finally {
            if (showOverlay) messagesLoading.value = false;
            if (options?.silent || hasCache) messagesRefreshing.value = false;
        }
    };

    const sendMessage = async (messageData: CreateMessageRequest) => {
        try {
            const message = await messagesService.sendMessage(messageData);
            const messages = appendCachedMessage(messageData.conversationId, message);
            if (activeConversationId.value === messageData.conversationId) {
                currentMessages.value = messages;
            }
            bumpConversationPreview(
                messageData.conversationId,
                message.content || messageData.content,
                message.createdAt
            );
            return message;
        } catch (error) {
            throw error;
        }
    };

    const createConversation = async (data: CreateConversationRequest) => {
        try {
            const conversation = await messagesService.createConversation(data);
            conversations.value.unshift(conversation);
            conversationsTotal.value += 1;
            invalidateConversationsCache();
            syncUnreadFromList();
            return conversation;
        } catch (error) {
            throw error;
        }
    };

    const markConversationAsRead = async (conversationId: string) => {
        const conversation = conversations.value.find((c) => c.id === conversationId);
        const previousUnread = conversation?.unreadCount ?? 0;

        if (conversation) conversation.unreadCount = 0;
        if (selectedConversation.value?.id === conversationId) {
            selectedConversation.value.unreadCount = 0;
        }
        syncUnreadFromList();

        try {
            await messagesService.markConversationAsRead(conversationId);
            if (!canUseConversationsForUnread()) {
                scheduleUnreadRefresh(() => {
                    void fetchUnreadChatNotifications({ force: true });
                });
            }
        } catch (error) {
            if (conversation) conversation.unreadCount = previousUnread;
            if (selectedConversation.value?.id === conversationId) {
                selectedConversation.value.unreadCount = previousUnread;
            }
            syncUnreadFromList();
            throw error;
        }
    };

    const fetchUnreadChatNotifications = async (options?: { force?: boolean }) => {
        if (!options?.force && canUseConversationsForUnread()) {
            syncUnreadFromList();
            return unreadConversations.value;
        }

        try {
            const response = await dedupeRequest('unread-conversations', () =>
                messagesService.getConversations({
                    page: 1,
                    limit: 50,
                    unreadOnly: true,
                })
            );
            const unread = response.conversations.filter((c) => c.unreadCount > 0);
            unreadConversations.value = unread;
            unreadCount.value = unread.reduce((sum, c) => sum + c.unreadCount, 0);
            return unread;
        } catch (error) {
            console.error('Erro ao buscar notificações de chat:', error);
            return [];
        }
    };

    const setPendingChatConversationId = (conversationId: string | null) => {
        pendingChatConversationId.value = conversationId;
    };

    const clearPendingChatConversationId = () => {
        pendingChatConversationId.value = null;
        pendingChatDraftMessage.value = null;
    };

    const setPendingChatDraftMessage = (message: string | null) => {
        pendingChatDraftMessage.value = message;
    };

    const clearPendingChatDraftMessage = () => {
        pendingChatDraftMessage.value = null;
    };

    const updateConversationStatus = async (conversationId: string, status: string) => {
        try {
            const conversation = await messagesService.updateConversation(conversationId, { status });
            const index = conversations.value.findIndex((c) => c.id === conversationId);
            if (index >= 0) {
                conversations.value[index] = conversation;
            }
            if (selectedConversation.value?.id === conversationId) {
                selectedConversation.value = conversation;
            }
            invalidateConversationsCache();
            return conversation;
        } catch (error) {
            throw error;
        }
    };

    const fetchConversationStats = async (options?: { force?: boolean }) => {
        const cached = !options?.force ? getCachedStats() : null;
        if (cached) {
            conversationStats.value = cached;
            return cached;
        }

        try {
            const stats = await dedupeRequest('conversation-stats', () =>
                messagesService.getConversationStats()
            );
            conversationStats.value = stats;
            setCachedStats(stats);
            return stats;
        } catch (error) {
            throw error;
        }
    };

    const setChatPageActive = (active: boolean) => {
        isChatPageActive.value = active;
    };

    const hasCachedMessages = (conversationId: string) => touchMessagesCache(conversationId);

    // Ações do dashboard
    const fetchDashboardStats = async (loans?: DashboardLoan[]) => {
        try {
            const customersResponse = await customerService.getCustomers();

            const totalClients = customersResponse.succeeded && customersResponse.data
                ? customersResponse.data.length
                : clientsTotal.value;

            clientsTotal.value = totalClients;

            if (loans) {
                const loanStatsData = buildDashboardStatsFromLoans(loans);

                dashboardStats.value = {
                    totalClients,
                    totalLoans: loanStatsData.totalLoans,
                    activeLoans: loanStatsData.activeLoans,
                    totalAmount: loanStatsData.totalAmount,
                    totalRepaid: loanStatsData.totalRepaid,
                    defaultRate: loanStatsData.defaultRate,
                    pendingLoans: loanStatsData.pendingLoans,
                    overdueParcels: loanStatsData.defaultedLoans,
                };
            } else {
                dashboardStats.value = {
                    ...dashboardStats.value,
                    totalClients,
                };
            }
        } catch (error) {
            console.error('Erro ao buscar estatísticas do dashboard:', error);
        }
    };

    const setDashboardOverdueParcels = (count: number) => {
        dashboardStats.value.overdueParcels = count;
    };

    // Reset do store
    const resetStore = () => {
        clients.value = [];
        loans.value = [];
        parcels.value = [];
        conversations.value = [];
        currentMessages.value = [];
        selectedClient.value = null;
        selectedLoan.value = null;
        selectedParcel.value = null;
        selectedConversation.value = null;
        loanStats.value = null;
        parcelStats.value = null;
        conversationStats.value = null;
        unreadCount.value = 0;
        unreadConversations.value = [];
        pendingChatConversationId.value = null;
        pendingChatDraftMessage.value = null;
        activeConversationId.value = null;
        messagesRefreshing.value = false;
        isChatPageActive.value = false;
        conversationsInitialLoad.value = true;
        clearChatCache();
        notifications.value = [];
        notificationsCount.value = 0;
    };

    // Inicialização
    const initializeStore = async () => {
        await checkAuth();
        if (isAuthenticated.value) {
            await fetchDashboardStats();
            await fetchUnreadChatNotifications();
        }
    };

    return {
        // Estado
        currentUser,
        isAuthenticated,
        authLoading,
        clients,
        clientsLoading,
        clientsTotal,
        clientsPage,
        clientsLimit,
        selectedClient,
        loans,
        loansLoading,
        loansTotal,
        loansPage,
        loansLimit,
        selectedLoan,
        loanStats,
        parcels,
        parcelsLoading,
        parcelsTotal,
        parcelsPage,
        parcelsLimit,
        selectedParcel,
        parcelStats,
        conversations,
        conversationsLoading,
        conversationsTotal,
        conversationsPage,
        conversationsLimit,
        selectedConversation,
        currentMessages,
        messagesLoading,
        conversationStats,
        unreadCount,
        unreadConversations,
        pendingChatConversationId,
        pendingChatDraftMessage,
        activeConversationId,
        messagesRefreshing,
        conversationsRefreshing,
        isChatPageActive,
        conversationsInitialLoad,
        notifications,
        notificationsCount,
        dashboardStats,

        // Getters
        hasRole,
        hasPermission,
        isAdmin,
        isPartner,
        hasBackofficeAccess,
        loggedUserId,
        primaryRoleLabel,

        // Ações
        login,
        logout,
        checkAuth,
        fetchClients,
        fetchClientById,
        createClient,
        updateClient,
        fetchLoans,
        fetchLoanById,
        fetchLoanStats,
        approveLoan,
        approveManual,
        fetchLoanStatuses,
        fetchParcels,
        fetchParcelById,
        fetchParcelStats,
        fetchConversations,
        fetchConversationById,
        fetchMessages,
        sendMessage,
        createConversation,
        markConversationAsRead,
        updateConversationStatus,
        fetchConversationStats,
        fetchUnreadChatNotifications,
        setPendingChatConversationId,
        clearPendingChatConversationId,
        setPendingChatDraftMessage,
        clearPendingChatDraftMessage,
        setActiveConversation,
        setChatPageActive,
        hasCachedMessages,
        bumpConversationPreview,
        fetchDashboardStats,
        setDashboardOverdueParcels,
        resetStore,
        initializeStore
    };
});
