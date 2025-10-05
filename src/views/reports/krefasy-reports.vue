<template>
    <div>
        <!-- Breadcrumb -->
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <router-link to="/dashboard" class="text-primary hover:underline">Dashboard</router-link>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Relatórios</span>
            </li>
        </ul>

        <div class="pt-5">
            <!-- Header -->
            <div class="flex flex-wrap items-center justify-between gap-4 mb-6">
                <div>
                    <h2 class="text-2xl font-bold dark:text-white-light">Relatórios e Analytics</h2>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Acompanhe o desempenho financeiro e operacional</p>
                </div>
                <div class="flex gap-4">
                    <button
                        type="button"
                        class="btn btn-outline-primary"
                        @click="exportReport"
                    >
                        <svg class="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Exportar
                    </button>
                    <button
                        type="button"
                        class="btn btn-primary"
                        @click="refreshData"
                    >
                        <svg class="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                        </svg>
                        Atualizar
                    </button>
                </div>
            </div>

            <!-- Filtros de Período -->
            <div class="panel mb-6">
                <div class="flex flex-wrap items-center gap-4">
                    <div>
                        <label class="form-label">Período</label>
                        <select v-model="selectedPeriod" class="form-select">
                            <option value="7">Últimos 7 dias</option>
                            <option value="30">Últimos 30 dias</option>
                            <option value="90">Últimos 90 dias</option>
                            <option value="365">Último ano</option>
                            <option value="custom">Personalizado</option>
                        </select>
                    </div>
                    <div v-if="selectedPeriod === 'custom'">
                        <label class="form-label">Data Início</label>
                        <input v-model="startDate" type="date" class="form-input" />
                    </div>
                    <div v-if="selectedPeriod === 'custom'">
                        <label class="form-label">Data Fim</label>
                        <input v-model="endDate" type="date" class="form-input" />
                    </div>
                    <div>
                        <label class="form-label">Tipo de Relatório</label>
                        <select v-model="reportType" class="form-select">
                            <option value="financial">Financeiro</option>
                            <option value="operational">Operacional</option>
                            <option value="risk">Risco</option>
                            <option value="compliance">Compliance</option>
                        </select>
                    </div>
                </div>
            </div>

            <!-- Cards de Resumo -->
            <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                <!-- Volume Total -->
                <div class="panel">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Volume Total</h3>
                            <p class="text-2xl font-bold text-primary">R$ 2.847.350</p>
                            <p class="text-sm text-success">+12.5% vs período anterior</p>
                        </div>
                        <div class="p-3 bg-primary/10 rounded-full">
                            <svg class="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Empréstimos Ativos -->
                <div class="panel">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Empréstimos Ativos</h3>
                            <p class="text-2xl font-bold text-success">1.247</p>
                            <p class="text-sm text-success">+8.2% vs período anterior</p>
                        </div>
                        <div class="p-3 bg-success/10 rounded-full">
                            <svg class="w-8 h-8 text-success" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Taxa de Inadimplência -->
                <div class="panel">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Inadimplência</h3>
                            <p class="text-2xl font-bold text-warning">3.2%</p>
                            <p class="text-sm text-warning">+0.5% vs período anterior</p>
                        </div>
                        <div class="p-3 bg-warning/10 rounded-full">
                            <svg class="w-8 h-8 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                            </svg>
                        </div>
                    </div>
                </div>

                <!-- Ticket Médio -->
                <div class="panel">
                    <div class="flex items-center justify-between">
                        <div>
                            <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Ticket Médio</h3>
                            <p class="text-2xl font-bold text-info">R$ 2.284</p>
                            <p class="text-sm text-success">+5.3% vs período anterior</p>
                        </div>
                        <div class="p-3 bg-info/10 rounded-full">
                            <svg class="w-8 h-8 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 8v8m-4-5v5m-4-2v2m-2 4h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Gráficos -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <!-- Gráfico de Volume por Mês -->
                <div class="panel">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold">Volume de Empréstimos por Mês</h3>
                        <div class="flex gap-2">
                            <button
                                v-for="type in chartTypes"
                                :key="type.value"
                                @click="selectedChartType = type.value"
                                class="btn btn-sm"
                                :class="selectedChartType === type.value ? 'btn-primary' : 'btn-outline-primary'"
                            >
                                {{ type.label }}
                            </button>
                        </div>
                    </div>
                    <div class="h-80">
                        <canvas ref="volumeChart" class="w-full h-full"></canvas>
                    </div>
                </div>

                <!-- Gráfico de Status de Empréstimos -->
                <div class="panel">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold">Distribuição por Status</h3>
                    </div>
                    <div class="h-80">
                        <canvas ref="statusChart" class="w-full h-full"></canvas>
                    </div>
                </div>
            </div>

            <!-- Tabelas de Dados -->
            <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <!-- Top Clientes por Volume -->
                <div class="panel">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold">Top Clientes por Volume</h3>
                        <span class="badge badge-primary">Top 10</span>
                    </div>
                    <div class="table-responsive">
                        <table class="table-hover">
                            <thead>
                                <tr>
                                    <th>Cliente</th>
                                    <th>Volume</th>
                                    <th>Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="client in topClients" :key="client.id">
                                    <td>
                                        <div class="flex items-center gap-2">
                                            <div class="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                                                <span class="text-xs font-semibold text-primary">{{ getInitials(client.name) }}</span>
                                            </div>
                                            <div>
                                                <div class="font-semibold text-sm">{{ client.name }}</div>
                                                <div class="text-xs text-gray-500">{{ client.email }}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td class="font-semibold">{{ formatCurrency(client.volume) }}</td>
                                    <td>
                                        <span class="badge" :class="getClientStatusClass(client.status)">
                                            {{ client.status }}
                                        </span>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Produtos Mais Populares -->
                <div class="panel">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold">Produtos Mais Populares</h3>
                        <span class="badge badge-success">30 dias</span>
                    </div>
                    <div class="table-responsive">
                        <table class="table-hover">
                            <thead>
                                <tr>
                                    <th>Produto</th>
                                    <th>Quantidade</th>
                                    <th>Volume</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr v-for="product in popularProducts" :key="product.id">
                                    <td>
                                        <div>
                                            <div class="font-semibold text-sm">{{ product.name }}</div>
                                            <div class="text-xs text-gray-500">{{ product.description }}</div>
                                        </div>
                                    </td>
                                    <td class="font-semibold">{{ product.quantity }}</td>
                                    <td class="font-semibold">{{ formatCurrency(product.volume) }}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <!-- Relatório de Risco -->
            <div class="panel mb-6">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold">Análise de Risco</h3>
                    <div class="flex gap-2">
                        <span class="badge badge-warning">Monitoramento Ativo</span>
                    </div>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <!-- Score de Risco Médio -->
                    <div class="text-center">
                        <div class="relative w-24 h-24 mx-auto mb-4">
                            <svg class="w-24 h-24 transform -rotate-90" viewBox="0 0 36 36">
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#e5e7eb"
                                    stroke-width="3"
                                />
                                <path
                                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                    fill="none"
                                    stroke="#f59e0b"
                                    stroke-width="3"
                                    stroke-dasharray="65, 100"
                                />
                            </svg>
                            <div class="absolute inset-0 flex items-center justify-center">
                                <span class="text-lg font-bold text-warning">65%</span>
                            </div>
                        </div>
                        <h4 class="font-semibold text-warning">Score Médio</h4>
                        <p class="text-sm text-gray-600">Baseado em 1.247 clientes</p>
                    </div>

                    <!-- Distribuição de Risco -->
                    <div>
                        <h4 class="font-semibold mb-3">Distribuição por Risco</h4>
                        <div class="space-y-2">
                            <div class="flex items-center justify-between">
                                <span class="text-sm">Baixo</span>
                                <span class="text-sm font-semibold">45%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-success h-2 rounded-full" style="width: 45%"></div>
                            </div>
                        </div>
                        <div class="space-y-2 mt-3">
                            <div class="flex items-center justify-between">
                                <span class="text-sm">Médio</span>
                                <span class="text-sm font-semibold">35%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-warning h-2 rounded-full" style="width: 35%"></div>
                            </div>
                        </div>
                        <div class="space-y-2 mt-3">
                            <div class="flex items-center justify-between">
                                <span class="text-sm">Alto</span>
                                <span class="text-sm font-semibold">20%</span>
                            </div>
                            <div class="w-full bg-gray-200 rounded-full h-2">
                                <div class="bg-danger h-2 rounded-full" style="width: 20%"></div>
                            </div>
                        </div>
                    </div>

                    <!-- Alertas -->
                    <div>
                        <h4 class="font-semibold mb-3">Alertas Ativos</h4>
                        <div class="space-y-2">
                            <div class="flex items-center gap-2 p-2 bg-warning/10 rounded">
                                <svg class="w-4 h-4 text-warning" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                </svg>
                                <span class="text-sm">12 clientes em atraso</span>
                            </div>
                            <div class="flex items-center gap-2 p-2 bg-danger/10 rounded">
                                <svg class="w-4 h-4 text-danger" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"></path>
                                </svg>
                                <span class="text-sm">3 clientes críticos</span>
                            </div>
                            <div class="flex items-center gap-2 p-2 bg-info/10 rounded">
                                <svg class="w-4 h-4 text-info" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <span class="text-sm">5 revisões pendentes</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Métricas de Performance -->
            <div class="panel">
                <div class="flex items-center justify-between mb-4">
                    <h3 class="text-lg font-semibold">Métricas de Performance</h3>
                    <span class="badge badge-success">Em Tempo Real</span>
                </div>
                <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div class="text-center">
                        <div class="text-3xl font-bold text-success mb-2">98.2%</div>
                        <div class="text-sm text-gray-600">Uptime do Sistema</div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold text-primary mb-2">2.3s</div>
                        <div class="text-sm text-gray-600">Tempo Médio de Resposta</div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold text-info mb-2">1.247</div>
                        <div class="text-sm text-gray-600">Clientes Ativos</div>
                    </div>
                    <div class="text-center">
                        <div class="text-3xl font-bold text-warning mb-2">4.8/5</div>
                        <div class="text-sm text-gray-600">Satisfação do Cliente</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';

