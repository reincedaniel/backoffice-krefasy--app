<template>
    <div :class="{ 'dark text-white-dark': store.semidark }">
        <nav class="sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300">
            <div class="bg-white dark:bg-[#0e1726] h-full">
                <div class="flex justify-between items-center px-4 py-3">
                    <router-link to="/dashboard" class="main-logo flex items-center shrink-0">
                        <img class="ml-[5px] flex-none" style="width: 8rem;" src="/assets/images/Krefasy.svg" alt="Krefasy" />
                    </router-link>
                    <a
                        href="javascript:;"
                        class="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:text-white-light transition duration-300 rtl:rotate-180 hover:text-primary"
                        @click="store.toggleSidebar()"
                    >
                        <icon-carets-down class="m-auto rotate-90" />
                    </a>
                </div>
                <perfect-scrollbar
                    :options="{
                        swipeEasing: true,
                        wheelPropagation: false,
                    }"
                    class="h-[calc(100vh-80px)] relative"
                >
                    <ul class="relative font-semibold space-y-0.5 p-4 py-0">
                        <h2 class="py-3 px-7 flex items-center uppercase text-xs tracking-wider font-bold text-[var(--krefasy-text-muted)] bg-[var(--krefasy-surface-muted)] -mx-4 mb-1">
                            <span>Krefasy</span>
                        </h2>

                        <li class="nav-item">
                            <ul>
                                <li class="nav-item">
                                    <router-link to="/dashboard" class="group" @click="toggleMobileMenu">
                                        <div class="flex items-center">
                                            <icon-menu-dashboard class="group-hover:!text-primary shrink-0" />
                                            <span class="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Dashboard</span>
                                        </div>
                                    </router-link>
                                </li>
                                <li class="nav-item">
                                    <router-link to="/customers" class="group" @click="toggleMobileMenu">
                                        <div class="flex items-center">
                                            <icon-users class="group-hover:!text-primary shrink-0" />
                                            <span class="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Clientes</span>
                                        </div>
                                    </router-link>
                                </li>
                                <li class="nav-item">
                                    <router-link to="/loans" class="group" @click="toggleMobileMenu">
                                        <div class="flex items-center">
                                            <icon-credit-card class="group-hover:!text-primary shrink-0" />
                                            <span class="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Empréstimos</span>
                                        </div>
                                    </router-link>
                                </li>
                                <li class="nav-item">
                                    <router-link to="/collections" class="group" @click="toggleMobileMenu">
                                        <div class="flex items-center">
                                            <icon-dollar-sign class="group-hover:!text-primary shrink-0" />
                                            <span class="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Cobranças</span>
                                        </div>
                                    </router-link>
                                </li>
                                <li class="nav-item">
                                    <router-link to="/chat" class="group" @click="toggleMobileMenu">
                                        <div class="flex items-center w-full">
                                            <icon-menu-chat class="group-hover:!text-primary shrink-0" />
                                            <span class="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Chat</span>
                                            <span
                                                v-if="unreadCount > 0"
                                                class="badge badge-danger ltr:ml-auto rtl:mr-auto text-xs min-w-[1.25rem] justify-center"
                                            >
                                                {{ unreadCount > 99 ? '99+' : unreadCount }}
                                            </span>
                                        </div>
                                    </router-link>
                                </li>
                                <li class="nav-item">
                                    <button v-if="isAdmin" type="button" class="nav-link group w-full" @click="activeDropdown === 'loan-config' ? (activeDropdown = '') : (activeDropdown = 'loan-config')">
                                        <div class="flex items-center">
                                            <icon-desktop class="group-hover:!text-primary shrink-0" />
                                            <span class="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Configurações</span>
                                        </div>
                                        <div class="nav-link-icon ltr:ml-auto rtl:mr-auto">
                                            <icon-caret-down class="w-4 h-4 transition-transform duration-200" :class="{ 'rotate-180': activeDropdown === 'loan-config' }" />
                                        </div>
                                    </button>
                                    <vue-collapsible :isOpen="activeDropdown === 'loan-config'">
                                        <ul class="sub-menu text-gray-500">
                                            <li class="menu-title">Produtos</li>
                                            <li>
                                                <router-link to="/loan-products" @click="toggleMobileMenu">Produtos de Empréstimo</router-link>
                                            </li>
                                            <li class="menu-title mt-4">Configurações Gerais</li>
                                            <li>
                                                <router-link to="/currencies" @click="toggleMobileMenu">Moedas</router-link>
                                            </li>
                                            <li>
                                                <router-link to="/countries" @click="toggleMobileMenu">Países</router-link>
                                            </li>
                                            <li>
                                                <router-link to="/interest-periods" @click="toggleMobileMenu">Períodos de Juros</router-link>
                                            </li>
                                            <li>
                                                <router-link to="/loan-status" @click="toggleMobileMenu">Status de Empréstimos</router-link>
                                            </li>
                                            <li>
                                                <router-link to="/payment-method-types" @click="toggleMobileMenu">Método de Pagamentos</router-link>
                                            </li>
                                        </ul>
                                    </vue-collapsible>
                                </li>
                                <li v-if="isAdmin" class="nav-item">
                                    <router-link to="/users" class="group" @click="toggleMobileMenu">
                                        <div class="flex items-center">
                                            <icon-user class="group-hover:!text-primary shrink-0" />
                                            <span class="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Utilizadores / Sócios</span>
                                        </div>
                                    </router-link>
                                </li>
                                <li class="nav-item">
                                    <router-link to="/reports" class="group" @click="toggleMobileMenu">
                                        <div class="flex items-center">
                                            <icon-bar-chart class="group-hover:!text-primary shrink-0" />
                                            <span class="ltr:pl-3 rtl:pr-3 text-black dark:text-[#506690] dark:group-hover:text-white-dark">Relatórios</span>
                                        </div>
                                    </router-link>
                                </li>
                            </ul>
                        </li>
                    </ul>
                </perfect-scrollbar>
            </div>
        </nav>
    </div>
