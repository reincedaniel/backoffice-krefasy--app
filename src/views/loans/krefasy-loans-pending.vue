<template>
    <div>
        <PageHeader
            title="Empréstimos Pendentes"
            subtitle="Empréstimos aguardando análise ou aprovação"
            :breadcrumbs="[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'Empréstimos', to: '/loans' },
                { label: 'Pendentes' },
            ]"
        />

        <div class="panel">
            <p class="text-gray-600 dark:text-gray-400">
                Esta página será implementada em breve.
            </p>
        </div>
    </div>
</template>

<script lang="ts" setup>
import PageHeader from '@/components/layout/PageHeader.vue';
</script>
