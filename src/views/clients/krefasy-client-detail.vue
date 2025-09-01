<template>
    <div>
        <!-- Breadcrumb -->
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <a href="javascript:;" class="text-primary hover:underline">Dashboard</a>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <a href="/clients" class="text-primary hover:underline">Clientes</a>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Detalhes</span>
            </li>
        </ul>

        <div class="pt-5">
            <div v-if="loading" class="flex items-center justify-center h-64">
                <div class="animate-spin border-2 border-primary border-t-transparent rounded-full w-8 h-8"></div>
            </div>

            <div v-else-if="client" class="space-y-6">
                <!-- Header do cliente -->
                <div class="panel">
                    <div class="flex items-center justify-between mb-4">
                        <div class="flex items-center space-x-4">
                            <div class="w-16 h-16 rounded-full bg-primary-light dark:bg-primary flex items-center justify-center">
                                <span class="text-white text-2xl font-bold">
                                    {{ getInitials(client.firstName, client.lastName) }}
                                </span>
                            </div>
                            <div>
                                <h1 class="text-2xl font-bold dark:text-white-light">
                                    {{ client.firstName }} {{ client.lastName }}
                                </h1>
                                <p class="text-gray-600 dark:text-gray-400">{{ client.email }}</p>
                            </div>
                        </div>
                        <div class="flex items-center space-x-2">
                            <span
                                class="badge text-lg px-4 py-2"
                                :class="getStatusClass(client.status)"
                            >
                                {{ getStatusLabel(client.status) }}
                            </span>
                        </div>
                    </div>

                    <!-- Informações básicas -->
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                            <h3 class="font-semibold mb-2">Informações Pessoais</h3>
                            <div class="space-y-2 text-sm">
                                <div><span class="font-medium">Telefone:</span> {{ client.phone }}</div>
                                <div><span class="font-medium">Documento:</span> {{ client.documentNumber }} ({{ client.documentType }})</div>
                                <div><span class="font-medium">Nascimento:</span> {{ formatDate(client.birthDate) }}</div>
                                <div><span class="font-medium">Score:</span>
                                    <span :class="getCreditScoreClass(client.creditScore)">
                                        {{ client.creditScore }}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div>
                            <h3 class="font-semibold mb-2">Endereço</h3>
                            <div class="space-y-2 text-sm">
                                <div>{{ client.address.street }}, {{ client.address.number }}</div>
                                <div v-if="client.address.complement">{{ client.address.complement }}</div>
                                <div>{{ client.address.neighborhood }}</div>
                                <div>{{ client.address.city }} - {{ client.address.state }}</div>
                                <div>{{ client.address.zipCode }}</div>
                                <div>{{ client.address.country }}</div>
                            </div>
                        </div>

                        <div>
                            <h3 class="font-semibold mb-2">Estatísticas</h3>
                            <div class="space-y-2 text-sm">
                                <div><span class="font-medium">Total de empréstimos:</span> {{ client.totalLoans }}</div>
                                <div><span class="font-medium">Empréstimos ativos:</span> {{ client.activeLoans }}</div>
                                <div><span class="font-medium">Total emprestado:</span> R$ {{ formatCurrency(client.totalBorrowed) }}</div>
                                <div><span class="font-medium">Total pago:</span> R$ {{ formatCurrency(client.totalRepaid) }}</div>
                                <div><span class="font-medium">Cadastrado em:</span> {{ formatDate(client.createdAt) }}</div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Abas de conteúdo -->
                <div class="panel">
                    <div class="border-b border-gray-200 dark:border-gray-700">
                        <nav class="flex space-x-8">
                            <button
                                v-for="tab in tabs"
                                :key="tab.id"
                                @click="activeTab = tab.id"
                                class="py-2 px-1 border-b-2 font-medium text-sm"
                                :class="activeTab === tab.id
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                            >
                                {{ tab.label }}
                            </button>
                        </nav>
                    </div>

                    <div class="mt-6">
                        <!-- Aba de Empréstimos -->
                        <div v-if="activeTab === 'loans'" class="space-y-4">
                            <div v-if="loansLoading" class="flex items-center justify-center h-32">
                                <div class="animate-spin border-2 border-primary border-t-transparent rounded-full w-6 h-6"></div>
                            </div>
                            <div v-else-if="loans.length === 0" class="text-center py-8 text-gray-500">
                                Nenhum empréstimo encontrado para este cliente.
                            </div>
                            <div v-else class="space-y-3">
                                <div
                                    v-for="loan in loans"
                                    :key="loan.id"
                                    class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-dark-light transition-colors"
                                >
                                    <div class="flex items-center justify-between">
                                        <div>
                                            <h4 class="font-semibold">{{ loan.productType }}</h4>
                                            <p class="text-sm text-gray-600 dark:text-gray-400">
                                                {{ loan.purpose }}
                                            </p>
                                        </div>
                                        <div class="text-right">
                                            <div class="font-bold text-lg">R$ {{ formatCurrency(loan.amount) }}</div>
                                            <span
                                                class="badge"
                                                :class="getLoanStatusClass(loan.status)"
                                            >
                                                {{ getLoanStatusLabel(loan.status) }}
                                            </span>
                                        </div>
                                    </div>
                                    <div class="mt-3 grid grid-cols-3 gap-4 text-sm">
                                        <div>
                                            <span class="font-medium">Prazo:</span> {{ loan.term }} meses
                                        </div>
                                        <div>
                                            <span class="font-medium">Juros:</span> {{ loan.interestRate }}% a.m.
                                        </div>
                                        <div>
                                            <span class="font-medium">Parcela:</span> R$ {{ formatCurrency(loan.monthlyPayment) }}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Aba de Mensagens -->
                        <div v-if="activeTab === 'messages'" class="space-y-4">
                            <div v-if="messagesLoading" class="flex items-center justify-center h-32">
                                <div class="animate-spin border-2 border-primary border-t-transparent rounded-full w-6 h-6"></div>
                            </div>
                            <div v-else-if="messages.length === 0" class="text-center py-8 text-gray-500">
                                Nenhuma mensagem encontrada para este cliente.
                            </div>
                            <div v-else class="space-y-3">
                                <div
                                    v-for="message in messages"
                                    :key="message.id"
                                    class="border border-gray-200 dark:border-gray-700 rounded-lg p-4"
                                >
                                    <div class="flex items-center justify-between mb-2">
                                        <div class="flex items-center space-x-2">
                                            <span class="font-medium">{{ message.senderName }}</span>
                                            <span class="text-sm text-gray-500">{{ formatDate(message.createdAt) }}</span>
                                        </div>
                                        <span
                                            class="badge text-xs"
                                            :class="message.senderType === 'ADMIN' ? 'badge-outline-primary' : 'badge-outline-secondary'"
                                        >
                                            {{ message.senderType === 'ADMIN' ? 'Admin' : 'Cliente' }}
                                        </span>
                                    </div>
                                    <p class="text-gray-700 dark:text-gray-300">{{ message.content }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Aba de Atividade -->
                        <div v-if="activeTab === 'activity'" class="space-y-4">
                            <div class="text-center py-8 text-gray-500">
                                Histórico de atividades será implementado em breve.
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div v-else class="text-center py-8">
                <p class="text-gray-500">Cliente não encontrado.</p>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useKrefasyStore } from '@/stores/index';

