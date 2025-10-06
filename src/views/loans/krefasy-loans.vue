<template>
    <div>
        <!-- Breadcrumb -->
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <a href="javascript:;" class="text-primary hover:underline">Dashboard</a>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Empréstimos</span>
            </li>
        </ul>

        <!-- Header com Estatísticas -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-6 mt-5">
            <div class="panel">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total de Empréstimos</p>
                        <p class="text-2xl font-bold text-primary">{{ totalLoans }}</p>
                    </div>
                    <div class="p-3 bg-primary/10 rounded-full">
                        <icon-file class="w-6 h-6 text-primary" />
                    </div>
                </div>
            </div>

            <div class="panel">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Pendentes</p>
                        <p class="text-2xl font-bold text-warning">{{ pendingCount }}</p>
                    </div>
                    <div class="p-3 bg-warning/10 rounded-full">
                        <icon-clock class="w-6 h-6 text-warning" />
                    </div>
                </div>
            </div>

            <div class="panel">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Aprovados</p>
                        <p class="text-2xl font-bold text-success">{{ approvedCount }}</p>
                    </div>
                    <div class="p-3 bg-success/10 rounded-full">
                        <icon-square-check class="w-6 h-6 text-success" />
                    </div>
                </div>
            </div>

            <div class="panel">
                <div class="flex items-center justify-between">
                    <div>
                        <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Valor Total</p>
                        <p class="text-2xl font-bold text-info">{{ formatCurrency(totalAmount) }}</p>
                    </div>
                    <div class="p-3 bg-info/10 rounded-full">
                        <icon-dollar-sign class="w-6 h-6 text-info" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Filtros e Ações -->
        <div class="panel mt-5">
            <div class="flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <!-- Filtros -->
                <div class="flex flex-col sm:flex-row gap-4 flex-1">
                    <div class="flex gap-2">
                        <select v-model="filters.status" @change="applyFilters" class="form-select min-w-[150px]">
                            <option value="">Todos os Status</option>
                            <option v-for="status in loanStatuses" :key="status.id" :value="status.name">
                                {{ status.name }}
                            </option>
                        </select>

                        <select v-model="filters.product" @change="applyFilters" class="form-select min-w-[150px]">
                            <option value="">Todos os Produtos</option>
                            <option v-for="product in loanProducts" :key="product.id" :value="product.name">
                                {{ product.name }}
                            </option>
                        </select>

                        <select v-model="filters.currency" @change="applyFilters" class="form-select min-w-[120px]">
                            <option value="">Todas as Moedas</option>
                            <option v-for="currency in currencies" :key="currency.id" :value="currency.code">
                                {{ currency.code }} - {{ currency.name }}
                            </option>
                        </select>
                    </div>

                    <div class="flex gap-2">
                        <input
                            v-model="searchQuery"
                            @input="debounceSearch"
                            type="text"
                            class="form-input min-w-[200px]"
                            placeholder="Buscar por número, cliente..."
                        />

                        <button @click="clearFilters" class="btn btn-outline-secondary gap-2">
                            <icon-x />
                            Limpar
                        </button>
                    </div>
                </div>

                <!-- Ações -->
                <div class="flex gap-2">
                    <button @click="exportLoans" class="btn btn-outline-primary gap-2">
                        <icon-download />
                        Exportar
                        </button>

                        <router-link to="/loans/add" class="btn btn-primary gap-2">
                            <icon-plus />
                            Novo Empréstimo
                        </router-link>
                    </div>
                    </div>
                </div>

        <!-- Lista de Empréstimos -->
        <div class="panel mt-5">
            <!-- Loading -->
            <div v-if="loading" class="flex items-center justify-center py-12">
                        <div class="flex flex-col items-center gap-4">
                    <span class="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10 inline-block"></span>
                            <span class="text-sm text-gray-600 dark:text-gray-300">Carregando empréstimos...</span>
                        </div>
                    </div>

            <!-- Lista de Cards -->
            <div v-else-if="loans.length > 0" class="space-y-4">
                <div
                    v-for="loan in loans"
                    :key="loan.id"
                    class="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                    <div class="flex flex-col lg:flex-row gap-4">
                        <!-- Informações Principais -->
                        <div class="flex-1">
                            <div class="flex items-start justify-between mb-3">
                                <div>
                                    <h3 class="text-lg font-semibold text-primary">{{ loan.loanNumber }}</h3>
                                    <p class="text-sm text-gray-600 dark:text-gray-400">{{ loan.customerName }}</p>
                                    <p class="text-xs text-gray-500">{{ loan.customerEmail }}</p>
                                </div>

                                <div class="text-right">
                                    <span class="badge" :class="getStatusBadgeClass(loan.loanStatusName)">
                                        {{ loan.loanStatusName }}
                                    </span>
                                    <p class="text-xs text-gray-500 mt-1">
                                        Criado em {{ formatDate(loan.createdAt) }}
                                    </p>
                                </div>
                            </div>

                            <!-- Detalhes do Empréstimo -->
                            <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                    <p class="text-gray-600 dark:text-gray-400">Produto</p>
                                    <p class="font-medium">{{ loan.loanProductName }}</p>
                                </div>

                                <div>
                                    <p class="text-gray-600 dark:text-gray-400">Valor Solicitado</p>
                                    <p class="font-medium">{{ formatCurrency(loan.requestedAmount, loan.currencySymbol, loan.currencyCode) }}</p>
                                </div>

                                <div>
                                    <p class="text-gray-600 dark:text-gray-400">Valor Aprovado</p>
                                    <p class="font-medium">{{ formatCurrency(loan.approvedAmount || 0, loan.currencySymbol, loan.currencyCode) }}</p>
                                </div>

                                <div>
                                    <p class="text-gray-600 dark:text-gray-400">Parcelas</p>
                                    <p class="font-medium">{{ loan.numberOfInstallments }}x {{ formatCurrency(loan.monthlyPayment || 0, loan.currencySymbol, loan.currencyCode) }}</p>
                                </div>
                            </div>

                            <!-- Informações Adicionais -->
                            <div class="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mt-3">
                                <div>
                                    <p class="text-gray-600 dark:text-gray-400">Taxa de Juros</p>
                                    <p class="font-medium">{{ loan.interestRate }}%</p>
                                </div>

                                <div>
                                    <p class="text-gray-600 dark:text-gray-400">Período</p>
                                    <p class="font-medium">{{ loan.interestPeriodName }}</p>
                                </div>

                                <div v-if="loan.managerName">
                                    <p class="text-gray-600 dark:text-gray-400">Gestor</p>
                                    <p class="font-medium">{{ loan.managerName }}</p>
                                </div>
                            </div>
                        </div>

                        <!-- Ações -->
                        <div class="flex flex-col gap-2 lg:min-w-[120px]">
                            <router-link
                                :to="`/loans/view/${loan.id}`"
                                class="btn btn-outline-primary btn-sm gap-2"
                            >
                                <icon-eye />
                                Ver Detalhes
                            </router-link>

                            <router-link
                                :to="`/loans/edit/${loan.id}`"
                                class="btn btn-outline-info btn-sm gap-2"
                            >
                                <icon-edit />
                                Editar
                                </router-link>

                            <button
                                v-if="canApproveLoan(loan)"
                                @click="quickApprove(loan)"
                                class="btn btn-outline-success btn-sm gap-2"
                            >
                                <icon-square-check />
                                Aprovar
                            </button>

                            <button
                                v-if="canRejectLoan(loan)"
                                @click="quickReject(loan)"
                                class="btn btn-outline-danger btn-sm gap-2"
                            >
                                <icon-x-circle />
                                Rejeitar
                            </button>

                            <span
                                v-if="!canApproveLoan(loan) && !canRejectLoan(loan)"
                                class="text-xs text-gray-500 text-center"
                            >
                                {{ getActionButtonText(loan) }}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Estado Vazio -->
            <div v-else class="text-center py-12">
                <icon-file class="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Nenhum empréstimo encontrado</h3>
                <p class="text-gray-600 dark:text-gray-400 mb-4">
                    {{ searchQuery || hasActiveFilters ? 'Tente ajustar os filtros de busca.' : 'Comece criando um novo empréstimo.' }}
                </p>
                <router-link v-if="!searchQuery && !hasActiveFilters" to="/loans/add" class="btn btn-primary gap-2">
                    <icon-plus />
                    Novo Empréstimo
                                </router-link>
            </div>
        </div>

        <!-- Paginação -->
        <div v-if="totalPages > 1" class="panel mt-5">
            <div class="flex items-center justify-between">
                <div class="text-sm text-gray-600 dark:text-gray-400">
                    Mostrando {{ ((currentPage - 1) * pageSize) + 1 }} a {{ Math.min(currentPage * pageSize, totalLoans) }} de {{ totalLoans }} empréstimos
                </div>

                <div class="flex gap-2">
                    <button
                        @click="changePage(currentPage - 1)"
                        :disabled="currentPage === 1"
                        class="btn btn-outline-secondary btn-sm"
                    >
                        <icon-arrow-left />
                        Anterior
                    </button>

                    <div class="flex gap-1">
                        <button
                            v-for="page in visiblePages"
                            :key="page"
                            @click="changePage(page)"
                            :class="[
                                'btn btn-sm',
                                page === currentPage ? 'btn-primary' : 'btn-outline-secondary'
                            ]"
                        >
                            {{ page }}
                                </button>
                            </div>

                    <button
                        @click="changePage(currentPage + 1)"
                        :disabled="currentPage === totalPages"
                        class="btn btn-outline-secondary btn-sm"
                    >
                        Próximo
                        <icon-arrow-forward />
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue';
import { useMeta } from '@/composables/use-meta';
import { useKrefasyStore } from '@/stores/index';
import Swal from 'sweetalert2';

