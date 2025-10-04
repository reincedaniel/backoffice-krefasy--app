<template>
    <div>
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li><a href="javascript:;" class="text-primary hover:underline">Dashboard</a></li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <a href="/loans" class="text-primary hover:underline">Empréstimos</a>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Detalhes</span>
            </li>
        </ul>

        <div class="pt-5">
            <!-- Loading State -->
            <div v-if="loading" class="panel">
                <div class="flex items-center justify-center py-12">
                    <div class="flex flex-col items-center gap-4">
                        <span class="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10 inline-block align-middle"></span>
                        <span class="text-sm text-gray-600 dark:text-gray-300">Carregando detalhes do empréstimo...</span>
                    </div>
                </div>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="panel">
                <div class="text-center py-12">
                    <div class="text-red-500 text-lg mb-4">Erro ao carregar empréstimo</div>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">{{ error }}</p>
                    <button @click="loadLoanDetails" class="btn btn-primary">Tentar Novamente</button>
                </div>
            </div>

            <!-- Content -->
            <div v-else-if="loan">
                <!-- Action Buttons -->
                <div class="flex items-center lg:justify-end justify-center flex-wrap gap-4 mb-6">
                    <button v-if="canApproveLoan" type="button" class="btn btn-success gap-2" @click="approveLoan">
                        <icon-circle-check />
                        Aprovar Empréstimo
                    </button>

                    <button type="button" class="btn btn-info gap-2" @click="printLoan">
                        <icon-printer />
                        Imprimir
                    </button>

                    <button type="button" class="btn btn-primary gap-2" @click="downloadDetails">
                        <icon-download />
                        Exportar PDF
                    </button>

                    <router-link :to="`/loans/edit/${loan.id}`" class="btn btn-warning gap-2">
                        <icon-edit />
                        Editar
                    </router-link>

                    <router-link to="/loans" class="btn btn-secondary gap-2">
                        <icon-arrow-left />
                        Voltar
                    </router-link>
                </div>

                <!-- Main Panel -->
                <div class="panel">
                    <!-- Header -->
                    <div class="flex justify-between flex-wrap gap-4 px-4">
                        <div class="text-2xl font-semibold uppercase">Empréstimo</div>
                        <div class="shrink-0">
                            <img src="/assets/images/logo.svg" alt="" class="w-14 ltr:ml-auto rtl:mr-auto" />
                        </div>
                    </div>

                    <!-- Company Info -->
                    <div class="ltr:text-right rtl:text-left px-4">
                        <div class="space-y-1 mt-6 text-white-dark">
                            <div>Krefasy - Sistema de Empréstimos</div>
                            <div>krefasy@empresa.com</div>
                            <div>+244 (xxx) xxx-xxx</div>
                        </div>
                    </div>

                    <hr class="border-[#e0e6ed] dark:border-[#1b2e4b] my-6" />

                    <!-- Loan ID and Status Header -->
                    <div class="flex justify-between items-start px-4 mb-6">
                        <div>
                            <h3 class="text-2xl font-bold text-dark dark:text-white-light">
                                Empréstimo #{{ loan.loanNumber || loan.id }}
                            </h3>
                            <p class="text-gray-600 dark:text-gray-400 mt-1">
                                Cliente: {{ loan.customerName }}
                            </p>
                        </div>
                        <div class="flex flex-col items-end gap-2">
                            <div>
                                <span class="badge" :class="getStatusBadgeClass(loan.loanStatusName || loan.status)">
                                    {{ loan.loanStatusName || getStatusLabel(loan.status) }}
                                </span>
                            </div>
                            <div class="text-2xl font-bold text-primary">
                                {{ formatCurrency(loan.requestedAmount || loan.amount) }}
                            </div>
                        </div>
                    </div>

                    <!-- Tabs -->
                    <TabGroup as="div">
                        <TabList class="flex flex-wrap mt-3 border-b border-white-light dark:border-[#191e3a] px-4">
                            <Tab as="template" v-slot="{ selected }">
                                <a
                                    href="javascript:;"
                                    class="p-3.5 py-2 -mb-[1px] flex items-center border border-transparent hover:text-primary dark:hover:border-b-black !outline-none transition duration-300"
                                    :class="{ '!border-white-light !border-b-white text-primary dark:!border-[#191e3a] dark:!border-b-black': selected }"
                                >
                                    <icon-credit-card class="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                                    Produto
                                </a>
                            </Tab>
                            <Tab as="template" v-slot="{ selected }">
                                <a
                                    href="javascript:;"
                                    class="p-3.5 py-2 -mb-[1px] flex items-center border border-transparent hover:text-primary dark:hover:border-b-black !outline-none transition duration-300"
                                    :class="{ '!border-white-light !border-b-white text-primary dark:!border-[#191e3a] dark:!border-b-black': selected }"
                                >
                                    <icon-users class="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                                    Cliente
                                </a>
                            </Tab>
                            <Tab as="template" v-slot="{ selected }">
                                <a
                                    href="javascript:;"
                                    class="p-3.5 py-2 -mb-[1px] flex items-center border border-transparent hover:text-primary dark:hover:border-b-black !outline-none transition duration-300"
                                    :class="{ '!border-white-light !border-b-white text-primary dark:!border-[#191e3a] dark:!border-b-black': selected }"
                                >
                                    <icon-calendar class="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                                    Outras Informações
                                </a>
                            </Tab>
                        </TabList>

                        <TabPanels class="pt-5 flex-1">
                            <!-- Tab Produto -->
                            <TabPanel>
                                <div class="p-6 space-y-6">
                                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div class="space-y-1">
                                            <div class="text-white-dark text-sm">Nome do Produto:</div>
                                            <div class="font-semibold">{{ loan.loanProductName || 'N/A' }}</div>
                                        </div>
                                        <div class="space-y-1">
                                            <div class="text-white-dark text-sm">Valor Solicitado:</div>
                                            <div class="font-semibold text-lg">{{ formatCurrency(loan.requestedAmount || loan.amount) }}</div>
                                        </div>
                                        <div class="space-y-1">
                                            <div class="text-white-dark text-sm">Valor Aprovado:</div>
                                            <div class="font-semibold" :class="loan.approvedAmount ? 'text-success' : 'text-gray-400'">
                                                {{ loan.approvedAmount ? formatCurrency(loan.approvedAmount) : 'Pendente' }}
                                            </div>
                                        </div>
                                        <div class="space-y-1">
                                            <div class="text-white-dark text-sm">Taxa de Juros:</div>
                                            <div class="font-semibold">{{ loan.interestRate }}% {{ loan.interestPeriodName || 'ao mês' }}</div>
                                        </div>
                                        <div class="space-y-1">
                                            <div class="text-white-dark text-sm">Período de Juros:</div>
                                            <div class="font-semibold">{{ loan.interestPeriodName || 'N/A' }}</div>
                                        </div>
                                        <div class="space-y-1">
                                            <div class="text-white-dark text-sm">Número de Parcelas:</div>
                                            <div class="font-semibold">{{ loan.numberOfInstallments || loan.term }} parcelas</div>
                                        </div>
                                        <div class="space-y-1">
                                            <div class="text-white-dark text-sm">Pagamento Mensal:</div>
                                            <div class="font-semibold">{{ formatCurrency(loan.monthlyPayment) }}</div>
                                        </div>
                                        <div class="space-y-1">
                                            <div class="text-white-dark text-sm">Total a Pagar:</div>
                                            <div class="font-semibold text-lg text-primary">{{ formatCurrency(loan.totalAmount) }}</div>
                                        </div>
                                    </div>
                                    <div v-if="loan.notes" class="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
                                        <div class="text-white-dark text-sm mb-1">Observações do Produto:</div>
                                        <div class="text-gray-700 dark:text-gray-300">{{ loan.notes }}</div>
                                    </div>
                                </div>
                            </TabPanel>

                            <!-- Tab Cliente -->
                            <TabPanel>
                                <div class="p-6 space-y-6">
                                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div class="space-y-1">
                                            <div class="text-white-dark text-sm">Nome Completo:</div>
                                            <div class="font-semibold">{{ loan.customerName }}</div>
                                        </div>
                                        <div class="space-y-1">
                                            <div class="text-white-dark text-sm">Email:</div>
                                            <div class="font-semibold">{{ loan.customerEmail }}</div>
                                        </div>
                                        <div class="space-y-1">
                                            <div class="text-white-dark text-sm">ID do Cliente:</div>
                                            <div class="font-mono text-sm">{{ loan.customerId }}</div>
                                        </div>
                                        <div v-if="loan.managerName" class="space-y-1">
                                            <div class="text-white-dark text-sm">Gerente Responsável:</div>
                                            <div class="font-semibold">{{ loan.managerName }}</div>
                                        </div>
                                    </div>

                                    <!-- Documents Section -->
                                    <div v-if="loan.documents && loan.documents.length > 0" class="mt-6">
                                        <h4 class="font-medium text-gray-800 dark:text-gray-200 mb-3">Documentos do Cliente</h4>
                                        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                            <div v-for="doc in loan.documents" :key="doc.id"
                                                 class="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded border">
                                                <div class="flex-1">
                                                    <div class="font-medium text-sm">{{ doc.name }}</div>
                                                    <div class="text-xs text-gray-500">{{ getDocumentTypeLabel(doc.type) }}</div>
                                                </div>
                                                <div class="flex items-center space-x-2">
                                                    <span :class="doc.verified ? 'text-success' : 'text-warning'" class="text-xs">
                                                        {{ doc.verified ? '✓ Verificado' : '⏳ Pendente' }}
                                                    </span>
                                                    <button @click="downloadDocument(doc)" class="hover:text-primary">
                                                        <icon-download class="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </TabPanel>

                            <!-- Tab Outras Informações -->
                            <TabPanel>
                                <div class="p-6 space-y-6">
                                    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        <div class="space-y-1">
                                            <div class="text-white-dark text-sm">Data de Criação:</div>
                                            <div class="font-semibold">{{ formatDate(loan.createdAt) }}</div>
                                        </div>
                                        <div class="space-y-1">
                                            <div class="text-white-dark text-sm">Data de Início:</div>
                                            <div class="font-semibold">{{ loan.startDate ? formatDate(loan.startDate) : 'Não definida' }}</div>
                                        </div>
                                        <div class="space-y-1">
                                            <div class="text-white-dark text-sm">Data Final:</div>
                                            <div class="font-semibold">{{ loan.endDate ? formatDate(loan.endDate) : 'Em andamento' }}</div>
                                        </div>
                                        <div class="space-y-1">
                                            <div class="text-white-dark text-sm">Última Atualização:</div>
                                            <div class="font-semibold">{{ loan.updatedAt ? formatDate(loan.updatedAt) : 'N/A' }}</div>
                                        </div>
                                        <div v-if="loan.creditScore" class="space-y-1">
                                            <div class="text-white-dark text-sm">Score de Crédito:</div>
                                            <div class="font-semibold">{{ loan.creditScore }}</div>
                                        </div>
                                    </div>

                                    <!-- Rejection Reason if applicable -->
                                    <div v-if="loan.rejectionReason" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded">
                                        <div class="text-white-dark text-sm mb-1">Motivo da Rejeição:</div>
                                        <div class="text-red-700 dark:text-red-300">{{ loan.rejectionReason }}</div>
                                    </div>

                                    <!-- Installments Section -->
                                    <div v-if="loan.installments && loan.installments.length > 0" class="mt-8">
                                        <h4 class="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                                            <icon-list-check class="w-5 h-5 mr-2" />
                                            Cronograma de Parcelas
                                        </h4>
                                        <div class="overflow-x-auto">
                                            <table class="table-striped w-full">
                                                <thead>
                                                    <tr>
                                                        <th>Parcela</th>
                                                        <th>Data Venc.</th>
                                                        <th>Valor Principal</th>
                                                        <th>Juros</th>
                                                        <th>Total</th>
                                                        <th>Status</th>
                                                        <th>Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="installment in loan.installments" :key="installment.id">
                                                        <td>{{ installment.installmentNumber }}/{{ loan.numberOfInstallments }}</td>
                                                        <td>{{ formatDate(installment.dueDate) }}</td>
                                                        <td>{{ formatCurrency(installment.principalAmount) }}</td>
                                                        <td>{{ formatCurrency(installment.interestAmount) }}</td>
                                                        <td>{{ formatCurrency(installment.totalAmount) }}</td>
                                                        <td>
                                                            <span class="badge" :class="getInstallmentStatusBadgeClass(installment.status)">
                                                                {{ installment.status }}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button v-if="installment.status !== 'Pago'" 
                                                                    class="text-primary hover:text-primary-dark" 
                                                                    title="Visualizar detalhes">
                                                                <icon-eye class="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </div>
                            </TabPanel>
                        </TabPanels>
                    </TabGroup>
                </div>
            </div>
        </div>
    </div>
