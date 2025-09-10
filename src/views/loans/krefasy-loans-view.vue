<template>
    <div>
        <!-- Breadcrumb -->
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li>
                <router-link to="/loans" class="text-primary hover:underline">Empréstimos</router-link>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Visualizar Empréstimo</span>
            </li>
        </ul>

        <div class="pt-5">
            <div class="panel">
                <h2 class="text-2xl font-bold dark:text-white-light mb-4">Detalhes do Empréstimo</h2>
                <!-- Adicionar visualização detalhada aqui -->
            </div>
        </div>
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useMeta } from '@/composables/use-meta';
import { useRoute } from 'vue-router';
import axios from '@/plugins/axios';

const route = useRoute();
const loanId = route.params.id;
const loan = ref(null);

const fetchLoanDetails = async () => {
    try {
        const response = await axios.get(`/loans/${loanId}`);
        if (response.data.succeeded) {
            loan.value = response.data.data;
        }
    } catch (error) {
        console.error('Erro ao buscar detalhes do empréstimo:', error);
    }
};

onMounted(() => {
    fetchLoanDetails();
});

useMeta({ title: 'Visualizar Empréstimo' });
</script>