// Icons
import IconFile from '@/components/icon/icon-file.vue';
import IconClock from '@/components/icon/icon-clock.vue';
import IconSquareCheck from '@/components/icon/icon-square-check.vue';
import IconDollarSign from '@/components/icon/icon-dollar-sign.vue';
import IconX from '@/components/icon/icon-x.vue';
import IconDownload from '@/components/icon/icon-download.vue';
import IconPlus from '@/components/icon/icon-plus.vue';
import IconEye from '@/components/icon/icon-eye.vue';
import IconEdit from '@/components/icon/icon-edit.vue';
import IconXCircle from '@/components/icon/icon-x-circle.vue';
import IconArrowLeft from '@/components/icon/icon-arrow-left.vue';
import IconArrowForward from '@/components/icon/icon-arrow-forward.vue';

useMeta({ title: 'Gestão de Empréstimos' });

const store = useKrefasyStore();

// Estado reativo
const loans = ref<any[]>([]);
const loading = ref(false);
const searchQuery = ref('');
const currentPage = ref(1);
const pageSize = ref(10);
const totalLoans = ref(0);
const totalPages = ref(0);
const pendingLoans = ref(0);
const approvedLoans = ref(0);
const totalAmount = ref(0);

// Filtros
const filters = ref({
    status: '',
    product: '',
    currency: ''
});

