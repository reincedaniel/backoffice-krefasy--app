<template>
    <div>
        <!-- Mensagem de redirecionamento -->
        <div class="pt-5">
            <div class="panel">
                <div class="text-center py-12">
                    <svg class="mx-auto h-12 w-12 text-blue-500 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        Página Movida
                    </h3>
                    <p class="text-gray-600 dark:text-gray-400 mb-6">
                        A gestão de clientes foi movida para a nova seção "Clientes" com funcionalidades aprimoradas.
                    </p>
                    <router-link to="/customers" class="btn btn-primary">
                        <svg class="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                        </svg>
                        Ir para Clientes
                    </router-link>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
// Página redirecionada para /customers
</script>
