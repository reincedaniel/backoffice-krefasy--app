<template>
    <div class="space-y-5">
        <PageHeader
            title="Gestão de Clientes"
            subtitle="Gerencie todos os clientes do sistema"
            :breadcrumbs="[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Clientes' }]"
        >
            <template #actions>
                <button type="button" class="btn btn-outline-secondary btn-sm gap-2" @click="exportCustomers">
                    <icon-download class="w-4 h-4" />
                    Exportar
                </button>
                <button type="button" class="btn btn-outline-primary btn-sm gap-2" @click="showImportModal = true">
                    <icon-cloud-download class="w-4 h-4" />
                    Importar
                </button>
                <button type="button" class="btn btn-primary btn-sm gap-2" @click="openModal">
                    <icon-plus-circle class="w-4 h-4" />
                    Novo Cliente
                </button>
            </template>
        </PageHeader>

        <!-- Estatísticas -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div class="panel overflow-hidden relative">
                <div class="absolute inset-y-0 left-0 w-1 bg-primary"></div>
                <div class="flex items-center justify-between pl-3">
                    <div>
                        <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Total</p>
                        <p class="text-3xl font-bold text-primary mt-1">{{ customers.length }}</p>
                    </div>
                    <div class="p-3 rounded-xl bg-primary/10">
                        <icon-users class="w-6 h-6 text-primary" />
                    </div>
                </div>
            </div>

            <div class="panel overflow-hidden relative">
                <div class="absolute inset-y-0 left-0 w-1 bg-info"></div>
                <div class="flex items-center justify-between pl-3">
                    <div>
                        <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Resultados</p>
                        <p class="text-3xl font-bold text-info mt-1">{{ filteredCustomers.length }}</p>
                    </div>
                    <div class="p-3 rounded-xl bg-info/10">
                        <icon-search class="w-6 h-6 text-info" />
                    </div>
                </div>
            </div>

            <div class="panel overflow-hidden relative">
                <div class="absolute inset-y-0 left-0 w-1 bg-success"></div>
                <div class="flex items-center justify-between pl-3">
                    <div>
                        <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Países</p>
                        <p class="text-3xl font-bold text-success mt-1">{{ uniqueCountries.length }}</p>
                    </div>
                    <div class="p-3 rounded-xl bg-success/10">
                        <icon-globe class="w-6 h-6 text-success" />
                    </div>
                </div>
            </div>

            <div class="panel overflow-hidden relative">
                <div class="absolute inset-y-0 left-0 w-1 bg-warning"></div>
                <div class="flex items-center justify-between pl-3">
                    <div>
                        <p class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">Com documento</p>
                        <p class="text-3xl font-bold text-warning mt-1">{{ withDocumentCount }}</p>
                    </div>
                    <div class="p-3 rounded-xl bg-warning/10">
                        <icon-file class="w-6 h-6 text-warning" />
                    </div>
                </div>
            </div>
        </div>

        <!-- Filtros -->
        <div class="panel">
            <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                <h2 class="text-base font-semibold text-gray-800 dark:text-gray-100">Filtros e pesquisa</h2>
                <button
                    v-if="hasActiveFilters"
                    type="button"
                    class="btn btn-outline-secondary btn-sm gap-1"
                    @click="clearFilters"
                >
                    <icon-x class="w-4 h-4" />
                    Limpar
                </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                <div class="lg:col-span-1">
                    <label class="form-label">Buscar</label>
                    <input
                        v-model="searchQuery"
                        type="text"
                        class="form-input w-full"
                        placeholder="Nome, email, telefone ou documento..."
                        @input="debounceSearch"
                    />
                </div>
                <div>
                    <label class="form-label">País</label>
                    <select v-model="countryFilter" class="form-select w-full" @change="resetPage">
                        <option value="">Todos os países</option>
                        <option v-for="country in uniqueCountries" :key="country" :value="country">
                            {{ country }}
                        </option>
                    </select>
                </div>
                <div>
                    <label class="form-label">Cidade</label>
                    <select v-model="cityFilter" class="form-select w-full" @change="resetPage">
                        <option value="">Todas as cidades</option>
                        <option v-for="city in uniqueCities" :key="city" :value="city">
                            {{ city }}
                        </option>
                    </select>
                </div>
            </div>
        </div>

        <!-- Lista -->
        <div class="panel !p-0 overflow-hidden">
            <div class="px-5 py-4 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 class="text-base font-semibold text-gray-800 dark:text-gray-100">Clientes</h2>
                    <p v-if="filteredCustomers.length > 0" class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {{ paginationSummary }}
                    </p>
                </div>
                <div class="flex items-center gap-2">
                    <label class="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">Por página:</label>
                    <select v-model.number="pageSize" @change="changePageSize" class="form-select form-select-sm w-auto">
                        <option v-for="size in pageSizeOptions" :key="size" :value="size">{{ size }}</option>
                    </select>
                </div>
            </div>

            <div v-if="loading" class="flex items-center justify-center py-16">
                <div class="flex flex-col items-center gap-4">
                    <span class="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10"></span>
                    <span class="text-sm text-gray-600 dark:text-gray-300">Carregando clientes...</span>
                </div>
            </div>

            <div v-else-if="paginatedCustomers.length > 0" class="divide-y divide-gray-200 dark:divide-gray-700">
                <article
                    v-for="customer in paginatedCustomers"
                    :key="customer.id"
                    class="p-5 hover:bg-gray-50/80 dark:hover:bg-gray-800/30 transition-colors border-l-4 border-l-primary/40"
                >
                    <div class="flex flex-col xl:flex-row xl:items-start gap-5">
                        <div class="flex-1 min-w-0 space-y-4">
                            <div class="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                                <div class="flex items-start gap-3 min-w-0">
                                    <div class="shrink-0 w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center">
                                        <span class="text-sm font-bold text-primary">{{ getInitials(customer.fullName) }}</span>
                                    </div>
                                    <div class="min-w-0">
                                        <h3 class="text-lg font-bold text-gray-900 dark:text-white truncate">
                                            {{ customer.fullName }}
                                        </h3>
                                        <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mt-0.5 truncate">
                                            <icon-mail class="w-3.5 h-3.5 shrink-0" />
                                            {{ customer.email }}
                                        </p>
                                        <p class="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-1.5 mt-0.5">
                                            <icon-phone class="w-3.5 h-3.5 shrink-0" />
                                            {{ customer.phoneNumber || '—' }}
                                        </p>
                                    </div>
                                </div>
                                <div class="text-left sm:text-right shrink-0">
                                    <p class="text-xs text-gray-500">Cadastro</p>
                                    <p class="text-sm font-semibold text-gray-800 dark:text-gray-200">{{ formatDate(customer.createdAt) }}</p>
                                    <span
                                        v-if="customer.documentNumber"
                                        class="badge badge-outline-primary text-xs mt-2 inline-block"
                                    >
                                        {{ customer.documentType }} · {{ customer.documentNumber }}
                                    </span>
                                </div>
                            </div>

                            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div class="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                                    <p class="text-xs text-gray-500">Cidade</p>
                                    <p class="text-sm font-semibold truncate">{{ customer.city || '—' }}</p>
                                </div>
                                <div class="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                                    <p class="text-xs text-gray-500">Estado</p>
                                    <p class="text-sm font-semibold truncate">{{ customer.state || '—' }}</p>
                                </div>
                                <div class="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                                    <p class="text-xs text-gray-500">País</p>
                                    <p class="text-sm font-semibold truncate">{{ customer.country || '—' }}</p>
                                </div>
                                <div class="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                                    <p class="text-xs text-gray-500">Documentos</p>
                                    <p class="text-sm font-semibold">{{ customer.documents?.length || 0 }}</p>
                                </div>
                            </div>

                            <p v-if="customer.companyName" class="text-xs text-gray-500">
                                Empresa: <span class="font-medium text-gray-700 dark:text-gray-300">{{ customer.companyName }}</span>
                            </p>
                        </div>

                        <div class="flex flex-row xl:flex-col gap-2 xl:min-w-[130px] shrink-0">
                            <button
                                type="button"
                                class="btn btn-primary btn-sm gap-2 flex-1 xl:flex-none justify-center"
                                @click="viewCustomer(customer)"
                            >
                                <icon-eye class="w-4 h-4" />
                                Ver
                            </button>
                            <button
                                type="button"
                                class="btn btn-outline-primary btn-sm gap-2 flex-1 xl:flex-none justify-center"
                                @click="editCustomer(customer)"
                            >
                                <icon-edit class="w-4 h-4" />
                                Editar
                            </button>
                            <button
                                type="button"
                                class="btn btn-outline-danger btn-sm gap-2 flex-1 xl:flex-none justify-center"
                                @click="deleteCustomer(customer)"
                            >
                                <icon-trash class="w-4 h-4" />
                                Excluir
                            </button>
                        </div>
                    </div>
                </article>
            </div>

            <div v-else class="text-center py-16 px-5">
                <icon-users class="w-14 h-14 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Nenhum cliente encontrado</h3>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                    {{ hasActiveFilters ? 'Tente ajustar os filtros de busca.' : 'Não há clientes para exibir.' }}
                </p>
            </div>

            <!-- Paginação -->
            <div
                v-if="filteredCustomers.length > 0"
                class="px-5 py-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20"
            >
                <div class="flex flex-col sm:flex-row items-center justify-between gap-4">
                    <p class="text-sm text-gray-600 dark:text-gray-400 order-2 sm:order-1">
                        Página <strong>{{ currentPage }}</strong> de <strong>{{ totalPages }}</strong>
                        · {{ paginationSummary }}
                    </p>

                    <div class="flex items-center gap-1 order-1 sm:order-2">
                        <button
                            type="button"
                            @click="changePage(1)"
                            :disabled="currentPage === 1"
                            class="btn btn-outline-secondary btn-sm px-2"
                            title="Primeira página"
                        >
                            «
                        </button>
                        <button
                            type="button"
                            @click="changePage(currentPage - 1)"
                            :disabled="currentPage === 1"
                            class="btn btn-outline-secondary btn-sm gap-1"
                        >
                            <icon-arrow-left class="w-4 h-4" />
                            Anterior
                        </button>

                        <button
                            v-for="page in visiblePages"
                            :key="page"
                            type="button"
                            @click="changePage(page)"
                            :class="[
                                'btn btn-sm min-w-[2.25rem]',
                                page === currentPage ? 'btn-primary' : 'btn-outline-secondary'
                            ]"
                        >
                            {{ page }}
                        </button>

                        <button
                            type="button"
                            @click="changePage(currentPage + 1)"
                            :disabled="currentPage >= totalPages"
                            class="btn btn-outline-secondary btn-sm gap-1"
                        >
                            Próximo
                            <icon-arrow-forward class="w-4 h-4" />
                        </button>
                        <button
                            type="button"
                            @click="changePage(totalPages)"
                            :disabled="currentPage >= totalPages"
                            class="btn btn-outline-secondary btn-sm px-2"
                            title="Última página"
                        >
                            »
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <CustomerModal
            :show="showModal"
            :customer="selectedCustomer"
            :is-edit="isEdit"
            @close="closeModal"
            @save="handleSave"
        />

        <!-- Modal de Importação -->
        <Teleport to="body">
            <div
                v-if="showImportModal"
                class="fixed inset-0 bg-black/60 flex items-center justify-center z-[99] p-4"
                @click.self="showImportModal = false"
            >
                <div class="panel w-full max-w-md">
                    <div class="flex items-center justify-between mb-4 pb-3 border-b border-gray-200 dark:border-gray-700">
                        <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Importar Clientes</h3>
                        <button type="button" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" @click="showImportModal = false">
                            <icon-x class="w-5 h-5" />
                        </button>
                    </div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        Selecione um ficheiro CSV ou Excel para importar clientes em lote.
                    </p>
                    <input
                        ref="fileInput"
                        type="file"
                        accept=".csv,.xlsx"
                        class="form-input w-full"
                        @change="handleFileSelect"
                    />
                    <div class="flex justify-end gap-2 mt-5">
                        <button type="button" class="btn btn-outline-secondary btn-sm" @click="showImportModal = false">
                            Cancelar
                        </button>
                        <button
                            type="button"
                            class="btn btn-primary btn-sm gap-2"
                            @click="importCustomers"
                            :disabled="!selectedFile"
                        >
                            <icon-cloud-download class="w-4 h-4" />
                            Importar
                        </button>
                    </div>
                </div>
            </div>
        </Teleport>
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useMeta } from '@/composables/use-meta';
import { customerService, type Customer, type CustomerCreateUpdate } from '@/services/customers.service';
import Swal from 'sweetalert2';
import PageHeader from '@/components/layout/PageHeader.vue';
import CustomerModal from './CustomerModal.vue';
import IconUsers from '@/components/icon/icon-users.vue';
import IconSearch from '@/components/icon/icon-search.vue';
import IconGlobe from '@/components/icon/icon-globe.vue';
import IconFile from '@/components/icon/icon-file.vue';
import IconX from '@/components/icon/icon-x.vue';
import IconDownload from '@/components/icon/icon-download.vue';
import IconCloudDownload from '@/components/icon/icon-cloud-download.vue';
import IconPlusCircle from '@/components/icon/icon-plus-circle.vue';
import IconMail from '@/components/icon/icon-mail.vue';
import IconPhone from '@/components/icon/icon-phone.vue';
import IconEye from '@/components/icon/icon-eye.vue';
import IconEdit from '@/components/icon/icon-edit.vue';
import IconTrash from '@/components/icon/icon-trash.vue';
import IconArrowLeft from '@/components/icon/icon-arrow-left.vue';
import IconArrowForward from '@/components/icon/icon-arrow-forward.vue';
import { usePartnerScope } from '@/composables/use-partner-scope';
import { loansService } from '@/services/loans.service';
import {
    filterLoansForPartner,
    getScopedCustomerIdsFromLoans,
} from '@/utils/partner-scope.utils';

