<template>
    <div class="space-y-5">
        <PageHeader
            :title="loan ? `#${loan.loanNumber || loan.id}` : 'Detalhes do Empréstimo'"
            :subtitle="loan ? loan.customerName : 'Visualize e gerencie todas as informações do empréstimo'"
            :breadcrumbs="[
                { label: 'Dashboard', to: '/dashboard' },
                { label: 'Empréstimos', to: '/loans' },
                { label: 'Detalhes' },
            ]"
        >
            <template v-if="loan && !loading && !error" #actions>
                <router-link to="/loans" class="btn btn-outline-secondary btn-sm gap-2">
                    <icon-arrow-left class="w-4 h-4" />
                    Voltar
                </router-link>
                <button v-if="canApproveLoan" type="button" class="btn btn-success btn-sm gap-2" @click="approveLoan">
                    <icon-square-check class="w-4 h-4" />
                    Aprovar
                </button>
                <button v-if="canRejectLoan" type="button" class="btn btn-danger btn-sm gap-2" @click="rejectLoan">
                    <icon-x-circle class="w-4 h-4" />
                    Rejeitar
                </button>
                <button v-if="!canApproveLoan && !canRejectLoan" type="button" class="btn btn-outline-info btn-sm gap-2" disabled>
                    <icon-square-check class="w-4 h-4" />
                    {{ getActionButtonText() }}
                </button>
                <button
                    v-if="canContactCustomer"
                    type="button"
                    class="btn btn-outline-primary btn-sm gap-2"
                    :disabled="collectionChatLoading"
                    @click="openPrimaryCollectionChat"
                >
                    <icon-menu-chat class="w-4 h-4" />
                    Contactar cliente
                </button>
            </template>
        </PageHeader>

        <div v-if="loading" class="panel">
            <div class="flex items-center justify-center py-16">
                <div class="flex flex-col items-center gap-4">
                    <span class="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10"></span>
                    <span class="text-sm text-gray-600 dark:text-gray-300">Carregando detalhes do empréstimo...</span>
                </div>
            </div>
        </div>

        <div v-else-if="accessDenied" class="panel">
            <div class="text-center py-16">
                <div class="text-red-500 text-lg mb-4">Acesso negado</div>
                <p class="text-gray-600 dark:text-gray-400 mb-4">
                    Este empréstimo não está associado ao seu utilizador nem está disponível para atribuição.
                </p>
                <router-link to="/loans" class="btn btn-primary">Voltar aos empréstimos</router-link>
            </div>
        </div>

        <div v-else-if="error" class="panel">
            <div class="text-center py-16">
                <div class="text-red-500 text-lg mb-4">Erro ao carregar empréstimo</div>
                <p class="text-gray-600 dark:text-gray-400 mb-4">{{ error }}</p>
                <button @click="loadLoanDetails" class="btn btn-primary">Tentar Novamente</button>
            </div>
        </div>

        <template v-else-if="loan">
            <!-- Hero / resumo -->
            <div class="panel overflow-hidden relative" :class="getStatusBorderClass(loan.loanStatusName || loan.status)">
                <div class="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div class="space-y-2">
                        <div class="flex items-center gap-2 flex-wrap">
                            <span class="badge text-sm" :class="getStatusBadgeClass(loan.loanStatusName || loan.status)">
                                {{ loan.loanStatusName || getStatusLabel(loan.status) }}
                            </span>
                            <span v-if="loan.loanProductName" class="text-xs text-gray-500 dark:text-gray-400">
                                {{ loan.loanProductName }}
                            </span>
                        </div>
                        <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                            {{ formatCurrency(loan.requestedAmount || loan.amount) }}
                        </h2>
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            {{ loan.customerEmail }}
                            <span v-if="loan.managerName"> · Gestor: {{ loan.managerName }}</span>
                        </p>
                    </div>
                    <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full lg:w-auto lg:min-w-[28rem]">
                        <div class="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5">
                            <p class="text-xs text-gray-500">Aprovado</p>
                            <p class="text-sm font-bold">
                                {{ loan.approvedAmount && loan.approvedAmount > 0 ? formatCurrency(loan.approvedAmount) : '—' }}
                            </p>
                        </div>
                        <div class="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5">
                            <p class="text-xs text-gray-500">Total</p>
                            <p class="text-sm font-bold text-primary">{{ formatCurrency(loan.totalAmount) }}</p>
                        </div>
                        <div class="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5">
                            <p class="text-xs text-gray-500">Parcelas</p>
                            <p class="text-sm font-bold">{{ loan.numberOfInstallments || loan.term || 0 }}×</p>
                        </div>
                        <div class="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5">
                            <p class="text-xs text-gray-500">Juros</p>
                            <p class="text-sm font-bold">{{ loan.interestRate }}%</p>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Tabs -->
            <div class="panel !p-0 overflow-hidden">
                <TabGroup as="div" :selectedIndex="selectedTabIndex" @change="selectedTabIndex = $event">
                    <div class="px-4 pt-4 pb-0 border-b border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/20">
                        <TabList class="flex flex-wrap gap-2">
                            <Tab v-slot="{ selected }" as="template">
                                <button type="button" :class="['tab-pill', selected ? 'tab-pill-active' : 'tab-pill-inactive']">
                                    <icon-credit-card class="w-4 h-4" />
                                    Produto
                                </button>
                            </Tab>
                            <Tab v-slot="{ selected }" as="template">
                                <button type="button" :class="['tab-pill', selected ? 'tab-pill-active' : 'tab-pill-inactive']">
                                    <icon-users class="w-4 h-4" />
                                    Cliente
                                </button>
                            </Tab>
                            <Tab v-slot="{ selected }" as="template">
                                <button type="button" :class="['tab-pill', selected ? 'tab-pill-active' : 'tab-pill-inactive']">
                                    <icon-dollar-sign class="w-4 h-4" />
                                    Envio de Valores
                                </button>
                            </Tab>
                            <Tab v-slot="{ selected }" as="template">
                                <button type="button" :class="['tab-pill', selected ? 'tab-pill-active' : 'tab-pill-inactive']">
                                    <icon-list-check class="w-4 h-4" />
                                    Parcelas
                                    <span v-if="loan.installments?.length" class="ml-1 text-xs opacity-80">({{ loan.installments.length }})</span>
                                </button>
                            </Tab>
                        </TabList>
                    </div>

                    <TabPanels>
                            <!-- Tab Produto -->
                            <TabPanel>
                                <div class="p-5 space-y-5">
                                    <section class="detail-section">
                                        <div class="detail-section-header">
                                            <icon-credit-card class="w-4 h-4" />
                                            Detalhes do Produto
                                        </div>
                                        <div class="detail-section-body">
                                            <div class="detail-field">
                                                <p class="detail-field-label">Produto</p>
                                                <p class="detail-field-value">{{ loan.loanProductName || 'N/A' }}</p>
                                            </div>
                                            <div class="detail-field">
                                                <p class="detail-field-label">Valor Solicitado</p>
                                                <p class="detail-field-value text-primary">{{ formatCurrency(loan.requestedAmount || loan.amount) }}</p>
                                            </div>
                                            <div class="detail-field">
                                                <p class="detail-field-label">Valor Aprovado</p>
                                                <p class="detail-field-value">
                                                    {{ loan.approvedAmount && loan.approvedAmount > 0 ? formatCurrency(loan.approvedAmount) : 'Aguardando aprovação' }}
                                                </p>
                                            </div>
                                            <div class="detail-field">
                                                <p class="detail-field-label">Taxa de Juros</p>
                                                <p class="detail-field-value">{{ loan.interestRate }}% · {{ loan.interestPeriodName || 'N/A' }}</p>
                                            </div>
                                            <div class="detail-field">
                                                <p class="detail-field-label">Parcelas</p>
                                                <p class="detail-field-value">{{ loan.numberOfInstallments || loan.term }} × {{ formatCurrency(loan.monthlyPayment) }}</p>
                                            </div>
                                            <div class="detail-field">
                                                <p class="detail-field-label">Total a Pagar</p>
                                                <p class="detail-field-value text-primary">{{ formatCurrency(loan.totalAmount) }}</p>
                                            </div>
                                            <div v-if="loan.currencyName" class="detail-field">
                                                <p class="detail-field-label">Moeda</p>
                                                <p class="detail-field-value">{{ loan.currencyName }} ({{ loan.currencySymbol || loan.currencyCode }})</p>
                                            </div>
                                        </div>
                                    </section>

                                    <section class="detail-section">
                                        <div class="detail-section-header">
                                            <icon-calendar class="w-4 h-4" />
                                            Datas
                                        </div>
                                        <div class="detail-section-body">
                                            <div class="detail-field">
                                                <p class="detail-field-label">Criação</p>
                                                <p class="detail-field-value">{{ formatDate(loan.createdAt) }}</p>
                                            </div>
                                            <div class="detail-field">
                                                <p class="detail-field-label">Início</p>
                                                <p class="detail-field-value">{{ loan.startDate ? formatDate(loan.startDate) : 'Não definida' }}</p>
                                            </div>
                                            <div class="detail-field">
                                                <p class="detail-field-label">Fim</p>
                                                <p class="detail-field-value">{{ loan.endDate ? formatDate(loan.endDate) : 'Em andamento' }}</p>
                                            </div>
                                            <div class="detail-field">
                                                <p class="detail-field-label">Atualização</p>
                                                <p class="detail-field-value">{{ loan.updatedAt ? formatDate(loan.updatedAt) : 'N/A' }}</p>
                                            </div>
                                        </div>
                                    </section>

                                    <section v-if="loan.notes" class="detail-section">
                                        <div class="detail-section-header">
                                            <icon-file class="w-4 h-4" />
                                            Observações
                                        </div>
                                        <div class="p-5">
                                            <p class="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{{ loan.notes }}</p>
                                        </div>
                                    </section>

                                    <div v-if="loan.rejectionReason" class="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-4">
                                        <p class="text-xs font-semibold text-red-600 dark:text-red-400 mb-1">Motivo da Rejeição</p>
                                        <p class="text-sm text-red-800 dark:text-red-200">{{ loan.rejectionReason }}</p>
                                    </div>
                                </div>
                            </TabPanel>

                            <!-- Tab Cliente -->
                            <TabPanel>
                                <div class="p-5 space-y-5">
                                    <section class="detail-section">
                                        <div class="detail-section-header">
                                            <icon-users class="w-4 h-4" />
                                            Informações Básicas
                                        </div>
                                        <div class="detail-section-body">
                                            <div class="detail-field">
                                                <p class="detail-field-label">Nome</p>
                                                <p class="detail-field-value">{{ loan.customerDetails?.fullName || loan.customerName }}</p>
                                            </div>
                                            <div class="detail-field">
                                                <p class="detail-field-label">Email</p>
                                                <p class="detail-field-value">{{ loan.customerDetails?.email || loan.customerEmail }}</p>
                                            </div>
                                            <div class="detail-field">
                                                <p class="detail-field-label">Telefone</p>
                                                <p class="detail-field-value">{{ loan.customerDetails?.phoneNumber || 'N/A' }}</p>
                                            </div>
                                            <div class="detail-field">
                                                <p class="detail-field-label">Nascimento</p>
                                                <p class="detail-field-value">{{ loan.customerDetails?.dateOfBirth ? formatDate(loan.customerDetails.dateOfBirth) : 'N/A' }}</p>
                                            </div>
                                            <div class="detail-field">
                                                <p class="detail-field-label">Documento</p>
                                                <p class="detail-field-value">{{ loan.customerDetails?.documentType || 'N/A' }} · {{ loan.customerDetails?.documentNumber || 'N/A' }}</p>
                                            </div>
                                        </div>
                                    </section>

                                    <!-- Endereço -->
                                    <section
                                        v-if="loan.customerDetails && (loan.customerDetails.address || loan.customerDetails.city || loan.customerDetails.state)"
                                        class="detail-section"
                                    >
                                        <div class="detail-section-header">
                                            <icon-home class="w-4 h-4" />
                                            Endereço Residencial
                                        </div>
                                        <div class="detail-section-body">
                                            <div v-if="loan.customerDetails.address" class="detail-field sm:col-span-2 lg:col-span-3">
                                                <p class="detail-field-label">Endereço</p>
                                                <p class="detail-field-value">{{ loan.customerDetails.address }}</p>
                                            </div>
                                            <div v-if="loan.customerDetails.city" class="detail-field">
                                                <p class="detail-field-label">Cidade</p>
                                                <p class="detail-field-value">{{ loan.customerDetails.city }}</p>
                                            </div>
                                            <div v-if="loan.customerDetails.state" class="detail-field">
                                                <p class="detail-field-label">Estado/Província</p>
                                                <p class="detail-field-value">{{ loan.customerDetails.state }}</p>
                                            </div>
                                            <div v-if="loan.customerDetails.country" class="detail-field">
                                                <p class="detail-field-label">País</p>
                                                <p class="detail-field-value">{{ loan.customerDetails.country }}</p>
                                            </div>
                                            <div v-if="loan.customerDetails.postalCode" class="detail-field">
                                                <p class="detail-field-label">Código Postal</p>
                                                <p class="detail-field-value">{{ loan.customerDetails.postalCode }}</p>
                                            </div>
                                        </div>
                                    </section>

                                    <!-- Localização GPS -->
                                    <section v-if="loan.customerDetails && hasValidLocation" class="detail-section">
                                        <div class="detail-section-header">
                                            <icon-map-pin class="w-4 h-4" />
                                            Localização GPS
                                        </div>
                                        <div class="detail-section-body">
                                            <div class="detail-field">
                                                <p class="detail-field-label">Latitude</p>
                                                <p class="detail-field-value font-mono text-xs">{{ loan.customerDetails.realTimeLocationLatitude }}</p>
                                            </div>
                                            <div class="detail-field">
                                                <p class="detail-field-label">Longitude</p>
                                                <p class="detail-field-value font-mono text-xs">{{ loan.customerDetails.realTimeLocationLongitude }}</p>
                                            </div>
                                            <div class="detail-field">
                                                <p class="detail-field-label">Capturado em</p>
                                                <p class="detail-field-value">{{ formatDate(loan.customerDetails.locationTimestamp) }}</p>
                                            </div>
                                        </div>
                                        <div class="px-5 pb-5">
                                            <button type="button" class="btn btn-primary btn-sm gap-2" @click="openGoogleMaps">
                                                <icon-link class="w-4 h-4" />
                                                Ver no Google Maps
                                            </button>
                                        </div>
                                    </section>

                                    <!-- Informações Profissionais -->
                                    <section
                                        v-if="loan.customerDetails && (loan.customerDetails.workAddress || loan.customerDetails.companyName)"
                                        class="detail-section"
                                    >
                                        <div class="detail-section-header">
                                            <icon-square-check class="w-4 h-4" />
                                            Informações Profissionais
                                        </div>
                                        <div class="detail-section-body">
                                            <div v-if="loan.customerDetails.companyName" class="detail-field">
                                                <p class="detail-field-label">Empresa</p>
                                                <p class="detail-field-value">{{ loan.customerDetails.companyName }}</p>
                                            </div>
                                            <div v-if="loan.customerDetails.workAddress" class="detail-field sm:col-span-2">
                                                <p class="detail-field-label">Endereço de Trabalho</p>
                                                <p class="detail-field-value">{{ loan.customerDetails.workAddress }}</p>
                                            </div>
                                        </div>
                                    </section>

                                    <!-- Referências -->
                                    <section v-if="loan.customerDetails && loan.customerDetails.referenceName" class="detail-section">
                                        <div class="detail-section-header">
                                            <icon-user-plus class="w-4 h-4" />
                                            Referências
                                        </div>
                                        <div class="detail-section-body">
                                            <div class="detail-field">
                                                <p class="detail-field-label">Nome</p>
                                                <p class="detail-field-value">{{ loan.customerDetails.referenceName }}</p>
                                            </div>
                                            <div v-if="loan.customerDetails.referenceRelationship" class="detail-field">
                                                <p class="detail-field-label">Relacionamento</p>
                                                <p class="detail-field-value">{{ loan.customerDetails.referenceRelationship }}</p>
                                            </div>
                                            <div v-if="loan.customerDetails.referencePhoneNumber" class="detail-field">
                                                <p class="detail-field-label">Telefone</p>
                                                <p class="detail-field-value">{{ loan.customerDetails.referencePhoneNumber }}</p>
                                            </div>
                                            <div v-if="loan.customerDetails.referenceEmail" class="detail-field">
                                                <p class="detail-field-label">Email</p>
                                                <p class="detail-field-value">{{ loan.customerDetails.referenceEmail }}</p>
                                            </div>
                                        </div>
                                    </section>

                                    <!-- Redes Sociais -->
                                    <section
                                        v-if="loan.customerDetails && (loan.customerDetails.instagram || loan.customerDetails.facebook)"
                                        class="detail-section"
                                    >
                                        <div class="detail-section-header">
                                            <icon-share class="w-4 h-4" />
                                            Redes Sociais
                                        </div>
                                        <div class="detail-section-body">
                                            <div v-if="loan.customerDetails.instagram" class="detail-field">
                                                <p class="detail-field-label">Instagram</p>
                                                <a :href="loan.customerDetails.instagram" target="_blank" class="detail-field-value text-primary hover:underline break-all">
                                                    {{ loan.customerDetails.instagram }}
                                                </a>
                                            </div>
                                            <div v-if="loan.customerDetails.facebook" class="detail-field">
                                                <p class="detail-field-label">Facebook</p>
                                                <a :href="loan.customerDetails.facebook" target="_blank" class="detail-field-value text-primary hover:underline break-all">
                                                    {{ loan.customerDetails.facebook }}
                                                </a>
                                            </div>
                                        </div>
                                    </section>

                                    <!-- Método de pagamento padrão -->
                                    <section
                                        v-if="loan.customerDetails?.defaultPaymentMethod"
                                        class="detail-section !p-0 overflow-hidden"
                                    >
                                        <div class="detail-section-header px-5 pt-5 pb-0 border-0">
                                            <icon-credit-card class="w-4 h-4" />
                                            Método de Pagamento
                                        </div>
                                        <div class="p-5 pt-3">
                                            <PaymentMethodCard :payment-method="loan.customerDetails.defaultPaymentMethod" />
                                        </div>
                                    </section>

                                    <!-- Link para envio de valores -->
                                    <div class="rounded-xl border border-teal-200 dark:border-teal-800 bg-teal-50 dark:bg-teal-900/20 p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                                        <div>
                                            <h5 class="font-semibold text-gray-800 dark:text-gray-200">Envio de Valores</h5>
                                            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                                Método de pagamento e valor a transferir ao cliente.
                                            </p>
                                        </div>
                                        <button type="button" class="btn btn-primary btn-sm gap-2 shrink-0" @click="selectedTabIndex = LOAN_TAB.ENVIO">
                                            <icon-dollar-sign class="w-4 h-4" />
                                            Ver dados de envio
                                        </button>
                                    </div>

                                    <!-- Gerente Responsável -->
                                    <section v-if="loan.managerName" class="detail-section">
                                        <div class="detail-section-header">
                                            <icon-checks class="w-4 h-4" />
                                            Gerenciamento
                                        </div>
                                        <div class="detail-section-body">
                                            <div class="detail-field">
                                                <p class="detail-field-label">Gerente Responsável</p>
                                                <p class="detail-field-value">{{ loan.managerName }}</p>
                                            </div>
                                        </div>
                                    </section>

                                    <!-- Documentos do Cliente -->
                                    <section v-if="loan.customerDetails?.documents && loan.customerDetails.documents.length > 0" class="detail-section">
                                        <div class="detail-section-header">
                                            <icon-file class="w-4 h-4" />
                                            Documentos do Cliente
                                        </div>
                                        <div class="p-5 space-y-4">
                                        <!-- Organizar documentos por tipo -->
                                        <div v-for="(docGroup, docType) in groupedDocuments" :key="docType" class="mb-4">
                                            <h6 class="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">{{ docType }}</h6>
                                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                <div v-for="doc in docGroup" :key="doc.id"
                                                     class="flex flex-col justify-between p-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800/50 hover:shadow-md transition-shadow">
                                                    <div class="flex-1 mb-2">
                                                        <div class="font-medium text-sm truncate" :title="doc.originalFileName">
                                                            {{ doc.originalFileName }}
                                                        </div>
                                                        <div class="text-xs text-gray-500 mt-1">
                                                            Enviado em {{ formatDate(doc.createdAt) }}
                                                        </div>
                                                    </div>
                                                    <div class="flex items-center justify-between">
                                                        <span class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                                                            {{ doc.documentTypeName }}
                                                        </span>
                                                        <div class="flex items-center space-x-2">
                                                            <button @click="previewDocument(doc)"
                                                                    class="hover:text-primary transition-colors"
                                                                    title="Visualizar documento">
                                                                <icon-eye class="w-4 h-4" />
                                                            </button>
                                                            <button @click="downloadDocument(doc)"
                                                                    class="hover:text-primary transition-colors"
                                                                    title="Baixar documento">
                                                                <icon-download class="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        </div>
                                    </section>
                                </div>
                            </TabPanel>

                            <!-- Tab Envio de Valores -->
                            <TabPanel>
                                <LoanDisbursementPanel
                                    v-if="loan"
                                    :loan="loan"
                                    :payment-method="loan.customerDetails?.defaultPaymentMethod"
                                    :format-currency="formatCurrency"
                                />
                            </TabPanel>

                            <!-- Tab Parcelas -->
                            <TabPanel>
                                <div class="p-5 space-y-5">
                                    <div v-if="loan.installments && loan.installments.length > 0">
                                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-5">
                                            <h4 class="font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                                                <icon-list-check class="w-5 h-5" />
                                                Cronograma de Parcelas
                                            </h4>
                                            <div class="flex flex-wrap gap-2 items-center">
                                                <select v-model="installmentFilter" class="form-select form-select-sm w-auto min-w-[140px]">
                                                    <option value="all">Todas</option>
                                                    <option value="paid">Pagas</option>
                                                    <option value="unpaid">Não pagas</option>
                                                    <option value="overdue">Em atraso</option>
                                                    <option value="pending">Pendentes</option>
                                                </select>
                                                <select v-model="installmentSortBy" class="form-select form-select-sm w-auto min-w-[130px]">
                                                    <option value="number">Por número</option>
                                                    <option value="dueDate">Por vencimento</option>
                                                    <option value="amount">Por valor (maior)</option>
                                                    <option value="amount-asc">Por valor (menor)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div class="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-5">
                                            <div class="rounded-xl bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5">
                                                <p class="text-xs text-gray-500">Total</p>
                                                <p class="text-sm font-bold">{{ loan.installments.length }} parcelas</p>
                                            </div>
                                            <div class="rounded-xl bg-green-50 dark:bg-green-900/20 px-3 py-2.5">
                                                <p class="text-xs text-gray-500">Pagas</p>
                                                <p class="text-sm font-bold text-green-700 dark:text-green-300">{{ paidInstallmentsCount }}</p>
                                            </div>
                                            <div class="rounded-xl bg-amber-50 dark:bg-amber-900/20 px-3 py-2.5">
                                                <p class="text-xs text-gray-500">Pendentes</p>
                                                <p class="text-sm font-bold text-amber-700 dark:text-amber-300">{{ pendingInstallmentsCount }}</p>
                                            </div>
                                            <div class="rounded-xl bg-red-50 dark:bg-red-900/20 px-3 py-2.5">
                                                <p class="text-xs text-gray-500">Em atraso</p>
                                                <p class="text-sm font-bold text-red-700 dark:text-red-300">{{ overdueInstallmentsCount }}</p>
                                            </div>
                                            <div class="rounded-xl bg-red-100 dark:bg-red-900/30 px-3 py-2.5 sm:col-span-1 col-span-2">
                                                <p class="text-xs text-gray-500">Total em atraso (com mora)</p>
                                                <p class="text-sm font-bold text-red-800 dark:text-red-200">{{ formatCurrency(overdueTotalDueAmount) }}</p>
                                            </div>
                                        </div>

                                        <div class="detail-section overflow-hidden">
                                            <div class="overflow-x-auto">
                                            <table class="table w-full">
                                                <thead>
                                                    <tr>
                                                        <th>Parcela</th>
                                                        <th>Valor</th>
                                                        <th>Dias</th>
                                                        <th>Mora</th>
                                                        <th>Total a pagar</th>
                                                        <th>Data Venc.</th>
                                                        <th>Data Pagamento</th>
                                                        <th>Valor Pago</th>
                                                        <th>Status</th>
                                                        <th>Método</th>
                                                        <th>Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr
                                                        v-for="installment in filteredInstallments"
                                                        :key="installment.id"
                                                        :class="getInstallmentRowClass(installment)"
                                                    >
                                                        <td>
                                                            <span class="font-medium">
                                                                {{ installment.installmentNumber }}/{{ loan.numberOfInstallments }}
                                                            </span>
                                                        </td>
                                                        <td class="font-semibold">{{ formatCurrency(installment.amount) }}</td>
                                                        <td>
                                                            <span v-if="getInstallmentLateSummary(installment).daysOverdue > 0" class="text-red-600 dark:text-red-400 font-medium">
                                                                {{ getInstallmentLateSummary(installment).daysOverdue }}
                                                            </span>
                                                            <span v-else class="text-white-dark">—</span>
                                                        </td>
                                                        <td>
                                                            <span v-if="getInstallmentLateSummary(installment).lateInterest > 0" class="text-red-600 dark:text-red-400 font-medium">
                                                                + {{ formatCurrency(getInstallmentLateSummary(installment).lateInterest) }}
                                                            </span>
                                                            <span v-else class="text-white-dark">—</span>
                                                        </td>
                                                        <td class="font-bold" :class="getInstallmentLateSummary(installment).isOverdue ? 'text-red-700 dark:text-red-300' : ''">
                                                            {{ formatCurrency(getInstallmentLateSummary(installment).totalDue) }}
                                                        </td>
                                                        <td>{{ formatDate(installment.dueDate) }}</td>
                                                        <td>
                                                            <span v-if="installment.paidDate">{{ formatDate(installment.paidDate) }}</span>
                                                            <span v-else class="text-white-dark">—</span>
                                                        </td>
                                                        <td>
                                                            <span v-if="installment.paidAmount">{{ formatCurrency(installment.paidAmount) }}</span>
                                                            <span v-else class="text-white-dark">—</span>
                                                        </td>
                                                        <td style="gap: 10px; display: flex; align-items: center;">
                                                            <span class="badge" :class="getInstallmentStatusBadgeClass(installment)">
                                                                {{ getInstallmentStatusLabel(installment) }}
                                                            </span>
                                                            <span
                                                                v-if="canViewComprovativo(installment)"
                                                                class="ml-1 inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
                                                                title="Tem comprovativo"
                                                            >
                                                                <icon-file class="w-3.5 h-3.5 mr-0.5" />
                                                                Comprovativos
                                                            </span>
                                                            <span
                                                                v-if="getProofAcceptanceState(installment)"
                                                                class="ml-1 text-xs"
                                                                :class="getProofAcceptanceState(installment)?.accepted ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'"
                                                            >
                                                                ({{ getProofAcceptanceState(installment)?.accepted ? 'Aceite' : 'Não aceite' }})
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <span v-if="installment.paymentMethod" class="text-sm">{{ installment.paymentMethod }}</span>
                                                            <span v-else class="text-white-dark">—</span>
                                                        </td>
                                                        <td>
                                                            <div class="flex flex-wrap items-center gap-1">
                                                                <template v-if="canViewComprovativo(installment)">
                                                                    <button
                                                                        type="button"
                                                                        class="btn btn-outline-primary btn-sm gap-1"
                                                                        title="Ver comprovativo"
                                                                        @click="openProofModal(installment)"
                                                                    >
                                                                        <icon-eye class="w-4 h-4" />
                                                                        Ver comprovativo
                                                                    </button>
                                                                </template>
                                                                <template v-if="!installment.isPaid">
                                                                    <a
                                                                        v-if="installment.url"
                                                                        :href="installment.url"
                                                                        target="_blank"
                                                                        rel="noopener noreferrer"
                                                                        class="btn btn-primary btn-sm"
                                                                        title="Pagar parcela"
                                                                    >
                                                                        Pagar
                                                                    </a>
                                                                    <button
                                                                        type="button"
                                                                        class="btn btn-outline-success btn-sm gap-1"
                                                                        title="Marcar como paga (manual)"
                                                                        @click="openMarkPaidModal(installment)"
                                                                    >
                                                                        <icon-square-check class="w-4 h-4" />
                                                                        Marcar como paga
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        class="btn btn-outline-secondary btn-sm gap-1"
                                                                        title="Contactar no chat"
                                                                        :disabled="collectionChatLoading"
                                                                        @click="openInstallmentCollectionChat(installment)"
                                                                    >
                                                                        <icon-menu-chat class="w-4 h-4" />
                                                                        Cobrar
                                                                    </button>
                                                                </template>
                                                                <span v-if="!canViewComprovativo(installment) && installment.isPaid" class="text-white-dark">—</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                            </div>
                                        </div>

                                        <div v-if="filteredInstallments.length === 0" class="text-center py-8 text-gray-500">
                                            Nenhuma parcela encontrada com os filtros selecionados.
                                        </div>
                                    </div>

                                    <div v-else class="flex flex-col items-center justify-center py-16 text-center">
                                        <div class="w-16 h-16 mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                                            <icon-list-check class="w-8 h-8 text-gray-400 dark:text-gray-500" />
                                        </div>
                                        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                                            Nenhuma Parcela Encontrada
                                        </h3>
                                        <p class="text-gray-500 dark:text-gray-400 max-w-md">
                                            Este empréstimo ainda não possui cronograma de parcelas definido.
                                            O cronograma será gerado após a aprovação do empréstimo.
                                        </p>
                                    </div>
                                </div>
                            </TabPanel>
                        </TabPanels>
                    </TabGroup>
                </div>
        </template>

        <!-- Modal Ver Comprovativo -->
        <Teleport to="body">
            <TransitionRoot appear :show="showProofModal" as="template">
                <Dialog as="div" class="relative z-[99]" @close="closeProofModal">
                <TransitionChild
                    as="template"
                    enter="duration-300 ease-out"
                    enter-from="opacity-0"
                    enter-to="opacity-100"
                    leave="duration-200 ease-in"
                    leave-from="opacity-100"
                    leave-to="opacity-0"
                >
                    <DialogOverlay class="fixed inset-0 bg-black/60" />
                </TransitionChild>
                <div class="fixed inset-0 overflow-y-auto overscroll-contain">
                    <div class="flex min-h-full items-start sm:items-center justify-center px-3 py-3 sm:px-4 sm:py-4">
                        <TransitionChild
                            as="template"
                            enter="duration-300 ease-out"
                            enter-from="opacity-0 scale-95"
                            enter-to="opacity-100 scale-100"
                            leave="duration-200 ease-in"
                            leave-from="opacity-100 scale-100"
                            leave-to="opacity-0 scale-95"
                        >
                            <DialogPanel class="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-6xl max-h-[calc(100dvh-1.5rem)] flex flex-col text-black dark:text-white-dark my-2 sm:my-4">
                                <div class="flex shrink-0 items-center justify-between bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-12 rtl:pl-12">
                                    <h3 class="text-lg font-bold pr-2">
                                        Comprovativo — Parcela {{ selectedProofInstallment ? selectedProofInstallment.installmentNumber : '' }}/{{ loan?.numberOfInstallments }}
                                    </h3>
                                    <button type="button" class="absolute top-3 ltr:right-3 rtl:left-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" @click="closeProofModal">
                                        <icon-x class="w-5 h-5" />
                                    </button>
                                </div>
                                <div class="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 space-y-4">
                                    <div v-if="proofReceiptsLoading" class="flex flex-col items-center justify-center py-12 gap-3">
                                        <span class="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10 inline-block"></span>
                                        <span class="text-sm text-white-dark">A carregar comprovativo...</span>
                                    </div>
                                    <div v-else-if="proofReceiptsError" class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg text-red-700 dark:text-red-300 text-sm">
                                        {{ proofReceiptsError }}
                                    </div>
                                    <template v-else>
                                        <div v-if="proofReceipts.length > 1" class="mb-2">
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Comprovativo</label>
                                            <select v-model="selectedReceiptId" class="form-select w-full">
                                                <option v-for="r in proofReceipts" :key="r.id" :value="r.id">
                                                    {{ r.originalFileName }} — {{ formatDate(r.createdAt) }}
                                                </option>
                                            </select>
                                        </div>
                                        <div v-if="currentProofUrl" class="rounded-lg border border-white-dark/20 overflow-hidden bg-gray-100 dark:bg-gray-800 flex flex-col">
                                            <div class="flex flex-wrap items-center gap-2 px-3 py-2 border-b border-white-dark/20 bg-white/80 dark:bg-gray-900/40 shrink-0">
                                                <a
                                                    :href="currentProofUrl"
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    class="btn btn-outline-primary btn-sm gap-1.5"
                                                >
                                                    <icon-link class="w-4 h-4" />
                                                    Abrir num separador
                                                </a>
                                                <button
                                                    type="button"
                                                    class="btn btn-primary btn-sm gap-1.5"
                                                    @click="downloadCurrentProof"
                                                >
                                                    <icon-download class="w-4 h-4" />
                                                    Baixar comprovativo
                                                </button>
                                            </div>
                                            <!-- Área fixa: imagem com object-contain (sem scroll extra); PDF/outros em iframe a preencher a caixa -->
                                            <div
                                                class="relative w-full h-[min(52vh,600px)] min-h-[260px] max-h-[70vh] overflow-hidden bg-neutral-200/60 dark:bg-neutral-950/40 flex items-center justify-center"
                                            >
                                                <img
                                                    v-if="isCurrentProofImage"
                                                    :src="currentProofUrl"
                                                    alt="Comprovativo de pagamento"
                                                    class="block max-h-full max-w-full w-auto h-auto object-contain object-center p-2 select-none"
                                                />
                                                <iframe
                                                    v-else
                                                    :src="currentProofPdfUrl"
                                                    class="absolute inset-0 w-full h-full border-0 bg-white dark:bg-gray-900"
                                                    title="Comprovativo de pagamento"
                                                />
                                            </div>
                                        </div>
                                        <div v-else class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-white-dark">
                                            Sem comprovativo disponível para pré-visualizar.
                                        </div>
                                    </template>
                                    <InstallmentPaymentSummary
                                        v-if="selectedProofInstallment"
                                        :installment="selectedProofInstallment"
                                        :currency-code="loan?.currencyCode"
                                        :format-currency="formatCurrency"
                                        class="mb-2"
                                    />
                                    <div class="border-t border-white-dark/20 pt-4">
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Decisão do comprovativo</label>
                                        <div class="flex gap-3 mb-3">
                                            <button
                                                type="button"
                                                class="btn flex-1"
                                                :class="proofForm.accepted === true ? 'btn-success' : 'btn-outline-success'"
                                                @click="proofForm.accepted = true"
                                            >
                                                <icon-square-check class="w-4 h-4 inline mr-1" />
                                                Aceite
                                            </button>
                                            <button
                                                type="button"
                                                class="btn flex-1"
                                                :class="proofForm.accepted === false ? 'btn-danger' : 'btn-outline-danger'"
                                                @click="proofForm.accepted = false"
                                            >
                                                <icon-x-circle class="w-4 h-4 inline mr-1" />
                                                Não aceite
                                            </button>
                                        </div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notas / descrição (obrigatória para Não aceite)</label>
                                        <textarea
                                            v-model="proofForm.description"
                                            class="form-textarea w-full min-h-[80px]"
                                            placeholder="Ex.: Comprovativo ilegível; dados não conferem..."
                                            rows="3"
                                        />
                                        <div v-if="proofForm.accepted === true" class="mt-3">
                                            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor pago reconhecido</label>
                                            <input
                                                v-model.number="proofForm.paidAmount"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                class="form-input w-full"
                                            />
                                            <p
                                                v-if="selectedProofInstallment && proofForm.paidAmount < getInstallmentLateSummary(selectedProofInstallment).totalDue"
                                                class="text-xs text-amber-600 dark:text-amber-400 mt-1"
                                            >
                                                Valor inferior ao total com mora ({{ formatCurrency(getInstallmentLateSummary(selectedProofInstallment).totalDue) }}).
                                            </p>
                                        </div>
                                    </div>
                                    <div class="flex justify-end gap-2 pt-2">
                                        <button type="button" class="btn btn-outline-danger" :disabled="proofSubmitting" @click="closeProofModal">Fechar</button>
                                        <button
                                            type="button"
                                            class="btn btn-primary"
                                            :disabled="
                                                proofSubmitting ||
                                                proofReceiptsLoading ||
                                                proofForm.accepted === null ||
                                                (proofForm.accepted === false && !proofForm.description.trim()) ||
                                                proofReviewBlockedNoDocument
                                            "
                                            @click="saveProofAcceptance"
                                        >
                                            {{ proofSubmitting ? 'A guardar...' : 'Guardar' }}
                                        </button>
                                    </div>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>
        </Teleport>

        <!-- Modal Marcar como paga -->
        <Teleport to="body">
            <TransitionRoot appear :show="showMarkPaidModal" as="template">
                <Dialog as="div" class="relative z-[99]" @close="closeMarkPaidModal">
                <TransitionChild
                    as="template"
                    enter="duration-300 ease-out"
                    enter-from="opacity-0"
                    enter-to="opacity-100"
                    leave="duration-200 ease-in"
                    leave-from="opacity-100"
                    leave-to="opacity-0"
                >
                    <DialogOverlay class="fixed inset-0 bg-black/60" />
                </TransitionChild>
                <div class="fixed inset-0 overflow-y-auto">
                    <div class="flex min-h-full items-center justify-center px-4 py-6">
                        <TransitionChild
                            as="template"
                            enter="duration-300 ease-out"
                            enter-from="opacity-0 scale-95"
                            enter-to="opacity-100 scale-100"
                            leave="duration-200 ease-in"
                            leave-from="opacity-100 scale-100"
                            leave-to="opacity-0 scale-95"
                        >
                            <DialogPanel class="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-md text-black dark:text-white-dark">
                                <div class="flex items-center justify-between bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-12 rtl:pl-12">
                                    <h3 class="text-lg font-bold">
                                        Marcar como paga — Parcela {{ selectedMarkPaidInstallment ? selectedMarkPaidInstallment.installmentNumber : '' }}/{{ loan?.numberOfInstallments }}
                                    </h3>
                                    <button type="button" class="absolute top-3 ltr:right-3 rtl:left-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" @click="closeMarkPaidModal">
                                        <icon-x class="w-5 h-5" />
                                    </button>
                                </div>
                                <div class="p-5 space-y-4">
                                    <InstallmentPaymentSummary
                                        v-if="selectedMarkPaidInstallment"
                                        :installment="selectedMarkPaidInstallment"
                                        :currency-code="loan?.currencyCode"
                                        :format-currency="formatCurrency"
                                    />
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Data do pagamento *</label>
                                        <input v-model="markPaidForm.paidDate" type="date" class="form-input w-full" />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Valor pago *</label>
                                        <input v-model.number="markPaidForm.amount" type="number" step="0.01" min="0" class="form-input w-full" />
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Método de pagamento *</label>
                                        <select v-model="markPaidForm.paymentMethod" class="form-select w-full">
                                            <option value="">Selecione...</option>
                                            <option value="BANK_TRANSFER">Transferência bancária</option>
                                            <option value="CREDIT_CARD">Cartão de crédito</option>
                                            <option value="DEBIT_CARD">Cartão de débito</option>
                                            <option value="CASH">Dinheiro</option>
                                            <option value="PIX">PIX</option>
                                            <option value="OTHER">Outro</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Referência / Notas</label>
                                        <input v-model="markPaidForm.reference" type="text" class="form-input w-full" placeholder="Opcional" />
                                    </div>
                                    <div class="flex justify-end gap-2 pt-2">
                                        <button type="button" class="btn btn-outline-danger" @click="closeMarkPaidModal">Cancelar</button>
                                        <button
                                            type="button"
                                            class="btn btn-primary"
                                            :disabled="!markPaidForm.paidDate || !markPaidForm.amount || !markPaidForm.paymentMethod || markPaidSaving"
                                            @click="submitMarkAsPaid"
                                        >
                                            {{ markPaidSaving ? 'A guardar...' : 'Marcar como paga' }}
                                        </button>
                                    </div>
                                </div>
                            </DialogPanel>
                        </TransitionChild>
                    </div>
                </div>
            </Dialog>
        </TransitionRoot>
        </Teleport>
    </div>