// Route e Store
const route = useRoute();
const router = useRouter();
const krefasyStore = useKrefasyStore();

// Estado
const loading = ref(false);
const client = ref<any>(null);
const loans = ref<any[]>([]);
const messages = ref<any[]>([]);
const loansLoading = ref(false);
const messagesLoading = ref(false);

// Abas
const tabs = [
    { id: 'loans', label: 'Empréstimos' },
    { id: 'messages', label: 'Mensagens' },
    { id: 'activity', label: 'Atividade' }
];
const activeTab = ref('loans');

// Computed
const clientId = computed(() => route.params.id as string);

// Métodos
const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};

const getStatusClass = (status: string) => {
    switch (status) {
        case 'ACTIVE': return 'badge-outline-success';
        case 'INACTIVE': return 'badge-outline-secondary';
        case 'BLOCKED': return 'badge-outline-danger';
        case 'PENDING_VERIFICATION': return 'badge-outline-warning';
        default: return 'badge-outline-secondary';
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'ACTIVE': return 'Ativo';
        case 'INACTIVE': return 'Inativo';
        case 'BLOCKED': return 'Bloqueado';
        case 'PENDING_VERIFICATION': return 'Pendente';
        default: return status;
    }
};

const getCreditScoreClass = (score: number) => {
    if (score >= 600) return 'text-success';
    if (score >= 300) return 'text-warning';
    return 'text-danger';
};