</template>
                                <div class="space-y-1">
                                    <div class="text-white-dark text-sm">Nome Completo:</div>
                                    <div class="font-semibold">{{ loan.customerName }}</div>
                                </div>
                                <div class="space-y-1">
                                    <div class="text-white-dark text-sm">Email:</div>
                                    <div class="font-semibold">{{ loan.customerEmail }}</div>
                                </div>
                                <div class="space-y-1">
                                    <div class="text-white-dark text-sm">ID do Cliente:</div>
                                    <div class="font-mono text-sm">{{ loan.customerId }}</div>
                                </div>
                                <div v-if="loan.managerName" class="space-y-1">
                                    <div class="text-white-dark text-sm">Gerente Responsável:</div>
                                    <div class="font-semibold">{{ loan.managerName }}</div>
                                </div>
                            </div>

                            <!-- Documents Section -->
                            <div v-if="loan.documents && loan.documents.length > 0" class="mt-6">
                                <h4 class="font-medium text-gray-800 dark:text-gray-200 mb-3">Documentos do Cliente</h4>
                                <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                    <div v-for="doc in loan.documents" :key="doc.id"
                                         class="flex items-center justify-between p-3 bg-white dark:bg-gray-700 rounded border">
                                        <div class="flex-1">
                                            <div class="font-medium text-sm">{{ doc.name }}</div>
                                            <div class="text-xs text-gray-500">{{ getDocumentTypeLabel(doc.type) }}</div>
                                        </div>
                                        <div class="flex items-center space-x-2">
                                            <span :class="doc.verified ? 'text-success' : 'text-warning'" class="text-xs">
                                                {{ doc.verified ? '✓ Verificado' : '⏳ Pendente' }}
                                            </span>
                                            <button @click="downloadDocument(doc)" class="hover:text-primary">
                                                <icon-download class="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Outras Informações Section -->
                        <div class="bg-yellow-50 dark:bg-yellow-900/20 p-6 rounded-lg">
                            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                                <icon-calendar class="w-5 h-5 mr-2" />
                                Outras Informações
                            </h3>
                            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                <div class="space-y-1">
                                    <div class="text-white-dark text-sm">Data de Criação:</div>
                                    <div class="font-semibold">{{ formatDate(loan.createdAt) }}</div>
                                </div>
                                <div class="space-y-1">
                                    <div class="text-white-dark text-sm">Data de Início:</div>
                                    <div class="font-semibold">{{ loan.startDate ? formatDate(loan.startDate) : 'Não definida' }}</div>
                                </div>
                                <div class="space-y-1">
                                    <div class="text-white-dark text-sm">Data Final:</div>
                                    <div class="font-semibold">{{ loan.endDate ? formatDate(loan.endDate) : 'Em andamento' }}</div>
                                </div>
                                <div class="space-y-1">
                                    <div class="text-white-dark text-sm">Última Atualização:</div>
                                    <div class="font-semibold">{{ loan.updatedAt ? formatDate(loan.updatedAt) : 'N/A' }}</div>
                                </div>
                                <div class="space-y-1">
                                    <div class="text-white-dark text-sm">Período de Juros:</div>
                                    <div class="font-semibold">{{ loan.interestPeriodName || 'N/A' }}</div>
                                </div>
                                <div v-if="loan.creditScore" class="space-y-1">
                                    <div class="text-white-dark text-sm">Score de Crédito:</div>
                                    <div class="font-semibold">{{ loan.creditScore }}</div>
                                </div>
                            </div>

                            <!-- Rejection Reason if applicable -->
                            <div v-if="loan.rejectionReason" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded">
                                <div class="text-white-dark text-sm mb-1">Motivo da Rejeição:</div>
                                <div class="text-red-700 dark:text-red-300">{{ loan.rejectionReason }}</div>
                            </div>
                        </div>

                        <!-- Installments Section -->
                        <div v-if="loan.installments && loan.installments.length > 0" class="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg">
                            <h3 class="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                                <icon-list-check class="w-5 h-5 mr-2" />
                                Cronograma de Parcelas
                            </h3>
                            <div class="overflow-x-auto">
                                <table class="table-striped w-full">
                                    <thead>
                                        <tr>
                                            <th>Parcela</th>
                                            <th>Data Vencimento</th>
                                            <th class="text-right">Valor</th>
                                            <th class="text-center">Status</th>
                                            <th class="text-center">Ações</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr v-for="installment in loan.installments" :key="installment.id">
                                            <td class="font-semibold">{{ installment.installmentNumber }}</td>
                                            <td>{{ formatDate(installment.dueDate) }}</td>
                                            <td class="text-right font-semibold">{{ formatCurrency(installment.amount) }}</td>
                                            <td class="text-center">
                                                <span class="badge" :class="getInstallmentStatusBadgeClass(installment.status)">
                                                    {{ installment.status }}
                                                </span>
                                            </td>
                                            <td class="text-center">
                                                <button class="hover:text-primary" title="Ver detalhes">
                                                    <icon-eye class="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useMeta } from '@/composables/use-meta';