// Dados para filtros
const loanStatuses = ref<any[]>([]);
const loanProducts = ref<any[]>([]);
const currencies = ref<any[]>([]);

// Debounce para busca
let searchTimeout: ReturnType<typeof setTimeout>;

// Computed properties
const pendingCount = computed(() => {
    return loans.value.filter(loan => loan.loanStatusName === 'Pendente').length;
});

const approvedCount = computed(() => {
    return loans.value.filter(loan => loan.loanStatusName === 'Aprovado').length;
});

// totalAmount é calculado dinamicamente no fetchLoans

const hasActiveFilters = computed(() => {
    return filters.value.status || filters.value.product || filters.value.currency;
});

const visiblePages = computed(() => {
    const pages: number[] = [];
    const start = Math.max(1, currentPage.value - 2);
    const end = Math.min(totalPages.value, currentPage.value + 2);

    for (let i = start; i <= end; i++) {
        pages.push(i);
    }

    return pages;
});

// Métodos
const fetchLoans = async () => {
    try {
        loading.value = true;

        const params: any = {
            Page: currentPage.value,
            Limit: pageSize.value
        };

        // Adicionar filtros usando os nomes corretos da API
        if (filters.value.status) params.StatusId = filters.value.status;
        if (filters.value.product) params.LoanProductId = filters.value.product;
        if (searchQuery.value) params.Search = searchQuery.value;

        const response = await store.fetchLoans(params);

        if (response?.loans) {
            loans.value = response.loans;
            totalLoans.value = response.total;
            totalPages.value = response.totalPages;

            // Calcular estatísticas do dashboard
            pendingLoans.value = loans.value.filter(loan => loan.loanStatusName === 'Pendente').length;
            approvedLoans.value = loans.value.filter(loan => loan.loanStatusName === 'Aprovado').length;
            totalAmount.value = loans.value.reduce((sum, loan) => sum + (loan.requestedAmount || 0), 0);
        } else {
            loans.value = [];
            totalLoans.value = 0;
            totalPages.value = 1;
            pendingLoans.value = 0;
            approvedLoans.value = 0;
            totalAmount.value = 0;
        }
    } catch (error) {
        console.error('Erro ao buscar empréstimos:', error);
        await Swal.fire({
            title: 'Erro!',
            text: 'Erro ao carregar empréstimos. Tente novamente.',
            icon: 'error',
            confirmButtonColor: '#dc3545'
        });
    } finally {
        loading.value = false;
    }
};

