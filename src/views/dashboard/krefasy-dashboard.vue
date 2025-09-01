<template>
    <div>
        <!-- Breadcrumb -->
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <a href="javascript:;" class="text-primary hover:underline">Dashboard</a>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Krefasy</span>
            </li>
        </ul>

        <div class="pt-5">
            <!-- KPIs Cards -->
            <div class="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 mb-6">
                <!-- Total de Clientes -->
                <div class="panel h-full">
                    <div class="flex items-center justify-between dark:text-white-light mb-5">
                        <h5 class="font-semibold text-lg">Total de Clientes</h5>
                        <div class="w-11 h-11 text-primary bg-primary-light dark:bg-primary dark:text-primary-light grid place-content-center rounded-full">
                            <icon-users />
                        </div>
                    </div>
                    <div class="flex items-center">
                        <span class="text-3xl font-bold text-primary">{{ dashboardStats.totalClients.toLocaleString('pt-BR') }}</span>
                        <span class="text-success text-sm font-medium ml-2">+12%</span>
                    </div>
                    <p class="text-white-dark text-sm mt-2">Este mês</p>
                </div>

                <!-- Empréstimos Ativos -->
                <div class="panel h-full">
                    <div class="flex items-center justify-between dark:text-white-light mb-5">
                        <h5 class="font-semibold text-lg">Empréstimos Ativos</h5>
                        <div class="w-11 h-11 text-success bg-success-light dark:bg-success dark:text-success-light grid place-content-center rounded-full">
                            <icon-trending-up />
                        </div>
                    </div>
                    <div class="flex items-center">
                        <span class="text-3xl font-bold text-success">{{ dashboardStats.activeLoans.toLocaleString('pt-BR') }}</span>
                        <span class="text-success text-sm font-medium ml-2">+8%</span>
                    </div>
                    <p class="text-white-dark text-sm mt-2">Este mês</p>
                </div>

                <!-- Valor Total Emprestado -->
                <div class="panel h-full">
                    <div class="flex items-center justify-between dark:text-white-light mb-5">
                        <h5 class="font-semibold text-lg">Valor Total</h5>
                        <div class="w-11 h-11 text-warning bg-warning-light dark:bg-warning dark:text-warning-light grid place-content-center rounded-full">
                            <icon-dollar-sign />
                        </div>
                    </div>
                    <div class="flex items-center">
                        <span class="text-3xl font-bold text-warning">R$ {{ (dashboardStats.totalAmount / 1000000).toFixed(1) }}M</span>
                        <span class="text-success text-sm font-medium ml-2">+15%</span>
                    </div>
                    <p class="text-white-dark text-sm mt-2">Este mês</p>
                </div>

                <!-- Taxa de Inadimplência -->
                <div class="panel h-full">
                    <div class="flex items-center justify-between dark:text-white-light mb-5">
                        <h5 class="font-semibold text-lg">Taxa de Inadimplência</h5>
                        <div class="w-11 h-11 text-danger bg-danger-light dark:bg-danger dark:text-danger-light grid place-content-center rounded-full">
                            <icon-info-triangle />
                        </div>
                    </div>
                    <div class="flex items-center">
                        <span class="text-3xl font-bold text-danger">{{ dashboardStats.defaultRate.toFixed(1) }}%</span>
                        <span class="text-success text-sm font-medium ml-2">-2%</span>
                    </div>
                    <p class="text-white-dark text-sm mt-2">Este mês</p>
                </div>
            </div>

            <!-- Gráficos -->
            <div class="grid xl:grid-cols-2 gap-6 mb-6">
                <!-- Evolução de Empréstimos -->
                <div class="panel h-full">
                    <div class="flex items-center justify-between dark:text-white-light mb-5">
                        <h5 class="font-semibold text-lg">Evolução de Empréstimos</h5>
                        <div class="dropdown ltr:ml-auto rtl:mr-auto">
                            <Popper :placement="store.rtlClass === 'rtl' ? 'bottom-start' : 'bottom-end'" offsetDistance="0" class="align-middle">
                                <a href="javascript:;">
                                    <icon-horizontal-dots class="text-black/70 dark:text-white/70 hover:!text-primary" />
                                </a>
                                <template #content="{ close }">
                                    <ul @click="close()">
                                        <li>
                                            <a href="javascript:;">Mensal</a>
                                        </li>
                                        <li>
                                            <a href="javascript:;">Trimestral</a>
                                        </li>
                                        <li>
                                            <a href="javascript:;">Anual</a>
                                        </li>
                                    </ul>
                                </template>
                            </Popper>
                        </div>
                    </div>
                    <div class="relative">
                        <apexchart height="325" :options="loansChart" :series="loansSeries" class="bg-white dark:bg-black rounded-lg overflow-hidden">
                            <!-- loader -->
                            <div class="min-h-[325px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08]">
                                <span
                                    class="animate-spin border-2 border-black dark:border-white !border-l-transparent rounded-full w-5 h-5 inline-flex"
                                ></span>
                            </div>
                        </apexchart>
                    </div>
                </div>

                <!-- Distribuição por Produto -->
                <div class="panel h-full">
                    <div class="flex items-center mb-5">
                        <h5 class="font-semibold text-lg dark:text-white-light">Distribuição por Produto</h5>
                    </div>
                    <div>
                        <apexchart
                            height="460"
                            :options="productChart"
                            :series="productSeries"
                            class="bg-white dark:bg-black rounded-lg overflow-hidden"
                        >
                            <!-- loader -->
                            <div class="min-h-[460px] grid place-content-center bg-white-light/30 dark:bg-dark dark:bg-opacity-[0.08]">
                                <span
                                    class="animate-spin border-2 border-black dark:border-white !border-l-transparent rounded-full w-5 h-5 inline-flex"
                                ></span>
                            </div>
                        </apexchart>
                    </div>
                </div>
            </div>

            <!-- Tabelas Rápidas -->
            <div class="grid xl:grid-cols-2 gap-6 mb-6">
                <!-- Empréstimos Pendentes -->
                <div class="panel h-full">
                    <div class="flex items-center justify-between dark:text-white-light mb-5">
                        <h5 class="font-semibold text-lg">Empréstimos Pendentes</h5>
                        <a href="/loans/pending" class="text-primary hover:underline text-sm">Ver todos</a>
                    </div>
                    <div class="table-responsive">
                        <table class="table-striped">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Valor</th>
                                    <th>Status</th>
                                    <th>Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="loan in pendingLoans.slice(0, 5)" :key="loan.id">
                                    <td>{{ loan.clientName }}</td>
                                    <td>R$ {{ (loan.amount / 1000).toFixed(1) }}k</td>
                                    <td>
                                        <span class="badge badge-outline-warning">Pendente</span>
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-primary" @click="viewLoan(loan.id)">
                                            Ver
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Parcelas Vencendo -->
                <div class="panel h-full">
                    <div class="flex items-center justify-between dark:text-white-light mb-5">
                        <h5 class="font-semibold text-lg">Parcelas Vencendo</h5>
                        <a href="/parcels/overdue" class="text-primary hover:underline text-sm">Ver todas</a>
                    </div>
                    <div class="table-responsive">
                        <table class="table-striped">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Valor</th>
                                    <th>Vencimento</th>
                                    <th>Ação</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="parcel in overdueParcels.slice(0, 5)" :key="parcel.id">
                                    <td>{{ parcel.clientName }}</td>
                                    <td>R$ {{ (parcel.amount / 1000).toFixed(1) }}k</td>
                                    <td>
                                        <span class="text-danger">{{ formatDate(parcel.dueDate) }}</span>
                                    </td>
                                    <td>
                                        <button class="btn btn-sm btn-warning" @click="viewParcel(parcel.id)">
                                            Ver
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Atividade Recente -->
            <div class="panel">
                <div class="flex items-center justify-between dark:text-white-light mb-5">
                    <h5 class="font-semibold text-lg">Atividade Recente</h5>
                    <a href="/activity" class="text-primary hover:underline text-sm">Ver todas</a>
                </div>
                <div class="space-y-4">
                    <div v-for="activity in recentActivity" :key="activity.id" class="flex items-center space-x-4 p-3 bg-gray-50 dark:bg-dark-light rounded-lg">
                        <div class="w-10 h-10 rounded-full bg-primary-light dark:bg-primary flex items-center justify-center">
                            <component :is="activity.icon" class="w-5 h-5 text-primary" />
                        </div>
                        <div class="flex-1">
                            <p class="font-medium dark:text-white-light">{{ activity.title }}</p>
                            <p class="text-sm text-gray-600 dark:text-gray-400">{{ activity.description }}</p>
                        </div>
                        <span class="text-xs text-gray-500">{{ formatTimeAgo(activity.timestamp) }}</span>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useKrefasyStore } from '@/stores/index';