import { useKrefasyStore } from '@/stores/index';
import { Loan } from '@/services/loans.service';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue';
import IconCircleCheck from '@/components/icon/icon-circle-check.vue';
import IconPrinter from '@/components/icon/icon-printer.vue';
import IconDownload from '@/components/icon/icon-download.vue';
import IconEdit from '@/components/icon/icon-edit.vue';
import IconArrowLeft from '@/components/icon/icon-arrow-left.vue';
import IconCreditCard from '@/components/icon/icon-credit-card.vue';
import IconUsers from '@/components/icon/icon-users.vue';
import IconCalendar from '@/components/icon/icon-calendar.vue';
import IconListCheck from '@/components/icon/icon-list-check.vue';
import IconEye from '@/components/icon/icon-eye.vue';

// Definir interface estendida para incluir propriedades do response real
interface ExtendedLoan extends Loan {
    loanNumber?: string;
    loanProductId?: string;
    loanProductName?: string;
    interestPeriodId?: string;
    interestPeriodName?: string;
    loanStatusId?: string;
    loanStatusName?: string;
    customerId?: string;
    managerId?: string | null;
    managerName?: string;
    requestedAmount?: number;
    approvedAmount?: number;
    numberOfInstallments?: number;
    startDate?: string;
    endDate?: string | null;
    rejectionReason?: string;
    notes?: string;
    installments?: any[];
}