</template>

<script lang="ts" setup>
import PageHeader from '@/components/layout/PageHeader.vue';
import LoanDisbursementPanel from '@/components/loans/LoanDisbursementPanel.vue';
import PaymentMethodCard from '@/components/loans/PaymentMethodCard.vue';
import InstallmentPaymentSummary from '@/components/loans/InstallmentPaymentSummary.vue';
import { calculateLateInterest } from '@/utils/late-interest.utils';
import { resolveCollectionStatusFromLate, type CollectionChatContext } from '@/utils/collection-chat.utils';
import { useCollectionChat } from '@/composables/use-collection-chat';
import { usePartnerScope } from '@/composables/use-partner-scope';
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useMeta } from '@/composables/use-meta';
import { useKrefasyStore } from '@/stores/index';
import { Loan } from '@/services/loans.service';
import { TabGroup, TabList, Tab, TabPanels, TabPanel, Dialog, TransitionRoot, TransitionChild, DialogPanel, DialogOverlay } from '@headlessui/vue';
import Swal from 'sweetalert2';
import IconCircleCheck from '@/components/icon/icon-circle-check.vue';
import IconPrinter from '@/components/icon/icon-printer.vue';
import IconDownload from '@/components/icon/icon-download.vue';
import IconEdit from '@/components/icon/icon-edit.vue';
import IconArrowLeft from '@/components/icon/icon-arrow-left.vue';
import IconCreditCard from '@/components/icon/icon-credit-card.vue';
import IconUsers from '@/components/icon/icon-users.vue';
import IconCalendar from '@/components/icon/icon-calendar.vue';
import IconListCheck from '@/components/icon/icon-list-check.vue';
import IconEye from '@/components/icon/icon-eye.vue';
import IconHome from '@/components/icon/icon-home.vue';
import IconSquareCheck from '@/components/icon/icon-square-check.vue';
import IconXCircle from '@/components/icon/icon-x-circle.vue';
import IconUserPlus from '@/components/icon/icon-user-plus.vue';
import IconShare from '@/components/icon/icon-share.vue';
import IconChecks from '@/components/icon/icon-checks.vue';
import IconFile from '@/components/icon/icon-file.vue';
import IconMapPin from '@/components/icon/icon-map-pin.vue';
import IconLink from '@/components/icon/icon-link.vue';
import IconDollarSign from '@/components/icon/icon-dollar-sign.vue';
import IconX from '@/components/icon/icon-x.vue';
import IconMenuChat from '@/components/icon/menu/icon-menu-chat.vue';
import { parcelsService } from '@/services/parcels.service';
import {
    getInstallmentPaymentReceipts,
    reviewInstallmentPayment,
    type InstallmentPaymentReceipt,
} from '@/services/installment-payments.service';
import { useLoanDecisionDialogs } from '@/composables/use-loan-decision-dialogs';
import {
    type CustomerPaymentMethod,
} from '@/utils/payment-method.utils';