import { useAppStore } from '@/stores/index';
import IconUsers from '@/components/icon/icon-users.vue';
import IconTrendingUp from '@/components/icon/icon-trending-up.vue';
import IconDollarSign from '@/components/icon/icon-dollar-sign.vue';
import IconInfoTriangle from '@/components/icon/icon-info-triangle.vue';
import IconHorizontalDots from '@/components/icon/icon-horizontal-dots.vue';
import IconUserPlus from '@/components/icon/icon-user-plus.vue';
import IconCheckCircle from '@/components/icon/icon-square-check.vue';
import IconAlertCircle from '@/components/icon/icon-info-triangle.vue';

// Router e Stores
const router = useRouter();
const krefasyStore = useKrefasyStore();
const store = useAppStore();

// Estado
const loading = ref(false);
const pendingLoans = ref<any[]>([]);
const overdueParcels = ref<any[]>([]);
const recentActivity = ref<any[]>([]);

// Computed
const dashboardStats = computed(() => krefasyStore.dashboardStats);

// Configuração dos gráficos
const loansChart = ref({
    chart: {
        type: 'area',
        height: 325,
        toolbar: {
            show: false,
        },
    },
    dataLabels: {
        enabled: false,
    },
    stroke: {
        curve: 'smooth',
        width: 3,
    },
    colors: ['#4361ee'],
    series: [
        {
            name: 'Empréstimos',
            data: [30, 40, 35, 50, 49, 60, 70, 91, 125, 150, 180, 200],
        },
    ],
    xaxis: {
        categories: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'],
    },
    tooltip: {
        theme: 'dark',
    },
});

