<template>
    <div>
        <PageHeader
            title="Métodos de Pagamento"
            subtitle="Gerencie os métodos de pagamento disponíveis no sistema"
            :breadcrumbs="[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Métodos de Pagamento' }]"
        >
            <template #actions>
                <button type="button" class="btn btn-primary" @click="openModal">
                    <svg class="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Adicionar Método
                </button>
            </template>
        </PageHeader>

        <div class="mb-6">
            <div class="flex flex-wrap gap-4">
                <div class="flex-1 min-w-64">
                    <input
                        v-model="searchQuery"
                        type="text"
                        placeholder="Buscar por nome, código ou descrição..."
                        class="form-input"
                    />
                </div>
                <div>
                    <select v-model="statusFilter" class="form-select">
                        <option value="">Todos os status</option>
                        <option value="true">Ativos</option>
                        <option value="false">Inativos</option>
                    </select>
                </div>
            </div>
        </div>

        <div class="panel">
            <div class="table-responsive">
                <table class="table-hover">
                    <thead>
                        <tr>
                            <th>Nome</th>
                            <th>Código</th>
                            <th>Descrição</th>
                            <th>Status</th>
                            <th>Data de Criação</th>
                            <th class="text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <template v-if="loading">
                            <tr>
                                <td colspan="6" class="text-center py-8">
                                    <div class="flex items-center justify-center">
                                        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                        </svg>
                                        Carregando...
                                    </div>
                                </td>
                            </tr>
                        </template>
                        <template v-else-if="filteredItems.length === 0">
                            <tr>
                                <td colspan="6" class="text-center py-8 text-gray-500">
                                    Nenhum método de pagamento encontrado
                                </td>
                            </tr>
                        </template>
                        <template v-else>
                            <tr v-for="item in filteredItems" :key="item.id">
                                <td class="font-semibold">{{ item.name }}</td>
                                <td>
                                    <span class="font-mono text-sm">{{ item.code }}</span>
                                </td>
                                <td>{{ item.description }}</td>
                                <td>
                                    <span class="badge" :class="item.isActive ? 'badge-success' : 'badge-danger'">
                                        {{ item.isActive ? 'Ativo' : 'Inativo' }}
                                    </span>
                                </td>
                                <td>{{ formatDate(item.createdAt) }}</td>
                                <td class="text-center">
                                    <div class="flex items-center justify-center gap-2">
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-primary"
                                            :disabled="deletingId === item.id"
                                            @click="editItem(item)"
                                        >
                                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                                            </svg>
                                        </button>
                                        <button
                                            type="button"
                                            class="btn btn-sm btn-outline-danger inline-flex items-center justify-center"
                                            :disabled="deletingId === item.id"
                                            @click="deleteItem(item)"
                                        >
                                            <svg
                                                v-if="deletingId === item.id"
                                                class="animate-spin w-4 h-4"
                                                xmlns="http://www.w3.org/2000/svg"
                                                fill="none"
                                                viewBox="0 0 24 24"
                                            >
                                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            <svg v-else class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                                            </svg>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        </template>
                    </tbody>
                </table>
            </div>
        </div>

        <PaymentMethodTypeModal
            :show="showModal"
            :payment-method-type="selectedItem"
            :is-edit="isEdit"
            @close="closeModal"
            @saved="handleSaved"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import Swal from 'sweetalert2';
import {
    paymentMethodTypeService,
    type PaymentMethodType,
} from '@/services/payment-method-types.service';
import PageHeader from '@/components/layout/PageHeader.vue';
import PaymentMethodTypeModal from './PaymentMethodTypeModal.vue';

const items = ref<PaymentMethodType[]>([]);
const loading = ref(false);
const showModal = ref(false);
const selectedItem = ref<PaymentMethodType | null>(null);
const isEdit = ref(false);
const searchQuery = ref('');
const statusFilter = ref('');
const deletingId = ref<string | null>(null);

const filteredItems = computed(() => {
    let filtered = items.value;

    if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        filtered = filtered.filter(item =>
            item.name.toLowerCase().includes(query) ||
            item.code.toLowerCase().includes(query) ||
            item.description.toLowerCase().includes(query)
        );
    }

    if (statusFilter.value !== '') {
        const isActive = statusFilter.value === 'true';
        filtered = filtered.filter(item => item.isActive === isActive);
    }

    return filtered;
});

const loadItems = async () => {
    loading.value = true;
    try {
        const response = await paymentMethodTypeService.getPaymentMethodTypes();
        if (response.succeeded && response.data) {
            items.value = response.data;
        } else {
            Swal.fire('Erro', response.message || 'Erro ao carregar métodos de pagamento', 'error');
        }
    } catch (error) {
        console.error('Erro ao carregar métodos de pagamento:', error);
        Swal.fire('Erro', 'Erro ao carregar métodos de pagamento', 'error');
    } finally {
        loading.value = false;
    }
};

const openModal = () => {
    selectedItem.value = null;
    isEdit.value = false;
    showModal.value = true;
};

const editItem = (item: PaymentMethodType) => {
    selectedItem.value = item;
    isEdit.value = true;
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
    selectedItem.value = null;
    isEdit.value = false;
};

const handleSaved = () => {
    closeModal();
    loadItems();
};

const deleteItem = async (item: PaymentMethodType) => {
    const result = await Swal.fire({
        title: 'Confirmar exclusão',
        text: `Tem certeza que deseja excluir o método "${item.name}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ef4444',
        showLoaderOnConfirm: true,
        allowOutsideClick: () => !Swal.isLoading(),
        preConfirm: async () => {
            deletingId.value = item.id;
            try {
                const response = await paymentMethodTypeService.deletePaymentMethodType(item.id);
                if (!response.succeeded) {
                    Swal.showValidationMessage(response.message || 'Erro ao excluir método de pagamento');
                    return false;
                }
                return response;
            } catch (error) {
                console.error('Erro ao excluir método de pagamento:', error);
                Swal.showValidationMessage('Erro ao excluir método de pagamento');
                return false;
            } finally {
                deletingId.value = null;
            }
        },
    });

    if (result.isConfirmed && result.value) {
        Swal.fire('Sucesso', result.value.message || 'Método de pagamento excluído com sucesso!', 'success');
        loadItems();
    }
};

const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

onMounted(() => {
    loadItems();
});
</script>

<style scoped>
.table-responsive {
    overflow-x: auto;
}
</style>