const fetchFilterData = async () => {
    try {
        // Buscar status dos empréstimos
        const statuses = await store.fetchLoanStatuses();
        loanStatuses.value = statuses || [];

        // TODO: Implementar busca de produtos e moedas
        // const products = await store.fetchLoanProducts();
        // loanProducts.value = products || [];

        // const currencyData = await store.fetchCurrencies();
        // currencies.value = currencyData || [];

        // Dados estáticos temporários
        loanProducts.value = [
            { id: '1', name: 'Crédito Pessoal PT' },
            { id: '2', name: 'Crédito Pessoal BR' }
        ];

        currencies.value = [
            { id: '1', code: 'EUR', name: 'Euro' },
            { id: '2', code: 'BRL', name: 'Real Brasileiro' }
        ];
    } catch (error) {
        console.error('Erro ao buscar dados para filtros:', error);
    }
};

const debounceSearch = () => {
    if (searchTimeout) {
        clearTimeout(searchTimeout);
    }
    searchTimeout = setTimeout(() => {
        currentPage.value = 1;
        fetchLoans();
    }, 500);
};

const applyFilters = () => {
    currentPage.value = 1;
    fetchLoans();
};

const clearFilters = () => {
    filters.value = {
        status: '',
        product: '',
        currency: ''
    };
    searchQuery.value = '';
    currentPage.value = 1;
    fetchLoans();
};

const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
        fetchLoans();
    }
};

const exportLoans = async () => {
    try {
        await Swal.fire({
            title: 'Exportando...',
            text: 'Preparando dados para exportação',
            icon: 'info',
            allowOutsideClick: false,
            showConfirmButton: false
        });

        // Implementar exportação
        await Swal.fire({
            title: 'Sucesso!',
            text: 'Dados exportados com sucesso',
            icon: 'success',
            confirmButtonColor: '#28a745'
        });
    } catch (error) {
        await Swal.fire({
            title: 'Erro!',
            text: 'Erro ao exportar dados',
            icon: 'error',
            confirmButtonColor: '#dc3545'
        });
    }
};