useMeta({ title: 'Gestão de Clientes' });

const router = useRouter();
const { isRestrictedPartnerView, loggedUserId } = usePartnerScope();

const customers = ref<Customer[]>([]);
const scopedCustomerIds = ref<Set<string> | null>(null);
const loading = ref(false);
const showModal = ref(false);
const showImportModal = ref(false);
const selectedCustomer = ref<Customer | null>(null);
const isEdit = ref(false);
const searchQuery = ref('');
const countryFilter = ref('');
const cityFilter = ref('');
const selectedFile = ref<File | null>(null);
const fileInput = ref<HTMLInputElement>();

const currentPage = ref(1);
const pageSize = ref(10);
const pageSizeOptions = [5, 10, 20, 50];

const uniqueCountries = computed(() => {
    const countries = customers.value.map(c => c.country).filter(Boolean);
    return [...new Set(countries)].sort();
});

const uniqueCities = computed(() => {
    let list = customers.value;
    if (countryFilter.value) {
        list = list.filter(c => c.country === countryFilter.value);
    }
    const cities = list.map(c => c.city).filter(Boolean);
    return [...new Set(cities)].sort();
});

const withDocumentCount = computed(() =>
    customers.value.filter(c => c.documentNumber).length
);

const hasActiveFilters = computed(() =>
    Boolean(searchQuery.value || countryFilter.value || cityFilter.value)
);

