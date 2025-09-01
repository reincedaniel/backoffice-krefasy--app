<template>
    <div
        class="main-section antialiased relative font-nunito text-sm font-normal"
        :class="[store.sidebar ? 'toggle-sidebar' : '', store.menu, store.layout, store.rtlClass]"
    >
        <component v-bind:is="mainLayout"></component>
    </div>
</template>

<script lang="ts" setup>
    import { computed } from 'vue';

    import AppLayout from '@/layouts/app-layout.vue';
    import AuthLayout from '@/layouts/auth-layout.vue';

    import { useAppStore, useKrefasyStore } from '@/stores/index';
    import { useMeta } from '@/composables/use-meta';

    const store = useAppStore();
    const krefasyStore = useKrefasyStore();

    // meta
    useMeta({ title: 'Sales Admin' });

    const mainLayout = computed(() => {
        return store.mainLayout === 'auth' ? AuthLayout : AppLayout;
    });
</script>