const getLoanStatusClass = (status: string) => {
    switch (status) {
        case 'ACTIVE': return 'badge-outline-success';
        case 'PENDING': return 'badge-outline-warning';
        case 'APPROVED': return 'badge-outline-info';
        case 'REJECTED': return 'badge-outline-danger';
        case 'COMPLETED': return 'badge-outline-secondary';
        default: return 'badge-outline-secondary';
    }
};

const getLoanStatusLabel = (status: string) => {
    switch (status) {
        case 'ACTIVE': return 'Ativo';
        case 'PENDING': return 'Pendente';
        case 'APPROVED': return 'Aprovado';
        case 'REJECTED': return 'Rejeitado';
        case 'COMPLETED': return 'Liquidado';
        default: return status;
    }
};

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
};

const formatCurrency = (value: number) => {
    return (value / 1000).toFixed(1) + 'k';
};

const loadClient = async () => {
    try {
        loading.value = true;
        const clientData = await krefasyStore.fetchClientById(clientId.value);
        client.value = clientData;
    } catch (error) {
        console.error('Erro ao carregar cliente:', error);
    } finally {
        loading.value = false;
    }
};

const loadLoans = async () => {
    try {
        loansLoading.value = true;
        const response = await krefasyStore.fetchLoans({ clientId: clientId.value });
        loans.value = response.loans;
    } catch (error) {
        console.error('Erro ao carregar empréstimos:', error);
    } finally {
        loansLoading.value = false;
    }
};

const loadMessages = async () => {
    try {
        messagesLoading.value = true;
        // Implementar quando disponível no store
        messages.value = [];
    } catch (error) {
        console.error('Erro ao carregar mensagens:', error);
    } finally {
        messagesLoading.value = false;
    }
};

// Lifecycle
onMounted(() => {
    loadClient();
});

// Watcher para mudança de aba
watch(activeTab, (newTab) => {
    if (newTab === 'loans' && loans.value.length === 0) {
        loadLoans();
    } else if (newTab === 'messages' && messages.value.length === 0) {
        loadMessages();
    }
});
</script>

<style scoped>
.badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 0.375rem;
}

.badge-outline-success {
    color: #00ab55;
    border: 1px solid #00ab55;
    background-color: transparent;
}

.badge-outline-warning {
    color: #e2a03f;
    border: 1px solid #e2a03f;
    background-color: transparent;
}

.badge-outline-danger {
    color: #e7515a;
    border: 1px solid #e7515a;
    background-color: transparent;
}

.badge-outline-secondary {
    color: #6c757d;
    border: 1px solid #6c757d;
    background-color: transparent;
}

.badge-outline-primary {
    color: #4361ee;
    border: 1px solid #4361ee;
    background-color: transparent;
}

.badge-outline-info {
    color: #2196f3;
    border: 1px solid #2196f3;
    background-color: transparent;
}
</style>
