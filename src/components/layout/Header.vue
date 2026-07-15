<template>
    <header class="z-40" :class="{ dark: store.semidark && store.menu === 'horizontal' }">
        <div class="shadow-sm">
            <div class="relative bg-[#0e1133] flex w-full items-center px-5 py-2.5 dark:bg-[#0e1133]">
                <div class="horizontal-logo flex lg:hidden justify-between items-center ltr:mr-2 rtl:ml-2">
                    <router-link to="/dashboard" class="main-logo flex items-center shrink-0">
                        <img class="ltr:-ml-1 rtl:-mr-1 inline" style="width: 7rem;" src="/assets/images/kbranco.svg" alt="Krefasy" />
                    </router-link>

                    <a
                        href="javascript:;"
                        class="collapse-icon flex-none text-[#d0d2d6] hover:text-primary flex lg:hidden ltr:ml-2 rtl:mr-2 p-2 rounded-full bg-white-light/40 hover:bg-white-light/90"
                        @click="store.toggleSidebar()"
                    >
                        <icon-menu class="w-5 h-5" />
                    </a>
                </div>

                <div class="sm:flex-1 ltr:sm:ml-0 ltr:ml-auto sm:rtl:mr-0 rtl:mr-auto flex items-center space-x-1.5 lg:space-x-2 rtl:space-x-reverse text-[#d0d2d6]">
                    <div class="sm:ltr:mr-auto sm:rtl:ml-auto hidden sm:block">
                        <p class="text-sm font-semibold text-white/90">{{ pageTitle }}</p>
                    </div>

                    <div class="dropdown shrink-0">
                        <Popper :placement="store.rtlClass === 'rtl' ? 'bottom-end' : 'bottom-start'" offsetDistance="8" class="!block">
                            <button type="button" class="relative flex items-center p-2 rounded-full bg-white-light/40 hover:text-primary hover:bg-white-light/90">
                                <icon-bell-bing class="w-5 h-5" />
                                <span
                                    v-if="unreadCount > 0"
                                    class="absolute -top-0.5 -right-0.5 flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white"
                                >
                                    {{ unreadCount > 99 ? '99+' : unreadCount }}
                                </span>
                            </button>
                            <template #content="{ close }">
                                <div class="w-[300px] text-dark dark:text-white-dark font-semibold dark:text-white-light/90">
                                    <div class="px-4 py-3 border-b border-white-light dark:border-white-light/10">
                                        <h4 class="text-sm font-bold">Mensagens não lidas</h4>
                                    </div>
                                    <ul v-if="recentUnreadConversations.length" class="max-h-72 overflow-y-auto !py-0">
                                        <li
                                            v-for="conversation in recentUnreadConversations"
                                            :key="conversation.id"
                                            class="border-b border-white-light dark:border-white-light/10 last:border-0"
                                        >
                                            <button
                                                type="button"
                                                class="w-full text-left px-4 py-3 hover:bg-white-light/40 dark:hover:bg-dark/40"
                                                @click="openChatConversation(conversation.id, close)"
                                            >
                                                <div class="flex items-start justify-between gap-2">
                                                    <div class="min-w-0 flex-1">
                                                        <p class="text-sm font-semibold truncate">{{ conversation.clientName }}</p>
                                                        <p class="text-xs text-black/60 dark:text-dark-light/60 truncate">{{ conversation.subject }}</p>
                                                        <p class="text-xs text-black/40 dark:text-dark-light/40 mt-1">{{ formatRelativeTime(conversation.lastMessageAt) }}</p>
                                                    </div>
                                                    <span class="badge badge-danger text-xs shrink-0">{{ conversation.unreadCount }}</span>
                                                </div>
                                            </button>
                                        </li>
                                    </ul>
                                    <div v-else class="px-4 py-6 text-center text-sm text-black/60 dark:text-dark-light/60">
                                        Sem mensagens novas
                                    </div>
                                    <div class="border-t border-white-light dark:border-white-light/10 px-4 py-2">
                                        <router-link
                                            to="/chat"
                                            class="text-primary text-sm font-semibold hover:underline"
                                            @click="close"
                                        >
                                            Ver todas
                                        </router-link>
                                    </div>
                                </div>
                            </template>
                        </Popper>
                    </div>

                    <div>
                        <a
                            href="javascript:;"
                            v-show="store.theme === 'light'"
                            class="flex items-center p-2 rounded-full bg-white-light/40 hover:text-primary hover:bg-white-light/90"
                            @click="store.toggleTheme('dark')"
                        >
                            <icon-sun />
                        </a>
                        <a
                            href="javascript:;"
                            v-show="store.theme === 'dark'"
                            class="flex items-center p-2 rounded-full bg-white-light/40 hover:text-primary hover:bg-white-light/90"
                            @click="store.toggleTheme('system')"
                        >
                            <icon-moon />
                        </a>
                        <a
                            href="javascript:;"
                            v-show="store.theme === 'system'"
                            class="flex items-center p-2 rounded-full bg-white-light/40 hover:text-primary hover:bg-white-light/90"
                            @click="store.toggleTheme('light')"
                        >
                            <icon-laptop />
                        </a>
                    </div>

                    <div class="dropdown shrink-0">
                        <Popper :placement="store.rtlClass === 'rtl' ? 'bottom-end' : 'bottom-start'" offsetDistance="8" class="!block align-middle">
                            <button type="button" class="relative group block">
                                <img
                                    class="w-9 h-9 rounded-full object-cover saturate-50 group-hover:saturate-100"
                                    :src="userAvatar"
                                    alt="Avatar do utilizador"
                                />
                            </button>
                            <template #content="{ close }">
                                <ul class="text-dark dark:text-white-dark !py-0 w-[230px] font-semibold dark:text-white-light/90">
                                    <li>
                                        <div class="flex items-center px-4 py-4">
                                            <div class="flex-none">
                                                <img class="rounded-md w-10 h-10 object-cover" :src="userAvatar" alt="Avatar do utilizador" />
                                            </div>
                                            <div class="ltr:pl-4 rtl:pr-4 truncate">
                                                <h4 class="text-base">
                                                    {{ userLogin?.user?.name || 'Utilizador' }}
                                                </h4>
                                                <span class="text-black/60 dark:text-dark-light/60 block truncate">{{ userLogin?.user?.email || '' }}</span>
                                                <span class="inline-block mt-1 px-2 py-0.5 text-[11px] font-semibold rounded-full bg-primary/10 text-primary">
                                                    {{ primaryRoleLabel }}
                                                </span>
                                                <span
                                                    v-if="permissions.length"
                                                    class="block mt-1 text-[11px] text-black/50 dark:text-dark-light/50 truncate"
                                                    :title="permissions.join(', ')"
                                                >
                                                    {{ permissions.slice(0, 2).join(', ') }}<template v-if="permissions.length > 2"> +{{ permissions.length - 2 }}</template>
                                                </span>
                                            </div>
                                        </div>
                                    </li>
                                    <li class="border-t border-white-light dark:border-white-light/10">
                                        <button type="button" class="text-danger !py-3 w-full text-left font-semibold dark:text-white-light/90" @click="handleLogout(close)">
                                            <icon-logout class="w-4.5 h-4.5 ltr:mr-2 rtl:ml-2 rotate-90 shrink-0 inline" />
                                            Terminar sessão
                                        </button>
                                    </li>
                                </ul>
                            </template>
                        </Popper>
                    </div>
                </div>
            </div>
        </div>
    </header>
