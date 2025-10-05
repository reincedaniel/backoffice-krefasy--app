<template>
    <div>
        <!-- Breadcrumb -->
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <router-link to="/dashboard" class="text-primary hover:underline">Dashboard</router-link>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <router-link to="/customers" class="text-primary hover:underline">Clientes</router-link>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>{{ customer?.fullName || 'Carregando...' }}</span>
            </li>
        </ul>

        <div class="pt-5">
            <!-- Loading State -->
            <div v-if="loading" class="flex items-center justify-center py-12">
                <svg class="animate-spin -ml-1 mr-3 h-8 w-8 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span class="text-lg">Carregando...</span>
            </div>

            <!-- Customer Details -->
            <div v-else-if="customer" class="space-y-6">
                <!-- Header -->
                <div class="flex flex-wrap items-center justify-between gap-4">
                    <div class="flex items-center gap-4">
                        <div class="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                            <span class="text-2xl font-bold text-primary">
                                {{ getInitials(customer.fullName) }}
                            </span>
                        </div>
                        <div>
                            <h2 class="text-2xl font-bold dark:text-white-light">{{ customer.fullName }}</h2>
                            <p class="text-gray-600 dark:text-gray-400">{{ customer.email }}</p>
                            <p class="text-sm text-gray-500">Cadastrado em {{ formatDate(customer.createdAt) }}</p>
                        </div>
                    </div>
                    <div class="flex gap-2">
                        <button
                            type="button"
                            class="btn btn-outline-primary"
                            @click="editCustomer"
                        >
                            <svg class="w-4 h-4 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                            </svg>
                            Editar
                        </button>
                        <button
                            type="button"
                            class="btn btn-outline-danger"
                            @click="deleteCustomer"
                        >
                            <svg class="w-4 h-4 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                            </svg>
                            Excluir
                        </button>
                    </div>
                </div>

                <!-- Informações Gerais -->
                <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <!-- Informações Pessoais -->
                    <div class="panel">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold">Informações Pessoais</h3>
                        </div>
                        <div class="space-y-4">
                            <div>
                                <label class="text-sm font-medium text-gray-500">Nome Completo</label>
                                <p class="text-gray-900 dark:text-white">{{ customer.fullName }}</p>
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-500">Email</label>
                                <p class="text-gray-900 dark:text-white">{{ customer.email }}</p>
                            </div>
                            <div>
                                <label class="text-sm font-medium text-gray-500">Telefone</label>
                                <p class="text-gray-900 dark:text-white">{{ customer.phoneNumber }}</p>
                            </div>
                            <div v-if="customer.dateOfBirth">
                                <label class="text-sm font-medium text-gray-500">Data de Nascimento</label>
                                <p class="text-gray-900 dark:text-white">{{ formatDate(customer.dateOfBirth) }}</p>
                            </div>
                            <div v-if="customer.documentNumber">
                                <label class="text-sm font-medium text-gray-500">Documento</label>
                                <p class="text-gray-900 dark:text-white">
                                    {{ customer.documentType }}: {{ customer.documentNumber }}
                                </p>
                            </div>
                        </div>
                    </div>

                    <!-- Endereço -->
                    <div class="panel">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold">Endereço</h3>
                        </div>
                        <div class="space-y-4">
                            <div v-if="customer.address">
                                <label class="text-sm font-medium text-gray-500">Endereço</label>
                                <p class="text-gray-900 dark:text-white">{{ customer.address }}</p>
                            </div>
                            <div v-if="customer.city">
                                <label class="text-sm font-medium text-gray-500">Cidade</label>
                                <p class="text-gray-900 dark:text-white">{{ customer.city }}</p>
                            </div>
                            <div v-if="customer.state">
                                <label class="text-sm font-medium text-gray-500">Estado</label>
                                <p class="text-gray-900 dark:text-white">{{ customer.state }}</p>
                            </div>
                            <div v-if="customer.country">
                                <label class="text-sm font-medium text-gray-500">País</label>
                                <p class="text-gray-900 dark:text-white">{{ customer.country }}</p>
                            </div>
                            <div v-if="customer.postalCode">
                                <label class="text-sm font-medium text-gray-500">CEP</label>
                                <p class="text-gray-900 dark:text-white">{{ customer.postalCode }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Informações Profissionais -->
                    <div class="panel">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold">Informações Profissionais</h3>
                        </div>
                        <div class="space-y-4">
                            <div v-if="customer.companyName">
                                <label class="text-sm font-medium text-gray-500">Empresa</label>
                                <p class="text-gray-900 dark:text-white">{{ customer.companyName }}</p>
                            </div>
                            <div v-if="customer.workAddress">
                                <label class="text-sm font-medium text-gray-500">Endereço do Trabalho</label>
                                <p class="text-gray-900 dark:text-white">{{ customer.workAddress }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Referência -->
                    <div class="panel">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold">Referência</h3>
                        </div>
                        <div class="space-y-4">
                            <div v-if="customer.referenceName">
                                <label class="text-sm font-medium text-gray-500">Nome</label>
                                <p class="text-gray-900 dark:text-white">{{ customer.referenceName }}</p>
                            </div>
                            <div v-if="customer.referenceRelationship">
                                <label class="text-sm font-medium text-gray-500">Relacionamento</label>
                                <p class="text-gray-900 dark:text-white">{{ customer.referenceRelationship }}</p>
                            </div>
                            <div v-if="customer.referencePhoneNumber">
                                <label class="text-sm font-medium text-gray-500">Telefone</label>
                                <p class="text-gray-900 dark:text-white">{{ customer.referencePhoneNumber }}</p>
                            </div>
                            <div v-if="customer.referenceEmail">
                                <label class="text-sm font-medium text-gray-500">Email</label>
                                <p class="text-gray-900 dark:text-white">{{ customer.referenceEmail }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Localização -->
                    <div class="panel">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold">Localização</h3>
                        </div>
                        <div class="space-y-4">
                            <div v-if="customer.realTimeLocationLatitude && customer.realTimeLocationLongitude">
                                <label class="text-sm font-medium text-gray-500">Coordenadas</label>
                                <p class="text-gray-900 dark:text-white">
                                    {{ customer.realTimeLocationLatitude }}, {{ customer.realTimeLocationLongitude }}
                                </p>
                            </div>
                            <div v-if="customer.locationTimestamp">
                                <label class="text-sm font-medium text-gray-500">Última Localização</label>
                                <p class="text-gray-900 dark:text-white">{{ formatDateTime(customer.locationTimestamp) }}</p>
                            </div>
                        </div>
                    </div>

                    <!-- Redes Sociais -->
                    <div class="panel">
                        <div class="flex items-center justify-between mb-4">
                            <h3 class="text-lg font-semibold">Redes Sociais</h3>
                        </div>
                        <div class="space-y-4">
                            <div v-if="customer.instagram">
                                <label class="text-sm font-medium text-gray-500">Instagram</label>
                                <p class="text-gray-900 dark:text-white">
                                    <a :href="customer.instagram" target="_blank" class="text-primary hover:underline">
                                        {{ customer.instagram }}
                                    </a>
                                </p>
                            </div>
                            <div v-if="customer.facebook">
                                <label class="text-sm font-medium text-gray-500">Facebook</label>
                                <p class="text-gray-900 dark:text-white">
                                    <a :href="customer.facebook" target="_blank" class="text-primary hover:underline">
                                        {{ customer.facebook }}
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Documentos -->
                <div class="panel">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold">Documentos</h3>
                    </div>
                    <div v-if="customer.documents && customer.documents.length > 0">
                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <div v-for="document in customer.documents" :key="document.id" class="border rounded-lg p-4">
                                <h4 class="font-semibold">{{ document.name }}</h4>
                                <p class="text-sm text-gray-600">{{ document.type }}</p>
                                <p class="text-xs text-gray-500">Uploadado em {{ formatDate(document.uploadedAt) }}</p>
                            </div>
                        </div>
                    </div>
                    <div v-else class="text-center py-8 text-gray-500">
                        Nenhum documento anexado
                    </div>
                </div>
            </div>

            <!-- Error State -->
            <div v-else class="text-center py-12">
                <svg class="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 class="mt-2 text-sm font-medium text-gray-900">Customer não encontrado</h3>
                <p class="mt-1 text-sm text-gray-500">O customer solicitado não foi encontrado ou foi removido.</p>
                <div class="mt-6">
                    <router-link to="/customers" class="btn btn-primary">
                        Voltar para Clientes
                    </router-link>
                </div>
            </div>
        </div>

        <!-- Modal de Edição -->
        <CustomerModal
            :show="showModal"
            :customer="customer"
            :is-edit="true"
            @close="closeModal"
            @save="handleSave"
        />
    </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { customerService, type Customer, type CustomerCreateUpdate } from '@/services/customers.service';
import Swal from 'sweetalert2';
import CustomerModal from './CustomerModal.vue';

const route = useRoute();
const router = useRouter();

// Refs
const customer = ref<Customer | null>(null);
const loading = ref(false);
const showModal = ref(false);

// Métodos
const loadCustomer = async () => {
    const customerId = route.params.id as string;
    if (!customerId) {
        router.push('/customers');
        return;
    }

    loading.value = true;
    try {
        const response = await customerService.getCustomerById(customerId);
        if (response.succeeded && response.data) {
            customer.value = response.data;
        } else {
            console.error('Resposta da API:', response);
            Swal.fire('Erro', 'Customer não encontrado', 'error');
            router.push('/customers');
        }
    } catch (error) {
        console.error('Erro ao carregar customer:', error);
        Swal.fire('Erro', 'Erro ao carregar customer', 'error');
        router.push('/customers');
    } finally {
        loading.value = false;
    }
};

const editCustomer = () => {
    showModal.value = true;
};

const closeModal = () => {
    showModal.value = false;
};

const handleSave = async (data: CustomerCreateUpdate) => {
    if (!customer.value) return;

    try {
        const response = await customerService.updateCustomer(customer.value.id, data);
        if (response.succeeded && response.data) {
            customer.value = response.data;
            Swal.fire('Sucesso', 'Customer atualizado com sucesso!', 'success');
            closeModal();
        } else {
            Swal.fire('Erro', 'Erro ao atualizar customer', 'error');
        }
    } catch (error) {
        console.error('Erro ao atualizar customer:', error);
        Swal.fire('Erro', 'Erro ao atualizar customer', 'error');
    }
};

const deleteCustomer = async () => {
    if (!customer.value) return;

    const result = await Swal.fire({
        title: 'Confirmar exclusão',
        text: `Tem certeza que deseja excluir o customer "${customer.value.fullName}"?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#ef4444'
    });

    if (result.isConfirmed) {
        try {
            const response = await customerService.deleteCustomer(customer.value.id);
            if (response.succeeded) {
                Swal.fire('Sucesso', 'Customer excluído com sucesso!', 'success');
                router.push('/customers');
            } else {
                Swal.fire('Erro', 'Erro ao excluir customer', 'error');
            }
        } catch (error) {
            console.error('Erro ao excluir customer:', error);
            Swal.fire('Erro', 'Erro ao excluir customer', 'error');
        }
    }
};

const getInitials = (fullName: string) => {
    return fullName
        .split(' ')
        .map(name => name.charAt(0))
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR');
};

const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
};

// Lifecycle
onMounted(() => {
    loadCustomer();
});
</script>