const filteredCustomers = computed(() => {
    let filtered = customers.value;

    if (scopedCustomerIds.value) {
        filtered = filtered.filter(
            (customer) =>
                scopedCustomerIds.value!.has(customer.id) ||
                scopedCustomerIds.value!.has(customer.userId)
        );
    }

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(customer =>
            customer.fullName.toLowerCase().includes(query) ||
            customer.email.toLowerCase().includes(query) ||
            customer.phoneNumber.toLowerCase().includes(query) ||
            (customer.documentNumber && customer.documentNumber.toLowerCase().includes(query))
        );
    }

    if (countryFilter.value) {
        filtered = filtered.filter(customer => customer.country === countryFilter.value);
    }

    if (cityFilter.value) {
        filtered = filtered.filter(customer => customer.city === cityFilter.value);
    }

    return filtered;
});

const totalPages = computed(() =>
    Math.max(1, Math.ceil(filteredCustomers.value.length / pageSize.value))
);

const paginatedCustomers = computed(() => {
    const start = (currentPage.value - 1) * pageSize.value;
    return filteredCustomers.value.slice(start, start + pageSize.value);
});

const paginationSummary = computed(() => {
    const total = filteredCustomers.value.length;
    if (total === 0) return '';
    const start = (currentPage.value - 1) * pageSize.value + 1;
    const end = Math.min(currentPage.value * pageSize.value, total);
    return `Mostrando ${start}–${end} de ${total} clientes`;
});

