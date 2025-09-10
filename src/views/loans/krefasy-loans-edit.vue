<template>
    <div>
        <!-- Breadcrumb -->
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <router-link to="/loans" class="text-primary hover:underline">Empréstimos</router-link>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Editar Empréstimo</span>
            </li>
        </ul>

        <div class="pt-5">
            <div class="panel">
                <h2 class="text-2xl font-bold dark:text-white-light mb-4">Editar Empréstimo</h2>
                <!-- Adicionar formulário aqui -->
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { useMeta } from '@/composables/use-meta';
import { useRoute } from 'vue-router';

const route = useRoute();
const loanId = route.params.id;

useMeta({ title: 'Editar Empréstimo' });
</script>