// Definir interfaces para a nova estrutura da API
interface CustomerDetails {
    id: string;
    userId: string;
    fullName: string;
    email: string;
    phoneNumber: string;
    dateOfBirth: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    documentNumber: string;
    documentType: string;
    workAddress: string;
    companyName: string;
    realTimeLocationLatitude: number;
    realTimeLocationLongitude: number;
    locationTimestamp: string;
    referenceName: string;
    referenceRelationship: string;
    referencePhoneNumber: string;
    referenceEmail: string;
    applicantVideoUrl: string;
    instagram: string;
    facebook: string;
    createdAt: string;
    documents: Document[];
    defaultPaymentMethod?: CustomerPaymentMethod | null;
}

interface Document {
    id: string;
    fileName: string;
    originalFileName: string;
    createdAt: string;
    updatedAt?: string | null;
    userId: string;
    userName: string;
    documentTypeId: string;
    documentTypeName: string;
    downloadUrl: string;
}

interface Installment {
    id: string;
    installmentNumber: number;
    amount: number;
    dueDate: string;
    paidDate?: string | null;
    paidAmount?: number | null;
    isPaid: boolean;
    isOverdue: boolean;
    createdAt: string;
    paymentMethod?: string | null;
    url?: string | null;
    /** Nome legível do estado da parcela (ex.: Em Análise) */
    installmentStatusName?: string | null;
    statusName?: string | null;
    /** Código ou texto de estado vindo da API */
    installmentStatus?: string | null;
    status?: string | null;
    /** Quando a API enviar: estado do comprovativo (aceite/não aceite) */
    proofAccepted?: boolean | null;
    proofRejectedReason?: string | null;
}

