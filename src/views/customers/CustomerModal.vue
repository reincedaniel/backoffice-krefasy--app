<template>
    <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div class="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div class="p-6">
                <!-- Header -->
                <div class="flex items-center justify-between mb-6">
                    <h3 class="text-xl font-semibold">
                        {{ isEdit ? 'Editar Customer' : 'Novo Clientes' }}
                    </h3>
                    <button
                        type="button"
                        class="btn btn-outline-primary btn-sm"
                        @click="$emit('close')"
                    >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                    </button>
                </div>

                <form @submit.prevent="handleSubmit">
                    <!-- Informações Pessoais -->
                    <div class="mb-6">
                        <h4 class="text-lg font-semibold mb-4 text-primary">Informações Pessoais</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="md:col-span-2">
                                <label class="form-label">Nome Completo *</label>
                                <input
                                    v-model="form.fullName"
                                    type="text"
                                    class="form-input"
                                    :class="{ 'border-red-500': errors.fullName }"
                                    required
                                />
                                <span v-if="errors.fullName" class="text-red-500 text-sm">{{ errors.fullName }}</span>
                            </div>

                            <div>
                                <label class="form-label">Email *</label>
                                <input
                                    v-model="form.email"
                                    type="email"
                                    class="form-input"
                                    :class="{ 'border-red-500': errors.email }"
                                    required
                                />
                                <span v-if="errors.email" class="text-red-500 text-sm">{{ errors.email }}</span>
                            </div>

                            <div>
                                <label class="form-label">Telefone *</label>
                                <input
                                    v-model="form.phoneNumber"
                                    type="tel"
                                    class="form-input"
                                    :class="{ 'border-red-500': errors.phoneNumber }"
                                    required
                                />
                                <span v-if="errors.phoneNumber" class="text-red-500 text-sm">{{ errors.phoneNumber }}</span>
                            </div>

                            <div>
                                <label class="form-label">Data de Nascimento</label>
                                <input
                                    v-model="form.dateOfBirth"
                                    type="date"
                                    class="form-input"
                                />
                            </div>

                            <div>
                                <label class="form-label">Tipo de Documento</label>
                                <select v-model="form.documentType" class="form-select">
                                    <option value="">Selecione</option>
                                    <option value="CPF">CPF</option>
                                    <option value="CNPJ">CNPJ</option>
                                    <option value="RG">RG</option>
                                    <option value="PASSAPORTE">Passaporte</option>
                                    <option value="OUTRO">Outro</option>
                                </select>
                            </div>

                            <div>
                                <label class="form-label">Número do Documento</label>
                                <input
                                    v-model="form.documentNumber"
                                    type="text"
                                    class="form-input"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Endereço -->
                    <div class="mb-6">
                        <h4 class="text-lg font-semibold mb-4 text-primary">Endereço</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div class="md:col-span-2">
                                <label class="form-label">Endereço</label>
                                <input
                                    v-model="form.address"
                                    type="text"
                                    class="form-input"
                                    placeholder="Rua, número, complemento"
                                />
                            </div>

                            <div>
                                <label class="form-label">Cidade</label>
                                <input
                                    v-model="form.city"
                                    type="text"
                                    class="form-input"
                                />
                            </div>

                            <div>
                                <label class="form-label">Estado</label>
                                <input
                                    v-model="form.state"
                                    type="text"
                                    class="form-input"
                                />
                            </div>

                            <div>
                                <label class="form-label">País</label>
                                <input
                                    v-model="form.country"
                                    type="text"
                                    class="form-input"
                                />
                            </div>

                            <div>
                                <label class="form-label">CEP</label>
                                <input
                                    v-model="form.postalCode"
                                    type="text"
                                    class="form-input"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Informações Profissionais -->
                    <div class="mb-6">
                        <h4 class="text-lg font-semibold mb-4 text-primary">Informações Profissionais</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="form-label">Nome da Empresa</label>
                                <input
                                    v-model="form.companyName"
                                    type="text"
                                    class="form-input"
                                />
                            </div>

                            <div>
                                <label class="form-label">Endereço do Trabalho</label>
                                <input
                                    v-model="form.workAddress"
                                    type="text"
                                    class="form-input"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Referência -->
                    <div class="mb-6">
                        <h4 class="text-lg font-semibold mb-4 text-primary">Referência</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="form-label">Nome da Referência</label>
                                <input
                                    v-model="form.referenceName"
                                    type="text"
                                    class="form-input"
                                />
                            </div>

                            <div>
                                <label class="form-label">Relacionamento</label>
                                <select v-model="form.referenceRelationship" class="form-select">
                                    <option value="">Selecione</option>
                                    <option value="Familiar">Familiar</option>
                                    <option value="Amigo">Amigo</option>
                                    <option value="Colega de Trabalho">Colega de Trabalho</option>
                                    <option value="Vizinho">Vizinho</option>
                                    <option value="Outro">Outro</option>
                                </select>
                            </div>

                            <div>
                                <label class="form-label">Telefone da Referência</label>
                                <input
                                    v-model="form.referencePhoneNumber"
                                    type="tel"
                                    class="form-input"
                                />
                            </div>

                            <div>
                                <label class="form-label">Email da Referência</label>
                                <input
                                    v-model="form.referenceEmail"
                                    type="email"
                                    class="form-input"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Localização -->
                    <div class="mb-6">
                        <h4 class="text-lg font-semibold mb-4 text-primary">Localização</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="form-label">Latitude</label>
                                <input
                                    v-model.number="form.realTimeLocationLatitude"
                                    type="number"
                                    step="any"
                                    class="form-input"
                                />
                            </div>

                            <div>
                                <label class="form-label">Longitude</label>
                                <input
                                    v-model.number="form.realTimeLocationLongitude"
                                    type="number"
                                    step="any"
                                    class="form-input"
                                />
                            </div>

                            <div class="md:col-span-2">
                                <label class="form-label">Data da Localização</label>
                                <input
                                    v-model="form.locationTimestamp"
                                    type="datetime-local"
                                    class="form-input"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Redes Sociais -->
                    <div class="mb-6">
                        <h4 class="text-lg font-semibold mb-4 text-primary">Redes Sociais</h4>
                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label class="form-label">Instagram</label>
                                <input
                                    v-model="form.instagram"
                                    type="url"
                                    class="form-input"
                                    placeholder="https://instagram.com/username"
                                />
                            </div>

                            <div>
                                <label class="form-label">Facebook</label>
                                <input
                                    v-model="form.facebook"
                                    type="url"
                                    class="form-input"
                                    placeholder="https://facebook.com/username"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Botões -->
                    <div class="flex justify-end gap-4 pt-6 border-t">
                        <button
                            type="button"
                            class="btn btn-outline-primary"
                            @click="$emit('close')"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            class="btn btn-primary"
                            :disabled="loading"
                        >
                            <svg v-if="loading" class="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            {{ isEdit ? 'Atualizar' : 'Criar' }}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup lang="ts">