useMeta({ title: 'Detalhes do Empréstimo' });

const route = useRoute();
const store = useKrefasyStore();

const loan = ref<ExtendedLoan | null>(null);
const loading = ref(false);
const error = ref('');

// Computed properties
const canApproveLoan = computed(() => {
    return loan.value &&
           loan.value.status === 'PENDING' &&
           store.hasPermission('approve_loans');
});

// Methods
const loadLoanDetails = async () => {
    try {
        loading.value = true;
        error.value = '';
        const loanId = route.params.id as string;

        const loanData = await store.fetchLoanById(loanId);
        loan.value = loanData;
    } catch (err: any) {
        error.value = err.message || 'Erro ao carregar detalhes do empréstimo';
        console.error('Erro ao carregar empréstimo:', err);
    } finally {
        loading.value = false;
    }
};

const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'APPROVED':
            return 'badge-outline-success';
        case 'PENDING':
            return 'badge-outline-warning';
        case 'REJECTED':
            return 'badge-outline-danger';
        case 'ACTIVE':
            return 'badge-outline-info';
        case 'COMPLETED':
            return 'badge-outline-dark';
        case 'DEFAULTED':
            return 'badge-outline-danger';
        default:
            return 'badge-outline-secondary';
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'APPROVED':
            return 'Aprovado';
        case 'PENDING':
            return 'Pendente';
        case 'REJECTED':
            return 'Rejeitado';
        case 'ACTIVE':
            return 'Ativo';
        case 'COMPLETED':
            return 'Finalizado';
        case 'DEFAULTED':
            return 'Inadimplente';
        case 'RESTRUCTURED':
            return 'Reestruturado';
        default:
            return status;
    }
};