// Refs
const selectedPeriod = ref('30');
const selectedChartType = ref('volume');
const startDate = ref('');
const endDate = ref('');
const reportType = ref('financial');
const volumeChart = ref<HTMLCanvasElement>();
const statusChart = ref<HTMLCanvasElement>();

const chartTypes = [
    { label: 'Volume', value: 'volume' },
    { label: 'Quantidade', value: 'quantity' },
    { label: 'Taxa', value: 'rate' }
];

// Dados estáticos
const topClients = [
    {
        id: '1',
        name: 'Maria Silva',
        email: 'maria.silva@email.com',
        volume: 45000,
        status: 'Ativo'
    },
    {
        id: '2',
        name: 'Carlos Santos',
        email: 'carlos.santos@email.com',
        volume: 38000,
        status: 'Ativo'
    },
    {
        id: '3',
        name: 'Ana Costa',
        email: 'ana.costa@email.com',
        volume: 32000,
        status: 'Em Atraso'
    },
    {
        id: '4',
        name: 'Roberto Lima',
        email: 'roberto.lima@email.com',
        volume: 28000,
        status: 'Ativo'
    },
    {
        id: '5',
        name: 'Fernanda Oliveira',
        email: 'fernanda.oliveira@email.com',
        volume: 25000,
        status: 'Ativo'
    }
];

