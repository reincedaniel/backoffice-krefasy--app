import { computed } from 'vue';
import { storeToRefs } from 'pinia';
import { useKrefasyStore } from '@/stores/index';
import {
    canPartnerAccessLoan,
    getLoggedUserId,
    getPartnerRoleLabel,
    type PartnerManagerFilter,
    type PartnerScopedLoan,
} from '@/utils/partner-scope.utils';

export function usePartnerScope() {
    const krefasyStore = useKrefasyStore();
    const { isAdmin, isPartner, currentUser } = storeToRefs(krefasyStore);

    const loggedUserId = computed(() => getLoggedUserId());

    const roleLabel = computed(() =>
        getPartnerRoleLabel(currentUser.value?.roles ?? [])
    );

    const permissions = computed(() => currentUser.value?.permissions ?? []);

    const isRestrictedPartnerView = computed(
        () => isPartner.value && !isAdmin.value
    );

    function canAccessLoan(loan: PartnerScopedLoan | null | undefined): boolean {
        if (!loan) return false;
        if (isAdmin.value) return true;
        if (!isPartner.value) return false;
        return canPartnerAccessLoan(loan, loggedUserId.value);
    }

    return {
        isAdmin,
        isPartner,
        loggedUserId,
        roleLabel,
        permissions,
        canAccessLoan,
        isRestrictedPartnerView,
    };
}

export type { PartnerManagerFilter };
