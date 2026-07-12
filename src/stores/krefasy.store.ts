import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { authService, UserData } from '@/services/auth.service';
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
} from '@/services/messages.service';

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
        if (authService.isAuthenticated()) {
            currentUser.value = authService.getCurrentUser();
            isAuthenticated.value = true;
            return true;
        }
        return false;
    };

    // Ações dos customers
    const fetchClients = async (filters?: any) => {
        try {
            clientsLoading.value = true;
            const response = await customerService.getCustomers();
            if (response.succeeded && response.data) {
                clients.value = response.data;
                clientsTotal.value = response.data.length;
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
    const fetchConversations = async (filters?: any) => {
        try {
            conversationsLoading.value = true;
            const params = {
                page: conversationsPage.value,
                limit: conversationsLimit.value,
                ...filters
            };
            const response = await messagesService.getConversations(params);
            conversations.value = response.conversations;
            conversationsTotal.value = response.total;
            return response;
        } catch (error) {
            throw error;
        } finally {
            conversationsLoading.value = false;
        }
    };

    const fetchConversationById = async (id: string) => {
        try {
            const conversation = await messagesService.getConversationById(id);
            selectedConversation.value = conversation;
            return conversation;
        } catch (error) {
            throw error;
        }
    };

    const fetchMessages = async (conversationId: string) => {
        try {
            messagesLoading.value = true;
            const response = await messagesService.getMessages(conversationId);
            currentMessages.value = response.messages;
            return response;
        } catch (error) {
            throw error;
        } finally {
            messagesLoading.value = false;
        }
    };

    const sendMessage = async (messageData: any) => {
        try {
            const message = await messagesService.sendMessage(messageData);
            currentMessages.value.push(message);
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
            return conversation;
        } catch (error) {
            throw error;
        }
    };

    const markConversationAsRead = async (conversationId: string) => {
        try {
            await messagesService.markConversationAsRead(conversationId);
            const conversation = conversations.value.find((c) => c.id === conversationId);
            if (conversation) {
                conversation.unreadCount = 0;
            }
            if (selectedConversation.value?.id === conversationId) {
                selectedConversation.value.unreadCount = 0;
            }
            await fetchUnreadChatNotifications();
        } catch (error) {
            throw error;
        }
    };

    const fetchUnreadChatNotifications = async () => {
        try {
            const response = await messagesService.getConversations({
                page: 1,
                limit: 50,
                unreadOnly: true,
            });
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
            return conversation;
        } catch (error) {
            throw error;
        }
    };

    const fetchConversationStats = async () => {
        try {
            const stats = await messagesService.getConversationStats();
            conversationStats.value = stats;
            return stats;
        } catch (error) {
            throw error;
        }
    };

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
        notifications,
        notificationsCount,
        dashboardStats,

        // Getters
        hasRole,
        hasPermission,
        isAdmin,

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
        fetchDashboardStats,
        setDashboardOverdueParcels,
        resetStore,
        initializeStore
    };
});