import { ref, reactive, watch } from 'vue';
import { customerService, type Customer, type CustomerCreateUpdate } from '@/services/customers.service';

// Props
interface Props {
    show: boolean;
    customer: Customer | null;
    isEdit: boolean;
}

const props = withDefaults(defineProps<Props>(), {
    show: false,
    customer: null,
    isEdit: false
});

// Emits
const emit = defineEmits<{
    close: [];
    save: [data: CustomerCreateUpdate];
}>();

// Refs
const loading = ref(false);
const errors = ref<Record<string, string>>({});

const form = reactive<CustomerCreateUpdate & { instagram: string; facebook: string }>({
    fullName: '',
    email: '',
    phoneNumber: '',
    dateOfBirth: '',
    address: '',
    city: '',
    state: '',
    country: '',
    postalCode: '',
    documentNumber: '',
    documentType: '',
    workAddress: '',
    companyName: '',
    referenceName: '',
    referenceRelationship: '',
    referencePhoneNumber: '',
    referenceEmail: '',
    realTimeLocationLatitude: 0,
    realTimeLocationLongitude: 0,
    locationTimestamp: '',
    instagram: '',
    facebook: ''
});

// Métodos
const resetForm = () => {
    Object.assign(form, {
        fullName: '',
        email: '',
        phoneNumber: '',
        dateOfBirth: '',
        address: '',
        city: '',
        state: '',
        country: '',
        postalCode: '',
        documentNumber: '',
        documentType: '',
        workAddress: '',
        companyName: '',
        referenceName: '',
        referenceRelationship: '',
        referencePhoneNumber: '',
        referenceEmail: '',
        realTimeLocationLatitude: 0,
        realTimeLocationLongitude: 0,
        locationTimestamp: '',
        instagram: '',
        facebook: ''
    });
    errors.value = {};
};

