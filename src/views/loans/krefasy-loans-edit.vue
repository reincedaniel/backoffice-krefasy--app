<template>
    <div>
        <PageHeader
            title="Editar Empréstimo"
            subtitle="Atualize as informações do empréstimo"
            :breadcrumbs="[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'Empréstimos', to: '/loans' },
                { label: 'Editar' },
            ]"
        />

        <div class="panel">
            <!-- Adicionar formulário aqui -->
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useMeta } from '@/composables/use-meta';
import { useRoute } from 'vue-router';
import PageHeader from '@/components/layout/PageHeader.vue';

const route = useRoute();

useMeta({ title: 'Editar Empréstimo' });
</script>