const loansSeries = ref([
    {
        name: 'Empréstimos',
        data: [30, 40, 35, 50, 49, 60, 70, 91, 125, 150, 180, 200],
    },
]);

const productChart = ref({
    chart: {
        type: 'donut',
        height: 460,
    },
    colors: ['#4361ee', '#805dca', '#00ab55', '#e2a03f', '#e7515a'],
    series: [44, 55, 13, 33, 22],
    labels: ['Pessoal', 'Empresarial', 'Hipotecário', 'Veículo', 'Educação'],
    legend: {
        position: 'bottom',
    },
    tooltip: {
        theme: 'dark',
    },
});

const productSeries = ref([44, 55, 13, 33, 22]);

// Métodos
const viewLoan = (id: string) => {
    router.push(`/loans/${id}`);
};

const viewParcel = (id: string) => {
    router.push(`/parcels/${id}`);
};

const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('pt-BR');
};

const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
        return `${diffInMinutes}m atrás`;
    } else if (diffInMinutes < 1440) {
        return `${Math.floor(diffInMinutes / 60)}h atrás`;
    } else {
        return `${Math.floor(diffInMinutes / 1440)}d atrás`;
    }
};

// Carregar dados
const loadDashboardData = async () => {
    try {
        loading.value = true;

        // Carregar estatísticas
        await krefasyStore.fetchDashboardStats();

        // Carregar empréstimos pendentes
        const pendingResponse = await krefasyStore.fetchLoans({ status: 'PENDING', limit: 5 });
        pendingLoans.value = pendingResponse.loans;

        // Carregar parcelas vencendo
        const overdueResponse = await krefasyStore.fetchParcels({ overdueOnly: true, limit: 5 });
        overdueParcels.value = overdueResponse.parcels;

        // Simular atividade recente
        recentActivity.value = [
            {
                id: 1,
                icon: IconUserPlus,
                title: 'Novo cliente cadastrado',
                description: 'João Silva foi cadastrado no sistema',
                timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
            },
            {
                id: 2,
                icon: IconCheckCircle,
                title: 'Empréstimo aprovado',
                description: 'Empréstimo de R$ 50.000 foi aprovado para Maria Santos',
                timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
            },
            {
                id: 3,
                icon: IconAlertCircle,
                title: 'Parcela vencida',
                description: 'Parcela de R$ 1.200 venceu para Pedro Costa',
                timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
            },
        ];

    } catch (error) {
        console.error('Erro ao carregar dados do dashboard:', error);
    } finally {
        loading.value = false;
    }
};

// Lifecycle
onMounted(() => {
    loadDashboardData();
});
</script>

<style scoped>
.table-responsive {
    overflow-x: auto;
}

.table-striped tbody tr:nth-child(even) {
    background-color: rgba(0, 0, 0, 0.02);
}

:global(.dark) .table-striped tbody tr:nth-child(even) {
    background-color: rgba(255, 255, 255, 0.02);
}

.badge {
    display: inline-block;
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
    font-weight: 500;
    border-radius: 0.375rem;
}

.badge-outline-warning {
    color: #e2a03f;
    border: 1px solid #e2a03f;
    background-color: transparent;
}

.btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 0.375rem;
    font-size: 0.875rem;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    text-decoration: none;
}

.btn-sm {
    padding: 0.25rem 0.5rem;
    font-size: 0.75rem;
}

.btn-primary {
    background-color: #4361ee;
    color: white;
}

.btn-primary:hover {
    background-color: #3a56d4;
}

.btn-warning {
    background-color: #e2a03f;
    color: white;
}

.btn-warning:hover {
    background-color: #d1902e;
}
</style>
