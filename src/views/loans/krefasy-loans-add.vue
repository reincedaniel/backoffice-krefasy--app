<template>
    <div>
        <PageHeader
            title="Novo Empréstimo"
            subtitle="Crie um novo empréstimo no sistema"
            :breadcrumbs="[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'Empréstimos', to: '/loans' },
                { label: 'Novo' },
            ]"
        />

        <div class="panel">
            <!-- Adicionar formulário aqui -->
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useMeta } from '@/composables/use-meta';
import PageHeader from '@/components/layout/PageHeader.vue';

useMeta({ title: 'Novo Empréstimo' });
</script>