const getProductTypeLabel = (productType: string) => {
    switch (productType) {
        case 'PERSONAL':
            return 'Pessoal';
        case 'BUSINESS':
            return 'Empresarial';
        case 'MORTGAGE':
            return 'Hipotecário';
        case 'VEHICLE':
            return 'Veicular';
        case 'EDUCATION':
            return 'Educacional';
        default:
            return productType;
    }
};

const getDocumentTypeLabel = (docType: string) => {
    switch (docType) {
        case 'IDENTITY':
            return 'Identidade';
        case 'INCOME':
            return 'Comprovante de Renda';
        case 'BANK_STATEMENT':
            return 'Extrato Bancário';
        case 'COLLATERAL':
            return 'Garantia';
        case 'OTHER':
            return 'Outros';
        default:
            return docType;
    }
};

const getRiskLevelBadgeClass = (riskLevel: string) => {
    switch (riskLevel) {
        case 'LOW':
            return 'badge-outline-success';
        case 'MEDIUM':
            return 'badge-outline-warning';
        case 'HIGH':
            return 'badge-outline-danger';
        default:
            return 'badge-outline-secondary';
    }
};

const getRiskLevelLabel = (riskLevel: string) => {
    switch (riskLevel) {
        case 'LOW':
            return 'Baixo';
        case 'MEDIUM':
            return 'Médio';
        case 'HIGH':
            return 'Alto';
        default:
            return riskLevel;
    }
};

const getInstallmentStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'pago':
        case 'paid':
            return 'badge-outline-success';
        case 'pendente':
        case 'pending':
            return 'badge-outline-warning';
        case 'atrasado':
        case 'overdue':
            return 'badge-outline-danger';
        default:
            return 'badge-outline-secondary';
    }
};

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
};

const formatCurrency = (amount: number) => {
    if (!amount) return 'AOA 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'AOA'
    }).format(amount);
};

const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const approveLoan = async () => {
    if (!loan.value) return;

    if (confirm('Tem certeza que deseja aprovar este empréstimo?')) {
        try {
            loading.value = true;
            await store.approveLoan(loan.value.id, {
                approved: true,
                modifiedAmount: loan.value.amount,
            });
            await loadLoanDetails(); // Recarregar dados atualizados
        } catch (err: any) {
            alert('Erro ao aprovar empréstimo: ' + (err.message || 'Erro desconhecido'));
        } finally {
            loading.value = false;
        }
    }
};

const printLoan = () => {
    window.print();
};

const downloadDetails = () => {
    // Implementar export para PDF
    alert('Funcionalidade de export será implementada em breve');
};

const downloadDocument = (doc: any) => {
    // Implementar download de documento
    alert(`Download do documento: ${doc.name}`);
};

onMounted(() => {
    loadLoanDetails();
});
</script>
            return 'badge-outline-secondary';
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'APPROVED':
            return 'Aprovado';
        case 'PENDING':
            return 'Pendente';
        case 'REJECTED':
            return 'Rejeitado';
        case 'ACTIVE':
            return 'Ativo';
        case 'COMPLETED':
            return 'Finalizado';
        case 'DEFAULTED':
            return 'Inadimplente';
        case 'RESTRUCTURED':
            return 'Reestruturado';
        default:
            return status;
    }
};