const visiblePages = computed(() => {
    const pages: number[] = [];
    const maxVisible = 5;
    let start = Math.max(1, currentPage.value - Math.floor(maxVisible / 2));
    let end = Math.min(totalPages.value, start + maxVisible - 1);
    start = Math.max(1, end - maxVisible + 1);
    for (let i = start; i <= end; i++) pages.push(i);
    return pages;
});

const resetPage = () => {
    currentPage.value = 1;
};

const changePage = (page: number) => {
    if (page >= 1 && page <= totalPages.value) {
        currentPage.value = page;
    }
};

const changePageSize = () => {
    currentPage.value = 1;
};

const getInitials = (name: string) => {
    const parts = name.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '?';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

const loadCustomers = async () => {
    loading.value = true;
    try {
        if (isRestrictedPartnerView.value && !scopedCustomerIds.value) {
            const loans = filterLoansForPartner(
                await loansService.getAllLoans(),
                loggedUserId.value,
                'all'
            );
            scopedCustomerIds.value = getScopedCustomerIdsFromLoans(loans);
        }

        const response = await customerService.getCustomers();
        if (response.succeeded && response.data) {
            customers.value = response.data;
        } else {
            Swal.fire('Erro', 'Erro ao carregar clientes', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar clientes:', error);
        Swal.fire('Erro', 'Erro ao carregar clientes', 'error');
    } finally {
        loading.value = false;
    }
};

const openModal = () => {
    selectedCustomer.value = null;
    isEdit.value = false;
    showModal.value = true;
};

const editCustomer = (customer: Customer) => {
    selectedCustomer.value = customer;
    isEdit.value = true;
    showModal.value = true;
};

const viewCustomer = (customer: Customer) => {
    router.push(`/customers/${customer.id}`);
};

const closeModal = () => {
    showModal.value = false;
    selectedCustomer.value = null;
    isEdit.value = false;
};

const handleSave = async (data: CustomerCreateUpdate) => {
    try {
        let response;
        if (isEdit.value && selectedCustomer.value) {
            response = await customerService.updateCustomer(selectedCustomer.value.id, data);
        } else {
            response = await customerService.createCustomer(data);
        }

        if (response.succeeded) {
            Swal.fire('Sucesso', 'Cliente salvo com sucesso!', 'success');
            closeModal();
            loadCustomers();
        } else {
            Swal.fire('Erro', 'Erro ao salvar cliente', 'error');
        }
    } catch (error) {
        console.error('Erro ao salvar cliente:', error);
        Swal.fire('Erro', 'Erro ao salvar cliente', 'error');
    }
};

const deleteCustomer = async (customer: Customer) => {
    const result = await Swal.fire({
        title: 'Confirmar exclusão',
        text: `Tem certeza que deseja excluir o cliente "${customer.fullName}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ef4444',
    });

    if (result.isConfirmed) {
        try {
            const response = await customerService.deleteCustomer(customer.id);
            if (response.succeeded) {
                Swal.fire('Sucesso', 'Cliente excluído com sucesso!', 'success');
                loadCustomers();
            } else {
                Swal.fire('Erro', 'Erro ao excluir cliente', 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir cliente:', error);
            Swal.fire('Erro', 'Erro ao excluir cliente', 'error');
        }
    }
};

const exportCustomers = async () => {
    try {
        const blob = await customerService.exportCustomers();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `clientes-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    } catch (error) {
        console.error('Erro ao exportar clientes:', error);
        Swal.fire('Erro', 'Erro ao exportar clientes', 'error');
    }
};

const handleFileSelect = (event: Event) => {
    const target = event.target as HTMLInputElement;
    selectedFile.value = target.files?.[0] || null;
};

const importCustomers = async () => {
    if (!selectedFile.value) return;

    try {
        const response = await customerService.importCustomers(selectedFile.value);
        if (response.succeeded) {
            Swal.fire('Sucesso', 'Clientes importados com sucesso!', 'success');
            showImportModal.value = false;
            selectedFile.value = null;
            if (fileInput.value) {
                fileInput.value.value = '';
            }
            loadCustomers();
        } else {
            Swal.fire('Erro', 'Erro ao importar clientes', 'error');
        }
    } catch (error) {
        console.error('Erro ao importar clientes:', error);
        Swal.fire('Erro', 'Erro ao importar clientes', 'error');
    }
};

const clearFilters = () => {
    searchQuery.value = '';
    countryFilter.value = '';
    cityFilter.value = '';
    currentPage.value = 1;
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
};

let searchTimeout: ReturnType<typeof setTimeout>;
const debounceSearch = () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => {
        currentPage.value = 1;
    }, 300);
};

onMounted(() => {
    loadCustomers();
});
</script>