</template>

<script lang="ts" setup>
    import { ref, onMounted } from 'vue';
    import { storeToRefs } from 'pinia';

    import { useAppStore, useKrefasyStore } from '@/stores/index';
    import VueCollapsible from 'vue-height-collapsible/vue3';

    import IconCaretsDown from '@/components/icon/icon-carets-down.vue';
    import IconMenuDashboard from '@/components/icon/menu/icon-menu-dashboard.vue';
    import IconMenuChat from '@/components/icon/menu/icon-menu-chat.vue';
    import IconCaretDown from '@/components/icon/icon-caret-down.vue';
    import IconUsers from '@/components/icon/icon-users.vue';
    import IconCreditCard from '@/components/icon/icon-credit-card.vue';
    import IconDollarSign from '@/components/icon/icon-dollar-sign.vue';
    import IconBarChart from '@/components/icon/icon-bar-chart.vue';
    import IconDesktop from '@/components/icon/icon-desktop.vue';
    import IconUser from '@/components/icon/icon-users.vue';

    const store = useAppStore();
    const krefasyStore = useKrefasyStore();
    const { unreadCount, isAdmin } = storeToRefs(krefasyStore);
    const activeDropdown = ref('');

    onMounted(() => {
        try {
            const selector = document.querySelector('.sidebar ul a[href="' + window.location.pathname + '"]');
            if (selector) {
                selector.classList.add('active');
                const ul: any = selector.closest('ul.sub-menu');
                if (ul) {
                    const menuItem = ul.closest('li.menu');
                    if (menuItem) {
                        const elements: any = menuItem.querySelectorAll('.nav-link') || [];
                        if (elements.length) {
                            const firstElement = elements[0];
                            setTimeout(() => {
                                firstElement.click();
                            });
                        }
                    } else {
                        activeDropdown.value = 'loan-config';
                    }
                }
            }
        } catch (error) {
            console.warn('Erro ao inicializar sidebar:', error);
        }
    });

    const toggleMobileMenu = () => {
        if (window.innerWidth < 1024) {
            store.toggleSidebar();
        }
    };
</script>