const validateForm = (): boolean => {
    errors.value = {};

    if (!form.fullName.trim()) {
        errors.value.fullName = 'Nome completo é obrigatório';
    }

    if (!form.email.trim()) {
        errors.value.email = 'Email é obrigatório';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
        errors.value.email = 'Email inválido';
    }

    if (!form.phoneNumber.trim()) {
        errors.value.phoneNumber = 'Telefone é obrigatório';
    }

    return Object.keys(errors.value).length === 0;
};

const handleSubmit = async () => {
    if (!validateForm()) {
        return;
    }

    loading.value = true;
    try {
        // Preparar dados para envio (remover campos extras)
        const submitData: CustomerCreateUpdate = {
            fullName: form.fullName,
            email: form.email,
            phoneNumber: form.phoneNumber,
            dateOfBirth: form.dateOfBirth,
            address: form.address,
            city: form.city,
            state: form.state,
            country: form.country,
            postalCode: form.postalCode,
            documentNumber: form.documentNumber,
            documentType: form.documentType,
            workAddress: form.workAddress,
            companyName: form.companyName,
            referenceName: form.referenceName,
            referenceRelationship: form.referenceRelationship,
            referencePhoneNumber: form.referencePhoneNumber,
            referenceEmail: form.referenceEmail,
            realTimeLocationLatitude: form.realTimeLocationLatitude,
            realTimeLocationLongitude: form.realTimeLocationLongitude,
            locationTimestamp: form.locationTimestamp
        };

        emit('save', submitData);
    } finally {
        loading.value = false;
    }
};

// Watchers
watch(() => props.customer, (newCustomer) => {
    if (newCustomer && props.isEdit) {
        Object.assign(form, {
            fullName: newCustomer.fullName,
            email: newCustomer.email,
            phoneNumber: newCustomer.phoneNumber,
            dateOfBirth: newCustomer.dateOfBirth ? newCustomer.dateOfBirth.split('T')[0] : '',
            address: newCustomer.address,
            city: newCustomer.city,
            state: newCustomer.state,
            country: newCustomer.country,
            postalCode: newCustomer.postalCode,
            documentNumber: newCustomer.documentNumber,
            documentType: newCustomer.documentType,
            workAddress: newCustomer.workAddress,
            companyName: newCustomer.companyName,
            referenceName: newCustomer.referenceName,
            referenceRelationship: newCustomer.referenceRelationship,
            referencePhoneNumber: newCustomer.referencePhoneNumber,
            referenceEmail: newCustomer.referenceEmail,
            realTimeLocationLatitude: newCustomer.realTimeLocationLatitude || 0,
            realTimeLocationLongitude: newCustomer.realTimeLocationLongitude || 0,
            locationTimestamp: newCustomer.locationTimestamp ? newCustomer.locationTimestamp.replace('Z', '').slice(0, 16) : '',
            instagram: newCustomer.instagram,
            facebook: newCustomer.facebook
        });
    } else {
        resetForm();
    }
}, { immediate: true });

watch(() => props.show, (newShow) => {
    if (!newShow) {
        resetForm();
    }
});
</script>