/** Estado local do comprovativo (Aceite/Não aceite + descrição) por parcela */
interface ProofAcceptanceState {
    accepted: boolean;
    description: string;
}

interface ExtendedLoan extends Loan {
    loanNumber?: string;
    loanProductId?: string;
    loanProductName?: string;
    interestPeriodId?: string;
    interestPeriodName?: string;
    loanStatusId?: string;
    loanStatusName?: string;
    managerName?: string;
    requestedAmount?: number;
    approvedAmount?: number;
    numberOfInstallments?: number;
    startDate?: string;
    endDate?: string | null;
    rejectionReason?: string;
    notes?: string;
    installments?: Installment[];
    customerDetails?: CustomerDetails;
    currencyId?: string;
    currencyName?: string;
    currencySymbol?: string;
    currencyCode?: string;
}

useMeta({ title: 'Detalhes do Empréstimo' });

const LOAN_TAB = {
    PRODUTO: 0,
    CLIENTE: 1,
    ENVIO: 2,
    PARCELAS: 3,
} as const;

const route = useRoute();
const store = useKrefasyStore();
const { handleApprove, handleReject } = useLoanDecisionDialogs();
const { loading: collectionChatLoading, openCollectionChat } = useCollectionChat();
const { canAccessLoan } = usePartnerScope();

