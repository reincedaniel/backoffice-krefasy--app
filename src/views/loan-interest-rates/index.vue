<template>
    <div>
        <PageHeader
            title="Taxas de Juros"
            subtitle="Gerencie as taxas de juros para diferentes produtos e períodos"
            :breadcrumbs="[{ label: 'Dashboard', to: '/dashboard' }, { label: 'Taxas de Juros' }]"
        >
            <template #actions>
                <button type="button" class="btn btn-primary" @click="openModal">
                    <svg class="w-5 h-5 ltr:mr-2 rtl:ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                    </svg>
                    Adicionar Taxa
                </button>
            </template>
        </PageHeader>

        <!-- Informação -->
        <div class="mb-6">
            <div class="alert alert-info">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-blue-700">
                            As taxas de juros são configuradas por produto de empréstimo e período.
                            Esta funcionalidade está em desenvolvimento.
                        </p>
                    </div>
                </div>
            </div>
        </div>

        <!-- Tabela -->
        <div class="panel">
            <div class="table-responsive">
                <table class="table-hover">
                    <thead>
                        <tr>
                            <th>Produto</th>
                            <th>Período</th>
                            <th>Taxa (%)</th>
                            <th>Válido de</th>
                            <th>Válido até</th>
                            <th class="text-center">Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colspan="6" class="text-center py-8 text-gray-500">
                                Funcionalidade em desenvolvimento
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import PageHeader from '@/components/layout/PageHeader.vue';
import { ref } from 'vue';

// Refs
const showModal = ref(false);

// Métodos
const openModal = () => {
    showModal.value = true;
};
</script>
