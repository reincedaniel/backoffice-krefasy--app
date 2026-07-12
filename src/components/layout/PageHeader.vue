<template>
    <div class="page-header">
        <div class="page-header-content">
            <ul v-if="breadcrumbs.length" class="page-breadcrumb">
                <li v-for="(crumb, index) in breadcrumbs" :key="`${crumb.label}-${index}`">
                    <router-link v-if="crumb.to" :to="crumb.to" class="breadcrumb-link">{{ crumb.label }}</router-link>
                    <span v-else :class="{ 'breadcrumb-active': index === breadcrumbs.length - 1 }">{{ crumb.label }}</span>
                </li>
            </ul>
            <h1 class="page-title">{{ title }}</h1>
            <p v-if="subtitle" class="page-subtitle">{{ subtitle }}</p>
        </div>
        <div v-if="$slots.actions" class="page-header-actions">
            <slot name="actions" />
        </div>
    </div>
</template>

<script lang="ts" setup>
    export interface BreadcrumbItem {
        label: string;
        to?: string;
    }

    withDefaults(
        defineProps<{
            title: string;
            subtitle?: string;
            breadcrumbs?: BreadcrumbItem[];
        }>(),
        {
            breadcrumbs: () => [],
        }
    );
</script>

<style scoped>
.page-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 28px;
}

.page-breadcrumb {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 8px;
    list-style: none;
    padding: 0;
    margin: 0 0 8px;
    font-size: 13px;
    color: var(--krefasy-text-muted);
}

.page-breadcrumb li + li::before {
    content: '/';
    margin-right: 8px;
    color: #cbd5e1;
}

.breadcrumb-link {
    color: var(--krefasy-text-muted);
    transition: color 0.2s;
}

.breadcrumb-link:hover {
    color: var(--krefasy-purple);
}

.breadcrumb-active {
    color: var(--krefasy-purple);
    font-weight: 600;
}

.page-title {
    font-size: 26px;
    font-weight: 700;
    color: var(--krefasy-text);
    margin: 0 0 4px;
    letter-spacing: -0.02em;
}

.page-subtitle {
    font-size: 14px;
    color: var(--krefasy-text-muted);
    margin: 0;
}

.page-header-actions {
    display: flex;
    align-items: center;
    gap: 12px;
    flex-shrink: 0;
}

@media (max-width: 640px) {
    .page-header {
        flex-direction: column;
    }

    .page-title {
        font-size: 22px;
    }

    .page-header-actions {
        width: 100%;
        justify-content: flex-start;
        flex-wrap: wrap;
    }
}
</style>