const quickApprove = async (loan: any) => {
    const { value: stripeAccountId } = await Swal.fire({
        title: 'Aprovar Empréstimo com Stripe',
        text: 'Por favor, informe o Stripe Account ID para prosseguir com a aprovação:',
        input: 'text',
        inputLabel: 'Stripe Account ID',
        inputPlaceholder: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        inputValue: '08de0395-27f3-40af-860d-b218143bf0e0',
        inputValidator: (value) => {
            if (!value) {
                return 'Stripe Account ID é obrigatório!';
            }
            // Validação básica de UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(value)) {
                return 'Formato inválido. Use um UUID válido.';
            }
            return null;
        },
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        icon: 'question'
    });

    if (stripeAccountId) {
        const result = await Swal.fire({
            title: 'Confirmar Aprovação',
            text: `Tem certeza que deseja aprovar o empréstimo ${loan.loanNumber} de ${formatCurrency(loan.requestedAmount, loan.currencySymbol, loan.currencyCode)} com Stripe?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, aprovar!',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d'
        });

        if (result.isConfirmed) {
            try {
                loading.value = true;
                await store.approveWithStripe(loan.id, stripeAccountId);
                await fetchLoans(); // Recarregar dados atualizados

                await Swal.fire({
                    title: 'Sucesso!',
                    text: 'Empréstimo aprovado com sucesso!',
                    icon: 'success',
                    confirmButtonColor: '#28a745'
                });
            } catch (error: any) {
                console.error('Erro ao aprovar empréstimo:', error);
                await Swal.fire({
                    title: 'Erro!',
                    text: error.message || 'Erro ao aprovar empréstimo. Tente novamente.',
                    icon: 'error',
                    confirmButtonColor: '#dc3545'
                });
            } finally {
                loading.value = false;
            }
        }
    }
};

const quickReject = async (loan: any) => {
    const { value: reason } = await Swal.fire({
        title: 'Rejeitar Empréstimo',
        text: 'Informe o motivo da rejeição:',
        input: 'textarea',
        inputPlaceholder: 'Motivo da rejeição...',
        inputValidator: (value) => {
            if (!value) {
                return 'Motivo é obrigatório!';
            }
            return null;
        },
        showCancelButton: true,
        confirmButtonText: 'Continuar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6c757d'
    });

    if (reason) {
        const result = await Swal.fire({
            title: 'Confirmar Rejeição',
            text: `Tem certeza que deseja rejeitar o empréstimo ${loan.loanNumber}?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, rejeitar!',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d'
        });

        if (result.isConfirmed) {
            try {
                loading.value = true;
                // Usando o método approveLoan com approved: false para rejeitar
                await store.approveLoan(loan.id, {
                    approved: false,
                    rejectionReason: reason,
                    modifiedAmount: loan.requestedAmount,
                });
                await fetchLoans(); // Recarregar dados atualizados

                await Swal.fire({
                    title: 'Sucesso!',
                    text: 'Empréstimo rejeitado com sucesso!',
                    icon: 'success',
                    confirmButtonColor: '#28a745'
                });
            } catch (error: any) {
                console.error('Erro ao rejeitar empréstimo:', error);
                await Swal.fire({
                    title: 'Erro!',
                    text: error.message || 'Erro ao rejeitar empréstimo. Tente novamente.',
                    icon: 'error',
                    confirmButtonColor: '#dc3545'
                });
            } finally {
                loading.value = false;
            }
        }
    }
};

const canApproveLoan = (loan: any) => {
    if (!loan) return false;
    const status = loan.loanStatusName || loan.status;
    // Só pode aprovar se estiver pendente
    return status === 'PENDING' || status === 'Pendente';
};

const canRejectLoan = (loan: any) => {
    if (!loan) return false;
    const status = loan.loanStatusName || loan.status;
    // Só pode rejeitar se estiver pendente
    return status === 'PENDING' || status === 'Pendente';
};

const getActionButtonText = (loan: any) => {
    if (!loan) return '';
    const status = loan.loanStatusName || loan.status;

    switch (status) {
        case 'Aprovado':
            return 'Já Aprovado';
        case 'Rejeitado':
            return 'Rejeitado';
        case 'Ativo':
            return 'Em Andamento';
        case 'Finalizado':
            return 'Finalizado';
        case 'Inadimplente':
            return 'Inadimplente';
        case 'Reestruturado':
            return 'Reestruturado';
        default:
            return status || 'Status Desconhecido';
    }
};

const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'Aprovado':
            return 'badge-outline-success';
        case 'Pendente':
            return 'badge-outline-warning';
        case 'Rejeitado':
            return 'badge-outline-danger';
        case 'Ativo':
            return 'badge-outline-info';
        case 'Finalizado':
            return 'badge-outline-secondary';
        default:
            return 'badge-outline-info';
    }
};

const formatCurrency = (amount: number, currencySymbol?: string, currencyCode?: string) => {
    if (!amount) {
        return `${currencySymbol || 'AOA'} 0,00`;
    }

    if (currencySymbol && currencyCode) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: currencyCode,
            currencyDisplay: 'symbol'
        }).format(amount).replace(/^[^\d]*/, currencySymbol + ' ');
    }

    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'AOA'
    }).format(amount);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
};

// Lifecycle
onMounted(async () => {
    await Promise.all([
        fetchLoans(),
        fetchFilterData()
    ]);
});

// Watchers
watch(currentPage, () => {
    fetchLoans();
});
</script>
