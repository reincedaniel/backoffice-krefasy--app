<template>
    <div>
        <ul class="flex space-x-2 rtl:space-x-reverse">
            <li><a href="javascript:;" class="text-primary hover:underline">Dashboard</a></li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <a href="/loans" class="text-primary hover:underline">Empréstimos</a>
            </li>
            <li class="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                <span>Detalhes</span>
            </li>
        </ul>

        <div class="pt-5">
            <!-- Loading State -->
            <div v-if="loading" class="panel">
                <div class="flex items-center justify-center py-12">
                    <div class="flex flex-col items-center gap-4">
                        <span class="animate-spin border-4 border-primary border-l-transparent rounded-full w-10 h-10 inline-block align-middle"></span>
                        <span class="text-sm text-gray-600 dark:text-gray-300">Carregando detalhes do empréstimo...</span>
                    </div>
                </div>
            </div>

            <!-- Error State -->
            <div v-else-if="error" class="panel">
                <div class="text-center py-12">
                    <div class="text-red-500 text-lg mb-4">Erro ao carregar empréstimo</div>
                    <p class="text-gray-600 dark:text-gray-400 mb-4">{{ error }}</p>
                    <button @click="loadLoanDetails" class="btn btn-primary">Tentar Novamente</button>
                </div>
            </div>

            <!-- Content -->
            <div v-else-if="loan">
                <!-- Action Buttons -->
                <div class="flex items-center lg:justify-end justify-center flex-wrap gap-4 mb-6">
                    <button
                        v-if="loan && canApproveLoan"
                        type="button"
                        class="btn btn-success gap-2"
                        @click="approveLoan"
                    >
                        <icon-square-check />
                        Aprovar
                    </button>

                    <button
                        v-if="loan && canRejectLoan"
                        type="button"
                        class="btn btn-danger gap-2"
                        @click="rejectLoan"
                    >
                        <icon-x-circle />
                        Rejeitar
                    </button>

                    <button
                        v-if="loan && !canApproveLoan && !canRejectLoan"
                        type="button"
                        class="btn btn-info gap-2"
                        disabled
                    >
                        <icon-square-check />
                        {{ getActionButtonText() }}
                    </button>

                    <router-link :to="`/loans/edit/${loan.id}`" class="btn btn-warning gap-2">
                        <icon-edit />
                        Editar
                    </router-link>

                    <router-link to="/loans" class="btn btn-secondary gap-2">
                        <icon-arrow-left />
                        Voltar
                    </router-link>
                </div>

                <!-- Main Panel -->
                <div class="panel">
                    <!-- Loan ID and Status Header -->
                    <div class="flex justify-between items-start px-4 mb-6">
                        <div>
                            <h3 class="text-2xl font-bold text-dark dark:text-white-light">
                                Empréstimo #{{ loan.loanNumber || loan.id }}
                            </h3>
                            <p class="text-gray-600 dark:text-gray-400 mt-1">
                                Cliente: {{ loan.customerName }}
                            </p>
                        </div>
                        <div class="flex flex-col items-end gap-2">
                            <div>
                                <span class="badge" :class="getStatusBadgeClass(loan.loanStatusName || loan.status)">
                                    {{ loan.loanStatusName || getStatusLabel(loan.status) }}
                                </span>
                            </div>
                            <div class="text-2xl font-bold text-primary">
                                {{ formatCurrency(loan.requestedAmount || loan.amount) }}
                            </div>
                        </div>
                    </div>

                    <!-- Tabs -->
                    <TabGroup as="div">
                        <TabList class="flex flex-wrap mt-3 border-b border-white-light dark:border-[#191e3a] px-4">
                            <Tab as="template" v-slot="{ selected }">
                                <a
                                    href="javascript:;"
                                    class="p-3.5 py-2 -mb-[1px] flex items-center border border-transparent hover:text-primary dark:hover:border-b-black !outline-none transition duration-300"
                                    :class="{ '!border-white-light !border-b-white text-primary dark:!border-[#191e3a] dark:!border-b-black': selected }"
                                >
                                    <icon-credit-card class="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                                    Produto
                                </a>
                            </Tab>
                            <Tab as="template" v-slot="{ selected }">
                                <a
                                    href="javascript:;"
                                    class="p-3.5 py-2 -mb-[1px] flex items-center border border-transparent hover:text-primary dark:hover:border-b-black !outline-none transition duration-300"
                                    :class="{ '!border-white-light !border-b-white text-primary dark:!border-[#191e3a] dark:!border-b-black': selected }"
                                >
                                    <icon-users class="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                                    Cliente
                                </a>
                            </Tab>
                            <Tab as="template" v-slot="{ selected }">
                                <a
                                    href="javascript:;"
                                    class="p-3.5 py-2 -mb-[1px] flex items-center border border-transparent hover:text-primary dark:hover:border-b-black !outline-none transition duration-300"
                                    :class="{ '!border-white-light !border-b-white text-primary dark:!border-[#191e3a] dark:!border-b-black': selected }"
                                >
                                    <icon-list-check class="w-5 h-5 ltr:mr-2 rtl:ml-2" />
                                    Parcelas
                                </a>
                            </Tab>
                        </TabList>

                        <TabPanels class="pt-5 flex-1">
                            <!-- Tab Produto -->
                            <TabPanel>
                                <div class="p-6 space-y-6">
                                    <!-- Informações do Produto -->
                                    <div class="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                                        <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                                            <icon-credit-card class="w-4 h-4 mr-2" />
                                            Detalhes do Produto
                                        </h5>
                                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Nome do Produto:</span>
                                                <span class="font-semibold">{{ loan.loanProductName || 'N/A' }}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Valor Solicitado:</span>
                                                <span class="font-semibold text-lg">{{ formatCurrency(loan.requestedAmount || loan.amount) }}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Valor Aprovado:</span>
                                                <span class="font-semibold">
                                                    {{ loan.approvedAmount ? formatCurrency(loan.approvedAmount) : loan.approvedAmount }}
                                                </span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Taxa de Juros:</span>
                                                <span class="font-semibold">{{ loan.interestRate }}% {{ loan.interestPeriodName || 'ao mês' }}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Período de Juros:</span>
                                                <span class="font-semibold">{{ loan.interestPeriodName || 'N/A' }}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Número de Parcelas:</span>
                                                <span class="font-semibold">{{ loan.numberOfInstallments || loan.term }} parcelas</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Pagamento:</span>
                                                <span class="font-semibold">{{ formatCurrency(loan.monthlyPayment) }}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Total a Pagar:</span>
                                                <span class="font-semibold text-lg text-primary">{{ formatCurrency(loan.totalAmount) }}</span>
                                            </div>
                                            <div v-if="loan.currencyName" class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Moeda:</span>
                                                <span class="font-semibold">{{ loan.currencyName }} ({{ loan.currencySymbol || loan.currencyCode }})</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Informações de Data -->
                                    <div class="mt-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-lg">
                                        <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                                            <icon-calendar class="w-4 h-4 mr-2" />
                                            Datas do Empréstimo
                                        </h5>
                                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Data de Criação:</span>
                                                <span class="font-semibold">{{ formatDate(loan.createdAt) }}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Data de Início:</span>
                                                <span class="font-semibold">{{ loan.startDate ? formatDate(loan.startDate) : 'Não definida' }}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Data Final:</span>
                                                <span class="font-semibold">{{ loan.endDate ? formatDate(loan.endDate) : 'Em andamento' }}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Última Atualização:</span>
                                                <span class="font-semibold">{{ loan.updatedAt ? formatDate(loan.updatedAt) : 'N/A' }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Motivo de Rejeição se aplicável -->
                                    <div v-if="loan.rejectionReason" class="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded">
                                        <div class="text-white-dark text-sm mb-1">Motivo da Rejeição:</div>
                                        <div class="text-red-700 dark:text-red-300">{{ loan.rejectionReason }}</div>
                                    </div>
                                </div>
                            </TabPanel>

                            <!-- Tab Cliente -->
                            <TabPanel>
                                <div class="p-6 space-y-6">
                                    <!-- Informações Básicas -->
                                    <div class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                                        <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                                            <icon-users class="w-4 h-4 mr-2" />
                                            Informações Básicas
                                        </h5>
                                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Nome Completo:</span>
                                                <span class="font-semibold">{{ loan.customerDetails?.fullName || loan.customerName }}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Email:</span>
                                                <span class="font-semibold">{{ loan.customerDetails?.email || loan.customerEmail }}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Telefone:</span>
                                                <span class="font-semibold">{{ loan.customerDetails?.phoneNumber || 'N/A' }}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Data de Nascimento:</span>
                                                <span class="font-semibold">{{ loan.customerDetails?.dateOfBirth ? formatDate(loan.customerDetails.dateOfBirth) : 'N/A' }}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Tipo de Documento:</span>
                                                <span class="font-semibold">{{ loan.customerDetails?.documentType || 'N/A' }}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Número do Documento:</span>
                                                <span class="font-mono text-sm">{{ loan.customerDetails?.documentNumber || 'N/A' }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Endereço -->
                                    <div class="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg" v-if="loan.customerDetails && (loan.customerDetails.address || loan.customerDetails.city || loan.customerDetails.state)">
                                        <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                                            <icon-home class="w-4 h-4 mr-2" />
                                            Endereço Residencial
                                        </h5>
                                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div v-if="loan.customerDetails.address" class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Endereço:</span>
                                                <span class="font-semibold">{{ loan.customerDetails.address }}</span>
                                            </div>
                                            <div v-if="loan.customerDetails.city" class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Cidade:</span>
                                                <span class="font-semibold">{{ loan.customerDetails.city }}</span>
                                            </div>
                                            <div v-if="loan.customerDetails.state" class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Estado/Província:</span>
                                                <span class="font-semibold">{{ loan.customerDetails.state }}</span>
                                            </div>
                                            <div v-if="loan.customerDetails.country" class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">País:</span>
                                                <span class="font-semibold">{{ loan.customerDetails.country }}</span>
                                            </div>
                                            <div v-if="loan.customerDetails.postalCode" class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Código Postal:</span>
                                                <span class="font-semibold">{{ loan.customerDetails.postalCode }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Localização GPS -->
                                    <div class="bg-orange-50 dark:bg-orange-900/20 p-4 rounded-lg" v-if="loan.customerDetails && hasValidLocation">
                                        <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                                            <icon-map-pin class="w-4 h-4 mr-2" />
                                            Localização GPS
                                        </h5>
                                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Latitude:</span>
                                                <span class="font-mono text-sm">{{ loan.customerDetails.realTimeLocationLatitude }}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Longitude:</span>
                                                <span class="font-mono text-sm">{{ loan.customerDetails.realTimeLocationLongitude }}</span>
                                            </div>
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Capturado em:</span>
                                                <span class="font-semibold">{{ formatDate(loan.customerDetails.locationTimestamp) }}</span>
                                            </div>
                                        </div>
                                        <div class="mt-3">
                                            <button
                                                @click="openGoogleMaps"
                                                class="btn btn-primary btn-sm gap-2 hover:shadow-md transition-shadow"
                                            >
                                                <icon-link class="w-4 h-4" />
                                                Ver no Google Maps
                                            </button>
                                        </div>
                                    </div>

                                    <!-- Informações Profissionais -->
                                    <div class="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg" v-if="loan.customerDetails && (loan.customerDetails.workAddress || loan.customerDetails.companyName)">
                                        <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                                            <icon-square-check class="w-4 h-4 mr-2" />
                                            Informações Profissionais
                                        </h5>
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div v-if="loan.customerDetails.companyName" class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Empresa:</span>
                                                <span class="font-semibold">{{ loan.customerDetails.companyName }}</span>
                                            </div>
                                            <div v-if="loan.customerDetails.workAddress" class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Endereço de Trabalho:</span>
                                                <span class="font-semibold">{{ loan.customerDetails.workAddress }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Referências -->
                                    <div class="bg-yellow-50 dark:bg-yellow-900/20 p-4 rounded-lg" v-if="loan.customerDetails && loan.customerDetails.referenceName">
                                        <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                                            <icon-user-plus class="w-4 h-4 mr-2" />
                                            Referências
                                        </h5>
                                        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            <div class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Nome:</span>
                                                <span class="font-semibold">{{ loan.customerDetails.referenceName }}</span>
                                            </div>
                                            <div v-if="loan.customerDetails.referenceRelationship" class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Relacionamento:</span>
                                                <span class="font-semibold">{{ loan.customerDetails.referenceRelationship }}</span>
                                            </div>
                                            <div v-if="loan.customerDetails.referencePhoneNumber" class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Telefone:</span>
                                                <span class="font-semibold">{{ loan.customerDetails.referencePhoneNumber }}</span>
                                            </div>
                                            <div v-if="loan.customerDetails.referenceEmail" class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Email:</span>
                                                <span class="font-semibold">{{ loan.customerDetails.referenceEmail }}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Redes Sociais -->
                                    <div class="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg" v-if="loan.customerDetails && (loan.customerDetails.instagram || loan.customerDetails.facebook)">
                                        <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                                            <icon-share class="w-4 h-4 mr-2" />
                                            Redes Sociais
                                        </h5>
                                        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            <div v-if="loan.customerDetails.instagram" class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Instagram:</span>
                                                <a :href="loan.customerDetails.instagram" target="_blank" class="font-semibold text-primary hover:underline">
                                                    {{ loan.customerDetails.instagram }}
                                                </a>
                                            </div>
                                            <div v-if="loan.customerDetails.facebook" class="flex items-center gap-2">
                                                <span class="text-white-dark text-sm">Facebook:</span>
                                                <a :href="loan.customerDetails.facebook" target="_blank" class="font-semibold text-primary hover:underline">
                                                    {{ loan.customerDetails.facebook }}
                                                </a>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Gerente Responsável -->
                                    <div v-if="loan.managerName" class="bg-indigo-50 dark:bg-indigo-900/20 p-4 rounded-lg">
                                        <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-3 flex items-center">
                                            <icon-checks class="w-4 h-4 mr-2" />
                                            Gerenciamento
                                        </h5>
                                        <div class="flex items-center gap-2">
                                            <span class="text-white-dark text-sm">Gerente Responsável:</span>
                                            <span class="font-semibold">{{ loan.managerName }}</span>
                                        </div>
                                    </div>

                                    <!-- Documentos do Cliente -->
                                    <div v-if="loan.customerDetails?.documents && loan.customerDetails.documents.length > 0" class="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-lg">
                                        <h5 class="font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                                            <icon-file class="w-4 h-4 mr-2" />
                                            Documentos do Cliente
                                        </h5>

                                        <!-- Organizar documentos por tipo -->
                                        <div v-for="(docGroup, docType) in groupedDocuments" :key="docType" class="mb-4">
                                            <h6 class="font-medium text-sm text-gray-700 dark:text-gray-300 mb-2">{{ docType }}</h6>
                                            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                <div v-for="doc in docGroup" :key="doc.id"
                                                     class="flex flex-col justify-between p-3 bg-white dark:bg-gray-700 rounded border hover:shadow-md transition-shadow">
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
                                </div>
                            </TabPanel>

                            <!-- Tab Parcelas -->
                            <TabPanel>
                                <div class="p-6">
                                    <!-- Cronograma de Parcelas -->
                                    <div v-if="loan.installments && loan.installments.length > 0">
                                        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
                                            <h4 class="font-medium text-gray-800 dark:text-gray-200 flex items-center">
                                                <icon-list-check class="w-5 h-5 mr-2" />
                                                Cronograma de Parcelas
                                            </h4>
                                            <!-- Filtros -->
                                            <div class="flex flex-wrap gap-2 items-center">
                                                <span class="text-sm text-white-dark">Filtrar:</span>
                                                <select
                                                    v-model="installmentFilter"
                                                    class="form-select form-select-sm w-auto min-w-[140px]"
                                                >
                                                    <option value="all">Todas</option>
                                                    <option value="paid">Pagas</option>
                                                    <option value="unpaid">Não pagas</option>
                                                    <option value="overdue">Em atraso</option>
                                                    <option value="pending">Pendentes (não atrasadas)</option>
                                                </select>
                                                <select
                                                    v-model="installmentSortBy"
                                                    class="form-select form-select-sm w-auto min-w-[130px]"
                                                >
                                                    <option value="number">Por número</option>
                                                    <option value="dueDate">Por vencimento</option>
                                                    <option value="amount">Por valor (maior)</option>
                                                    <option value="amount-asc">Por valor (menor)</option>
                                                </select>
                                            </div>
                                        </div>

                                        <!-- Resumo das parcelas -->
                                        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                                            <div class="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                                                <div class="text-xs text-white-dark">Total</div>
                                                <div class="font-semibold">{{ loan.installments.length }} parcelas</div>
                                            </div>
                                            <div class="p-3 rounded-lg bg-green-50 dark:bg-green-900/20">
                                                <div class="text-xs text-white-dark">Pagas</div>
                                                <div class="font-semibold text-green-700 dark:text-green-300">{{ paidInstallmentsCount }}</div>
                                            </div>
                                            <div class="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20">
                                                <div class="text-xs text-white-dark">Pendentes</div>
                                                <div class="font-semibold text-amber-700 dark:text-amber-300">{{ pendingInstallmentsCount }}</div>
                                            </div>
                                            <div class="p-3 rounded-lg bg-red-50 dark:bg-red-900/20">
                                                <div class="text-xs text-white-dark">Em atraso</div>
                                                <div class="font-semibold text-red-700 dark:text-red-300">{{ overdueInstallmentsCount }}</div>
                                            </div>
                                        </div>

                                        <div class="overflow-x-auto">
                                            <table class="table w-full">
                                                <thead>
                                                    <tr>
                                                        <th>Parcela</th>
                                                        <th>Valor</th>
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
                                                                v-if="hasComprovativo(installment)"
                                                                class="ml- inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
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
                                                                <template v-if="hasComprovativo(installment)">
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
                                                                </template>
                                                                <span v-if="!hasComprovativo(installment) && installment.isPaid" class="text-white-dark">—</span>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>

                                        <!-- Mensagem quando filtro não retorna resultados -->
                                        <div v-if="filteredInstallments.length === 0" class="text-center py-8 text-white-dark">
                                            Nenhuma parcela encontrada com os filtros selecionados.
                                        </div>
                                    </div>

                                    <!-- Mensagem quando não há parcelas -->
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
            </div>
        </div>

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
                            <DialogPanel class="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-2xl text-black dark:text-white-dark">
                                <div class="flex items-center justify-between bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-12 rtl:pl-12">
                                    <h3 class="text-lg font-bold">
                                        Comprovativo — Parcela {{ selectedProofInstallment ? selectedProofInstallment.installmentNumber : '' }}/{{ loan?.numberOfInstallments }}
                                    </h3>
                                    <button type="button" class="absolute top-3 ltr:right-3 rtl:left-3 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300" @click="closeProofModal">
                                        <icon-x class="w-5 h-5" />
                                    </button>
                                </div>
                                <div class="p-5 space-y-4">
                                    <div v-if="selectedProofInstallment?.url" class="rounded-lg border border-white-dark/20 overflow-hidden bg-gray-100 dark:bg-gray-800">
                                        <div class="h-[320px] flex flex-col">
                                            <iframe
                                                :src="selectedProofInstallment?.url"
                                                class="flex-1 w-full min-h-0"
                                                title="Comprovativo de pagamento"
                                            />
                                            <a
                                                :href="selectedProofInstallment?.url"
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                class="inline-flex items-center gap-1 p-2 text-sm text-primary hover:underline"
                                            >
                                                <icon-link class="w-4 h-4" />
                                                Abrir num separador
                                            </a>
                                        </div>
                                    </div>
                                    <div v-else class="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-white-dark">
                                        Sem URL de comprovativo disponível.
                                    </div>
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
                                        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Descrição (obrigatória para Não aceite)</label>
                                        <textarea
                                            v-model="proofForm.description"
                                            class="form-textarea w-full min-h-[80px]"
                                            placeholder="Ex.: Comprovativo ilegível; dados não conferem..."
                                            rows="3"
                                        />
                                    </div>
                                    <div class="flex justify-end gap-2 pt-2">
                                        <button type="button" class="btn btn-outline-danger" @click="closeProofModal">Fechar</button>
                                        <button
                                            type="button"
                                            class="btn btn-primary"
                                            :disabled="proofForm.accepted === null || (proofForm.accepted === false && !proofForm.description.trim())"
                                            @click="saveProofAcceptance"
                                        >
                                            Guardar
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
                                    <p class="text-sm text-white-dark">
                                        Valor da parcela: <strong>{{ selectedMarkPaidInstallment ? formatCurrency(selectedMarkPaidInstallment.amount) : '' }}</strong>
                                    </p>
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
import IconX from '@/components/icon/icon-x.vue';
import { parcelsService } from '@/services/parcels.service';

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
    customerId?: string;
    managerId?: string | null;
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

const route = useRoute();
const store = useKrefasyStore();

const loan = ref<ExtendedLoan | null>(null);
const loading = ref(false);
const error = ref('');
const installmentFilter = ref<'all' | 'paid' | 'unpaid' | 'overdue' | 'pending'>('all');
const installmentSortBy = ref<'number' | 'dueDate' | 'amount' | 'amount-asc'>('number');

// Modal Comprovativo
const showProofModal = ref(false);
const selectedProofInstallment = ref<Installment | null>(null);
const proofForm = ref<{ accepted: boolean | null; description: string }>({ accepted: null, description: '' });
const proofAcceptanceMap = ref<Record<string, ProofAcceptanceState>>({});

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

// Installments computed
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
    return installments.filter((i) => i.isOverdue).length;
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
        const loanId = route.params.id as string;

        const loanData = await store.fetchLoanById(loanId);
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
        case 'APPROVED':
            return 'badge-outline-success';
        case 'PENDING':
            return 'badge-outline-warning';
        case 'REJECTED':
            return 'badge-outline-danger';
        case 'ACTIVE':
            return 'badge-outline-info';
        case 'COMPLETED':
            return 'badge-outline-dark';
        case 'DEFAULTED':
            return 'badge-outline-danger';
        default:
            return 'badge-outline-secondary';
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
    if (installment.isOverdue) return 'badge-outline-danger';
    return 'badge-outline-warning';
};

const getInstallmentStatusLabel = (installment: Installment) => {
    if (installment.isPaid) return 'Pago';
    if (installment.isOverdue) return 'Atrasado';
    return 'Pendente';
};

const getInstallmentRowClass = (installment: Installment) => {
    const base = 'transition-colors';
    if (installment.isPaid) {
        return `${base} bg-green-50/50 dark:bg-green-900/10 border-l-4 border-l-green-500`;
    }
    if (installment.isOverdue) {
        return `${base} bg-red-50/50 dark:bg-red-900/10 border-l-4 border-l-red-500`;
    }
    return `${base} bg-amber-50/30 dark:bg-amber-900/5 border-l-4 border-l-amber-500`;
};

const hasComprovativo = (installment: Installment) => !!installment?.url;

const getProofAcceptanceState = (installment: Installment): ProofAcceptanceState | null => {
    const local = proofAcceptanceMap.value[installment.id];
    if (local) return local;
    if (installment.proofAccepted !== undefined && installment.proofAccepted !== null) {
        return { accepted: installment.proofAccepted, description: installment.proofRejectedReason ?? '' };
    }
    return null;
};

const openProofModal = (installment: Installment) => {
    selectedProofInstallment.value = installment;
    const existing = proofAcceptanceMap.value[installment.id];
    proofForm.value = {
        accepted: existing ? existing.accepted : (installment.proofAccepted ?? null),
        description: existing?.description ?? installment.proofRejectedReason ?? ''
    };
    showProofModal.value = true;
};

const closeProofModal = () => {
    showProofModal.value = false;
    selectedProofInstallment.value = null;
    proofForm.value = { accepted: null, description: '' };
};

const saveProofAcceptance = () => {
    if (!selectedProofInstallment.value) return;
    if (proofForm.value.accepted === false && !proofForm.value.description.trim()) return;
    proofAcceptanceMap.value[selectedProofInstallment.value.id] = {
        accepted: proofForm.value.accepted === true,
        description: proofForm.value.description.trim()
    };
    // TODO: chamar API quando existir endpoint (ex.: PATCH /loans/:id/installments/:installmentId/proof)
    closeProofModal();
    Swal.fire({ title: 'Guardado', text: 'Decisão do comprovativo guardada.', icon: 'success', timer: 2000, showConfirmButton: false });
};

const openMarkPaidModal = (installment: Installment) => {
    selectedMarkPaidInstallment.value = installment;
    const today = new Date().toISOString().slice(0, 10);
    markPaidForm.value = {
        paidDate: today,
        amount: installment.amount,
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

    const { value: stripeAccountId } = await Swal.fire({
        title: 'Aprovar Empréstimo com Stripe',
        text: 'Por favor, informe o Stripe Account ID para prosseguir com a aprovação:',
        input: 'text',
        inputLabel: 'Stripe Account ID',
        inputPlaceholder: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        inputValue: '08de0395-27f3-40af-860d-b218143bf0e0',
        inputValidator: (value) => {
            if (!value) {
                return 'Stripe Account ID é obrigatório!';
            }
            // Validação básica de UUID
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            if (!uuidRegex.test(value)) {
                return 'Formato inválido. Use um UUID válido.';
            }
            return null;
        },
        showCancelButton: true,
        confirmButtonText: 'Aprovar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#6c757d',
        icon: 'question'
    });

    if (stripeAccountId) {
        const result = await Swal.fire({
            title: 'Confirmar Aprovação',
            text: `Tem certeza que deseja aprovar este empréstimo de ${formatCurrency(loan.value.requestedAmount || loan.value.amount)} com Stripe?`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Sim, aprovar!',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#28a745',
            cancelButtonColor: '#6c757d'
        });

        if (result.isConfirmed) {
            try {
                loading.value = true;
                await store.approveWithStripe(loan.value.id, stripeAccountId);
                await loadLoanDetails(); // Recarregar dados atualizados

                await Swal.fire({
                    title: 'Sucesso!',
                    text: 'Empréstimo aprovado com sucesso!',
                    icon: 'success',
                    confirmButtonColor: '#28a745'
                });
            } catch (err: any) {
                await Swal.fire({
                    title: 'Erro!',
                    text: 'Erro ao aprovar empréstimo: ' + (err.message || 'Erro desconhecido'),
                    icon: 'error',
                    confirmButtonColor: '#dc3545'
                });
            } finally {
                loading.value = false;
            }
        }
    }
};

const rejectLoan = async () => {
    if (!loan.value) return;

    const reason = prompt('Por favor, informe o motivo da rejeição:');
    if (reason && confirm('Tem certeza que deseja rejeitar este empréstimo?')) {
        try {
            loading.value = true;
            // Por enquanto usando approveLoan com approved: false até o método rejectLoan ser implementado na store
            await store.approveLoan(loan.value.id, {
                approved: false,
                rejectionReason: reason,
                modifiedAmount: loan.value.amount,
            });
            await loadLoanDetails(); // Recarregar dados atualizados
        } catch (err: any) {
            alert('Erro ao rejeitar empréstimo: ' + (err.message || 'Erro desconhecido'));
        } finally {
            loading.value = false;
        }
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
    loadLoanDetails();
});
</script>