const loan = ref<ExtendedLoan | null>(null);
const loading = ref(false);
const error = ref('');
const accessDenied = ref(false);
const selectedTabIndex = ref<number>(LOAN_TAB.PRODUTO);
const installmentFilter = ref<'all' | 'paid' | 'unpaid' | 'overdue' | 'pending'>('all');
const installmentSortBy = ref<'number' | 'dueDate' | 'amount' | 'amount-asc'>('number');

// Modal Comprovativo
const showProofModal = ref(false);
const selectedProofInstallment = ref<Installment | null>(null);
const proofForm = ref<{ accepted: boolean | null; description: string; paidAmount: number }>({
    accepted: null,
    description: '',
    paidAmount: 0,
});
const proofAcceptanceMap = ref<Record<string, ProofAcceptanceState>>({});
const proofReceiptsLoading = ref(false);
const proofReceipts = ref<InstallmentPaymentReceipt[]>([]);
const proofReceiptsError = ref('');
const selectedReceiptId = ref<string | null>(null);
const proofSubmitting = ref(false);

// Modal Marcar como paga
const showMarkPaidModal = ref(false);
const selectedMarkPaidInstallment = ref<Installment | null>(null);
const markPaidForm = ref({ paidDate: '', amount: 0, paymentMethod: '', reference: '' });
const markPaidSaving = ref(false);