const popularProducts = [
    {
        id: '1',
        name: 'Empréstimo Pessoal',
        description: 'Taxa fixa 2.5% a.m.',
        quantity: 456,
        volume: 1240000
    },
    {
        id: '2',
        name: 'Antecipação de FGTS',
        description: 'Taxa fixa 1.8% a.m.',
        quantity: 342,
        volume: 890000
    },
    {
        id: '3',
        name: 'Crédito Consignado',
        description: 'Taxa fixa 1.2% a.m.',
        quantity: 289,
        volume: 567000
    },
    {
        id: '4',
        name: 'Empréstimo Veículo',
        description: 'Taxa fixa 2.8% a.m.',
        quantity: 123,
        volume: 89000
    }
];

// Métodos
const refreshData = () => {
    console.log('Atualizando dados...');
    // Simular atualização
};

const exportReport = () => {
    console.log('Exportando relatório...');
    // Simular exportação
};

const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
};

const getClientStatusClass = (status: string) => {
    switch (status) {
        case 'Ativo': return 'badge-success';
        case 'Em Atraso': return 'badge-warning';
        case 'Inativo': return 'badge-secondary';
        default: return 'badge-secondary';
    }
};

const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
};

// Inicializar gráficos (simulação)
const initCharts = () => {
    nextTick(() => {
        // Aqui você pode integrar com Chart.js, ApexCharts, etc.
        console.log('Gráficos inicializados');
    });
};

// Lifecycle
onMounted(() => {
    initCharts();
});
</script>