</template>

<script lang="ts" setup>
    import { computed } from 'vue';
    import { useRoute, useRouter } from 'vue-router';
    import { storeToRefs } from 'pinia';
    import { useAppStore, useKrefasyStore } from '@/stores/index';
    import { authService } from '@/services/auth.service';

    import IconMenu from '@/components/icon/icon-menu.vue';
    import IconBellBing from '@/components/icon/icon-bell-bing.vue';
    import IconSun from '@/components/icon/icon-sun.vue';
    import IconMoon from '@/components/icon/icon-moon.vue';
    import IconLaptop from '@/components/icon/icon-laptop.vue';
    import IconLogout from '@/components/icon/icon-logout.vue';

    const store = useAppStore();
    const krefasyStore = useKrefasyStore();
    const route = useRoute();
    const router = useRouter();
    const { unreadCount, unreadConversations, primaryRoleLabel } = storeToRefs(krefasyStore);

    const DEFAULT_USER_AVATAR = '/assets/images/user-placeholder.svg';

    const userLogin = computed(() => authService.getLoginData());
    const userAvatar = computed(() => userLogin.value?.user?.avatar || DEFAULT_USER_AVATAR);
    const permissions = computed(() => userLogin.value?.user?.permissions ?? []);

    const recentUnreadConversations = computed(() => unreadConversations.value.slice(0, 5));

    const formatRelativeTime = (dateString: string) => {
        if (!dateString) return '';
        const date = new Date(dateString);
        const now = new Date();
        const diff = now.getTime() - date.getTime();
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor(diff / (1000 * 60));

        if (minutes < 1) return 'agora';
        if (hours < 1) return `${minutes}min`;
        if (hours < 24) return `${hours}h`;
        return date.toLocaleDateString('pt-BR');
    };

    const openChatConversation = (conversationId: string, close: () => void) => {
        krefasyStore.setPendingChatConversationId(conversationId);
        close();
        router.push('/chat');
    };

    const pageTitle = computed(() => {
        const metaTitle = route.meta?.title;
        if (typeof metaTitle === 'string' && metaTitle.length > 0) {
            return metaTitle;
        }
        return 'Krefasy Backoffice';
    });

    const handleLogout = (close: () => void) => {
        close();
        krefasyStore.logout();
    };
</script>