// Computed properties
const canApproveLoan = computed(() => {
    if (!loan.value) return false;

    const status = loan.value.loanStatusName || loan.value.status;

    // Só pode aprovar se estiver pendente
    return status === 'PENDING' || status === 'Pendente';
});

const canRejectLoan = computed(() => {
    if (!loan.value) return false;

    const status = loan.value.loanStatusName || loan.value.status;

    // Só pode rejeitar se estiver pendente
    return status === 'PENDING' || status === 'Pendente';
});

const groupedDocuments = computed(() => {
    if (!loan.value?.customerDetails?.documents) return {};

    return loan.value.customerDetails.documents.reduce((groups: { [key: string]: Document[] }, doc: Document) => {
        const docType = doc.documentTypeName || 'Outros';
        if (!groups[docType]) {
            groups[docType] = [];
        }
        groups[docType].push(doc);
        return groups;
    }, {});
});

const hasValidLocation = computed(() => {
    return loan.value?.customerDetails?.realTimeLocationLatitude !== null &&
           loan.value?.customerDetails?.realTimeLocationLatitude !== undefined &&
           loan.value?.customerDetails?.realTimeLocationLongitude !== null &&
           loan.value?.customerDetails?.realTimeLocationLongitude !== undefined &&
           !isNaN(loan.value?.customerDetails?.realTimeLocationLatitude) &&
           !isNaN(loan.value?.customerDetails?.realTimeLocationLongitude);
});


const paidInstallmentsCount = computed(() => {
    const installments = loan.value?.installments as Installment[] | undefined;
    if (!installments) return 0;
    return installments.filter((i) => i.isPaid).length;
});

const pendingInstallmentsCount = computed(() => {
    const installments = loan.value?.installments as Installment[] | undefined;
    if (!installments) return 0;
    return installments.filter((i) => !i.isPaid && !i.isOverdue).length;
});

const overdueInstallmentsCount = computed(() => {
    const installments = loan.value?.installments as Installment[] | undefined;
    if (!installments) return 0;
    return installments.filter((i) => !i.isPaid && getInstallmentLateSummary(i).isOverdue).length;
});

const overdueTotalDueAmount = computed(() => {
    const installments = loan.value?.installments as Installment[] | undefined;
    if (!installments) return 0;
    return installments.reduce((sum, inst) => {
        const late = getInstallmentLateSummary(inst);
        return late.isOverdue ? sum + late.totalDue : sum;
    }, 0);
});

function getInstallmentLateSummary(installment: Installment) {
    return calculateLateInterest(installment, loan.value?.currencyCode || 'AOA');
}

const canContactCustomer = computed(() => {
    const clientId = loan.value?.customerDetails?.id || loan.value?.customerId;
    const unpaid = (loan.value?.installments as Installment[] | undefined)?.some((i) => !i.isPaid);
    return Boolean(clientId && unpaid);
});

function buildInstallmentChatContext(installment: Installment): CollectionChatContext {
    const late = getInstallmentLateSummary(installment);
    return {
        clientId: loan.value?.customerDetails?.id || loan.value?.customerId || '',
        clientName: loan.value?.customerName || loan.value?.customerDetails?.fullName || 'Cliente',
        loanId: loan.value?.id || '',
        loanNumber: loan.value?.loanNumber,
        installmentNumber: installment.installmentNumber,
        dueDate: installment.dueDate,
        amount: installment.amount,
        lateInterest: late.lateInterest,
        totalDue: late.totalDue,
        daysOverdue: late.daysOverdue,
        isOverdue: late.isOverdue,
        collectionStatus: resolveCollectionStatusFromLate(late.daysOverdue, installment.dueDate),
        currencyCode: loan.value?.currencyCode,
        currencySymbol: loan.value?.currencySymbol,
    };
}

function openInstallmentCollectionChat(installment: Installment) {
    void openCollectionChat(buildInstallmentChatContext(installment));
}

function openPrimaryCollectionChat() {
    const installments = (loan.value?.installments as Installment[] | undefined) || [];
    const unpaid = installments.filter((i) => !i.isPaid);
    if (unpaid.length === 0) return;

    const overdue = unpaid.filter((i) => getInstallmentLateSummary(i).isOverdue);
    const candidates = overdue.length > 0 ? overdue : unpaid;
    const next = [...candidates].sort(
        (a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()
    )[0];

    openInstallmentCollectionChat(next);
}

/** Compara rótulos como "Em Análise", "Em analise", "Emanalise", UNDER_REVIEW */
function normalizeInstallmentStatusKey(raw: string): string {
    return raw
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[\s_\-]/g, '')
        .toLowerCase();
}

function isInstallmentUnderReview(installment: Installment): boolean {
    const candidates: string[] = [];
    if (installment.installmentStatusName) candidates.push(installment.installmentStatusName);
    if (installment.statusName) candidates.push(installment.statusName);
    if (installment.installmentStatus) candidates.push(installment.installmentStatus);
    if (installment.status) {
        const st = installment.status;
        if (!/^(PENDING|PAID|OVERDUE|PARTIALLY_PAID|ACTIVE|COMPLETED)$/i.test(st)) {
            candidates.push(st);
        }
    }
    for (const raw of candidates) {
        const key = normalizeInstallmentStatusKey(raw);
        if (key === 'emanalise' || key === 'underreview') return true;
    }
    return false;
}

/** Comprovativo / parcela rejeitada (ex.: status "Rejeitado", REJECTED) */
function isInstallmentRejected(installment: Installment): boolean {
    const candidates: string[] = [];
    if (installment.installmentStatusName) candidates.push(installment.installmentStatusName);
    if (installment.statusName) candidates.push(installment.statusName);
    if (installment.installmentStatus) candidates.push(installment.installmentStatus);
    if (installment.status) candidates.push(installment.status);
    for (const raw of candidates) {
        const key = normalizeInstallmentStatusKey(raw);
        if (
            key === 'rejeitado' ||
            key === 'rejected' ||
            key === 'naoaceite' ||
            key === 'notaccepted' ||
            key === 'proofrejected' ||
            key === 'comprovativorejeitado'
        ) {
            return true;
        }
    }
    return false;
}

/** Parcelas em que o comprovativo pode vir da API (em análise ou rejeitado) */
function installmentUsesProofReceiptsApi(installment: Installment): boolean {
    return isInstallmentUnderReview(installment) || isInstallmentRejected(installment);
}

/** Botão Ver comprovativo: URL direta, em análise ou rejeitado (comprovativo via API) */
function canViewComprovativo(installment: Installment): boolean {
    return !!installment?.url || installmentUsesProofReceiptsApi(installment);
}

const currentProofUrl = computed(() => {
    if (selectedReceiptId.value && proofReceipts.value.length > 0) {
        const r = proofReceipts.value.find((x) => x.id === selectedReceiptId.value);
        if (r?.downloadUrl) return r.downloadUrl;
    }
    return selectedProofInstallment.value?.url ?? null;
});