const getProductTypeLabel = (productType: string) => {
    switch (productType) {
        case 'PERSONAL':
            return 'Pessoal';
        case 'BUSINESS':
            return 'Empresarial';
        case 'MORTGAGE':
            return 'Hipotecário';
        case 'VEHICLE':
            return 'Veicular';
        case 'EDUCATION':
            return 'Educacional';
        default:
            return productType;
    }
};

const getDocumentTypeLabel = (docType: string) => {
    switch (docType) {
        case 'IDENTITY':
            return 'Identidade';
        case 'INCOME':
            return 'Comprovante de Renda';
        case 'BANK_STATEMENT':
            return 'Extrato Bancário';
        case 'COLLATERAL':
            return 'Garantia';
        case 'OTHER':
            return 'Outros';
        default:
            return docType;
    }
};

const getRiskLevelBadgeClass = (riskLevel: string) => {
    switch (riskLevel) {
        case 'LOW':
            return 'badge-outline-success';
        case 'MEDIUM':
            return 'badge-outline-warning';
        case 'HIGH':
            return 'badge-outline-danger';
        default:
            return 'badge-outline-secondary';
    }
};

const getRiskLevelLabel = (riskLevel: string) => {
    switch (riskLevel) {
        case 'LOW':
            return 'Baixo';
        case 'MEDIUM':
            return 'Médio';
        case 'HIGH':
            return 'Alto';
        default:
            return riskLevel;
    }
};

const getInstallmentStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'pago':
        case 'paid':
            return 'badge-outline-success';
        case 'pendente':
        case 'pending':
            return 'badge-outline-warning';
        case 'atrasado':
        case 'overdue':
            return 'badge-outline-danger';
        default:
            return 'badge-outline-secondary';
    }
};

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
};

const formatCurrency = (amount: number) => {
    if (!amount) return 'AOA 0,00';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'AOA'
    }).format(amount);
};

const formatFileSize = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const approveLoan = async () => {
    if (!loan.value) return;

    if (confirm('Tem certeza que deseja aprovar este empréstimo?')) {
        try {
            loading.value = true;
            await store.approveLoan(loan.value.id, {
                approved: true,
                modifiedAmount: loan.value.amount,
            });
            await loadLoanDetails(); // Recarregar dados atualizados
        } catch (err: any) {
            alert('Erro ao aprovar empréstimo: ' + (err.message || 'Erro desconhecido'));
        } finally {
            loading.value = false;
        }
    }
};

const printLoan = () => {
    window.print();
};

const downloadDetails = () => {
    // Implementar export para PDF
    alert('Funcionalidade de export será implementada em breve');
};

const downloadDocument = (doc: any) => {
    // Implementar download de documento
    alert(`Download do documento: ${doc.name}`);
};

onMounted(() => {
    loadLoanDetails();
});
</script>