/** Pré-visualização como <img> com object-contain (evita iframe + scroll duplo para fotos) */
const isCurrentProofImage = computed(() => {
    const url = currentProofUrl.value;
    if (!url) return false;
    if (selectedReceiptId.value && proofReceipts.value.length > 0) {
        const r = proofReceipts.value.find((x) => x.id === selectedReceiptId.value);
        if (r?.contentType && /^image\//i.test(r.contentType)) return true;
    }
    return /\.(jpe?g|png|gif|webp|bmp|svg)(\?|#|$)/i.test(url);
});

/** URL para iframe: PDFs pedem vista “fit” quando o leitor suporta (#view=FitH) */
const currentProofPdfUrl = computed(() => {
    const url = currentProofUrl.value;
    if (!url || isCurrentProofImage.value) return url || '';
    let isPdf = /\.pdf(\?|#|$)/i.test(url);
    if (!isPdf && selectedReceiptId.value && proofReceipts.value.length > 0) {
        const r = proofReceipts.value.find((x) => x.id === selectedReceiptId.value);
        const ct = r?.contentType?.toLowerCase() ?? '';
        isPdf = ct === 'application/pdf' || ct === 'application/x-pdf';
    }
    if (!isPdf || url.includes('#')) return url;
    return `${url}#view=FitH`;
});

/** Nome sugerido para o ficheiro ao baixar (metadados da API ou último segmento da URL) */
const currentProofFileName = computed(() => {
    if (selectedReceiptId.value && proofReceipts.value.length > 0) {
        const r = proofReceipts.value.find((x) => x.id === selectedReceiptId.value);
        if (r?.originalFileName?.trim()) return r.originalFileName.trim();
    }
    const url = currentProofUrl.value;
    if (!url) return '';
    try {
        const u = new URL(url, typeof window !== 'undefined' ? window.location.origin : undefined);
        const seg = u.pathname.split('/').filter(Boolean).pop();
        if (seg) return decodeURIComponent(seg.split('?')[0] || seg);
    } catch {
        /* ignore */
    }
    const n = selectedProofInstallment.value?.installmentNumber;
    return n != null ? `comprovativo-parcela-${n}` : 'comprovativo';
});

function downloadCurrentProof() {
    const url = currentProofUrl.value;
    if (!url) return;
    const link = document.createElement('a');
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    const name = currentProofFileName.value;
    if (name) link.setAttribute('download', name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}

const proofReviewBlockedNoDocument = computed(() => {
    const inst = selectedProofInstallment.value;
    if (!inst) return false;
    const needsApi = installmentUsesProofReceiptsApi(inst) && !inst.url;
    return needsApi && !proofReceiptsLoading.value && proofReceipts.value.length === 0;
});

const filteredInstallments = computed(() => {
    const installments = loan.value?.installments as Installment[] | undefined;
    if (!installments || installments.length === 0) return [];

    let result = [...installments];

    // Aplicar filtro
    switch (installmentFilter.value) {
        case 'paid':
            result = result.filter((i) => i.isPaid);
            break;
        case 'unpaid':
            result = result.filter((i) => !i.isPaid);
            break;
        case 'overdue':
            result = result.filter((i) => i.isOverdue);
            break;
        case 'pending':
            result = result.filter((i) => !i.isPaid && !i.isOverdue);
            break;
        default:
            break;
    }

    // Aplicar ordenação
    switch (installmentSortBy.value) {
        case 'number':
            result.sort((a, b) => a.installmentNumber - b.installmentNumber);
            break;
        case 'dueDate':
            result.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());
            break;
        case 'amount':
            result.sort((a, b) => b.amount - a.amount);
            break;
        case 'amount-asc':
            result.sort((a, b) => a.amount - b.amount);
            break;
        default:
            break;
    }

    return result;
});

// Methods
const loadLoanDetails = async () => {
    try {
        loading.value = true;
        error.value = '';
        accessDenied.value = false;
        const loanId = route.params.id as string;

        const loanData = await store.fetchLoanById(loanId);
        if (!canAccessLoan(loanData as ExtendedLoan)) {
            loan.value = null;
            accessDenied.value = true;
            return;
        }
        loan.value = loanData;
    } catch (err: any) {
        error.value = err.message || 'Erro ao carregar detalhes do empréstimo';
        console.error('Erro ao carregar empréstimo:', err);
    } finally {
        loading.value = false;
    }
};

const getStatusBadgeClass = (status: string) => {
    switch (status) {
        case 'Aprovado':
        case 'APPROVED':
            return 'badge-outline-success';
        case 'Pendente':
        case 'PENDING':
            return 'badge-outline-warning';
        case 'Rejeitado':
        case 'REJECTED':
            return 'badge-outline-danger';
        case 'Ativo':
        case 'ACTIVE':
            return 'badge-outline-info';
        case 'Finalizado':
        case 'COMPLETED':
            return 'badge-outline-dark';
        case 'DEFAULTED':
        case 'Inadimplente':
            return 'badge-outline-danger';
        default:
            return 'badge-outline-secondary';
    }
};

const getStatusBorderClass = (status: string) => {
    switch (status) {
        case 'Aprovado':
        case 'APPROVED':
            return 'border-l-4 border-l-success';
        case 'Pendente':
        case 'PENDING':
            return 'border-l-4 border-l-warning';
        case 'Rejeitado':
        case 'REJECTED':
            return 'border-l-4 border-l-danger';
        case 'Ativo':
        case 'ACTIVE':
            return 'border-l-4 border-l-info';
        default:
            return 'border-l-4 border-l-gray-300 dark:border-l-gray-600';
    }
};

const getStatusLabel = (status: string) => {
    switch (status) {
        case 'APPROVED':
            return 'Aprovado';
        case 'PENDING':
            return 'Pendente';
        case 'REJECTED':
            return 'Rejeitado';
        case 'ACTIVE':
            return 'Ativo';
        case 'COMPLETED':
            return 'Finalizado';
        case 'DEFAULTED':
            return 'Inadimplente';
        case 'RESTRUCTURED':
            return 'Reestruturado';
        default:
            return status;
    }
};

const getDocumentTypeLabel = (docType: string) => {
    switch (docType) {
        case 'IDENTITY':
            return 'Identidade';
        case 'INCOME':
            return 'Comprovante de Renda';
        case 'BANK_STATEMENT':
            return 'Extrato Bancário';
        case 'COLLATERAL':
            return 'Garantia';
        case 'OTHER':
            return 'Outros';
        default:
            return docType;
    }
};

const getInstallmentStatusBadgeClass = (installment: Installment) => {
    if (installment.isPaid) return 'badge-outline-success';
    if (isInstallmentRejected(installment)) return 'badge-outline-danger';
    if (installment.isOverdue) return 'badge-outline-danger';
    if (isInstallmentUnderReview(installment)) return 'badge-outline-info';
    return 'badge-outline-warning';
};

const getInstallmentStatusLabel = (installment: Installment) => {
    if (installment.installmentStatusName?.trim()) return installment.installmentStatusName.trim();
    if (installment.statusName?.trim()) return installment.statusName.trim();
    if (isInstallmentRejected(installment)) {
        const raw = (installment.installmentStatus || installment.status || '').trim();
        if (raw) {
            const upper = raw.toUpperCase();
            if (upper === 'REJECTED' || upper === 'REJEITADO') return 'Rejeitado';
            if (!/^(PENDING|PAID|OVERDUE|PARTIALLY_PAID|ACTIVE|COMPLETED)$/i.test(raw)) return raw;
        }
        return 'Rejeitado';
    }
    if (installment.isPaid) return 'Pago';
    if (installment.isOverdue) return 'Atrasado';
    return 'Pendente';
};

const getInstallmentRowClass = (installment: Installment) => {
    const base = 'transition-colors';
    if (installment.isPaid) {
        return `${base} bg-green-50/50 dark:bg-green-900/10 border-l-4 border-l-green-500`;
    }
    if (isInstallmentRejected(installment)) {
        return `${base} bg-rose-50/50 dark:bg-rose-900/10 border-l-4 border-l-rose-600`;
    }
    if (installment.isOverdue) {
        return `${base} bg-red-50/50 dark:bg-red-900/10 border-l-4 border-l-red-500`;
    }
    if (isInstallmentUnderReview(installment)) {
        return `${base} bg-sky-50/50 dark:bg-sky-900/10 border-l-4 border-l-sky-500`;
    }
    return `${base} bg-amber-50/30 dark:bg-amber-900/5 border-l-4 border-l-amber-500`;
};

const getProofAcceptanceState = (installment: Installment): ProofAcceptanceState | null => {
    const local = proofAcceptanceMap.value[installment.id];
    if (local) return local;
    if (installment.proofAccepted !== undefined && installment.proofAccepted !== null) {
        return { accepted: installment.proofAccepted, description: installment.proofRejectedReason ?? '' };
    }
    return null;
};

const openProofModal = async (installment: Installment) => {
    selectedProofInstallment.value = installment;
    proofReceipts.value = [];
    proofReceiptsError.value = '';
    selectedReceiptId.value = null;
    const existing = proofAcceptanceMap.value[installment.id];
    proofForm.value = {
        accepted: existing ? existing.accepted : (installment.proofAccepted ?? null),
        description: existing?.description ?? installment.proofRejectedReason ?? '',
        paidAmount: getInstallmentLateSummary(installment).totalDue,
    };
    showProofModal.value = true;

    if (installmentUsesProofReceiptsApi(installment)) {
        proofReceiptsLoading.value = true;
        try {
            const list = await getInstallmentPaymentReceipts(installment.id);
            proofReceipts.value = list;
            if (list.length > 0) {
                selectedReceiptId.value = list[0].id;
            }
        } catch (err: any) {
            if (!installment.url) {
                proofReceiptsError.value = err.message || 'Erro ao carregar comprovativos';
            }
        } finally {
            proofReceiptsLoading.value = false;
        }
    }
};

const closeProofModal = () => {
    showProofModal.value = false;
    selectedProofInstallment.value = null;
    proofForm.value = { accepted: null, description: '', paidAmount: 0 };
    proofReceipts.value = [];
    proofReceiptsError.value = '';
    selectedReceiptId.value = null;
    proofReceiptsLoading.value = false;
};

const saveProofAcceptance = async () => {
    if (!selectedProofInstallment.value) return;
    if (proofForm.value.accepted === false && !proofForm.value.description.trim()) return;
    if (proofForm.value.accepted === null) return;
    if (proofReviewBlockedNoDocument.value) return;

    if (proofForm.value.accepted === true) {
        const totalDue = getInstallmentLateSummary(selectedProofInstallment.value).totalDue;
        const paidAmount = Number(proofForm.value.paidAmount) || 0;
        if (paidAmount < totalDue) {
            const confirm = await Swal.fire({
                title: 'Valor inferior ao total',
                html: `O valor reconhecido (${formatCurrency(paidAmount)}) é inferior ao total com mora (${formatCurrency(totalDue)}). Deseja continuar mesmo assim?`,
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Continuar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#dc3545',
            });
            if (!confirm.isConfirmed) return;
        }
    }

    const instId = selectedProofInstallment.value.id;
    proofSubmitting.value = true;
    try {
        await reviewInstallmentPayment(instId, {
            approved: proofForm.value.accepted === true,
            notes: proofForm.value.description.trim(),
            paidAmount: proofForm.value.accepted === true ? Number(proofForm.value.paidAmount) || 0 : 0,
        });
        delete proofAcceptanceMap.value[instId];
        closeProofModal();
        await loadLoanDetails();
        await Swal.fire({
            title: 'Guardado',
            text: 'Revisão do comprovativo registada com sucesso.',
            icon: 'success',
            timer: 2000,
            showConfirmButton: false,
        });
    } catch (err: any) {
        await Swal.fire({
            title: 'Erro',
            text: err.message || 'Não foi possível guardar a revisão.',
            icon: 'error',
            confirmButtonColor: '#dc3545',
        });
    } finally {
        proofSubmitting.value = false;
    }
};

const openMarkPaidModal = (installment: Installment) => {
    selectedMarkPaidInstallment.value = installment;
    const today = new Date().toISOString().slice(0, 10);
    markPaidForm.value = {
        paidDate: today,
        amount: getInstallmentLateSummary(installment).totalDue,
        paymentMethod: '',
        reference: `Pagamento manual em ${today}`
    };
    showMarkPaidModal.value = true;
};

const closeMarkPaidModal = () => {
    showMarkPaidModal.value = false;
    selectedMarkPaidInstallment.value = null;
    markPaidForm.value = { paidDate: '', amount: 0, paymentMethod: '', reference: '' };
};

const submitMarkAsPaid = async () => {
    const inst = selectedMarkPaidInstallment.value;
    if (!inst || !markPaidForm.value.paidDate || !markPaidForm.value.amount || !markPaidForm.value.paymentMethod) return;

    const totalDue = getInstallmentLateSummary(inst).totalDue;
    if (markPaidForm.value.amount < totalDue) {
        const confirm = await Swal.fire({
            title: 'Valor inferior ao total',
            html: `O valor pago (${formatCurrency(markPaidForm.value.amount)}) é inferior ao total com mora (${formatCurrency(totalDue)}). Deseja continuar?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Continuar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#dc3545',
        });
        if (!confirm.isConfirmed) return;
    }

    markPaidSaving.value = true;
    try {
        await parcelsService.markAsPaid(inst.id, {
            amount: markPaidForm.value.amount,
            paymentMethod: markPaidForm.value.paymentMethod,
            reference: markPaidForm.value.reference || `Pagamento manual em ${markPaidForm.value.paidDate}`
        });
        closeMarkPaidModal();
        await loadLoanDetails();
        await Swal.fire({ title: 'Sucesso', text: 'Parcela marcada como paga.', icon: 'success', confirmButtonColor: '#28a745' });
    } catch (err: any) {
        await Swal.fire({
            title: 'Erro',
            text: err.message || 'Não foi possível marcar a parcela como paga. Verifique se o ID da parcela corresponde à API de parcelas.',
            icon: 'error',
            confirmButtonColor: '#dc3545'
        });
    } finally {
        markPaidSaving.value = false;
    }
};

const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
};

const formatCurrency = (amount: number) => {
    if (!amount) {
        const symbol = loan.value?.currencySymbol || 'AOA';
        return `${symbol} 0,00`;
    }

    // Se temos informações de moeda da API, usar elas
    if (loan.value?.currencyCode && loan.value?.currencySymbol) {
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: loan.value.currencyCode,
            currencyDisplay: 'symbol'
        }).format(amount).replace(/^[^\d]*/, loan.value.currencySymbol + ' ');
    }

    // Fallback para AOA
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'AOA'
    }).format(amount);
};

const approveLoan = async () => {
    if (!loan.value) return;

    try {
        loading.value = true;
        await handleApprove(loan.value, async () => {
            await loadLoanDetails();
            selectedTabIndex.value = LOAN_TAB.ENVIO;
        });
    } finally {
        loading.value = false;
    }
};

const rejectLoan = async () => {
    if (!loan.value) return;

    try {
        loading.value = true;
        await handleReject(loan.value, loadLoanDetails);
    } finally {
        loading.value = false;
    }
};

const printLoan = () => {
    window.print();
};

const downloadDetails = () => {
    // Implementar export para PDF
    alert('Funcionalidade de export será implementada em breve');
};

const downloadDocument = (doc: Document) => {
    if (doc.downloadUrl) {
        window.open(doc.downloadUrl, '_blank');
    } else {
        alert(`Download do documento: ${doc.originalFileName}`);
    }
};

const previewDocument = (doc: Document) => {
    if (doc.downloadUrl) {
        // Abrir documento em nova janela para preview
        const previewWindow = window.open(doc.downloadUrl, '_blank', 'width=800,height=600');
        if (!previewWindow) {
            alert('Por favor, permita pop-ups para visualizar o documento');
        }
    } else {
        alert(`Preview do documento: ${doc.originalFileName} não disponível`);
    }
};

const getActionButtonText = () => {
    if (!loan.value) return 'N/A';

    const status = loan.value.loanStatusName || loan.value.status;

    switch (status) {
        case 'APPROVED':
        case 'Aprovado':
            return 'Empréstimo Aprovado';
        case 'REJECTED':
        case 'Rejeitado':
            return 'Empréstimo Rejeitado';
        case 'ACTIVE':
        case 'Ativo':
            return 'Empréstimo Ativo';
        case 'COMPLETED':
        case 'Finalizado':
            return 'Empréstimo Finalizado';
        case 'DEFAULTED':
        case 'Inadimplente':
            return 'Empréstimo Inadimplente';
        case 'RESTRUCTURED':
        case 'Reestruturado':
            return 'Empréstimo Reestruturado';
        default:
            return 'Status: ' + status;
    }
};

const openGoogleMaps = () => {
    if (!loan.value?.customerDetails) return;

    const lat = loan.value.customerDetails.realTimeLocationLatitude;
    const lng = loan.value.customerDetails.realTimeLocationLongitude;

    if (lat && lng && !isNaN(lat) && !isNaN(lng)) {
        const googleMapsUrl = `https://www.google.com/maps?q=${lat},${lng}&z=15`;
        window.open(googleMapsUrl, '_blank');
    } else {
        alert('Coordenadas de localização não válidas');
    }
};

onMounted(() => {
    if (route.query.tab === 'envio') {
        selectedTabIndex.value = LOAN_TAB.ENVIO;
    }
    loadLoanDetails();
});
</script>

<style scoped>
.tab-pill {
    @apply px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 outline-none;
}
.tab-pill-active {
    @apply bg-primary text-white shadow-sm;
}
.tab-pill-inactive {
    @apply text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800;
}
.detail-section {
    @apply rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900/20 overflow-hidden;
}
.detail-section-header {
    @apply px-5 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-800/40 flex items-center gap-2 font-semibold text-gray-800 dark:text-gray-200;
}
.detail-section-body {
    @apply p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3;
}
.detail-field {
    @apply rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5;
}
.detail-field-label {
    @apply text-xs text-gray-500 dark:text-gray-400 mb-0.5;
}
.detail-field-value {
    @apply text-sm font-semibold text-gray-900 dark:text-gray-100 break-all;
}
</style>
