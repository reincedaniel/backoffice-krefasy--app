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
                    <button v-if="loan" type="button" class="btn btn-success gap-2" @click="approveLoan">
                        <icon-square-check />
                        Aprovar
                    </button>

                    <button v-if="loan" type="button" class="btn btn-danger gap-2" @click="rejectLoan">
                        <icon-x-circle />
                        Rejeitar
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
                                        <h4 class="font-medium text-gray-800 dark:text-gray-200 mb-4 flex items-center">
                                            <icon-list-check class="w-5 h-5 mr-2" />
                                            Cronograma de Parcelas
                                        </h4>
                                        <div class="overflow-x-auto">
                                            <table class="table-striped w-full">
                                                <thead>
                                                    <tr>
                                                        <th>Parcela</th>
                                                        <th>Data Venc.</th>
                                                        <th>Valor Principal</th>
                                                        <th>Juros</th>
                                                        <th>Total</th>
                                                        <th>Status</th>
                                                        <th>Ações</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    <tr v-for="installment in loan.installments" :key="installment.id">
                                                        <td>{{ installment.installmentNumber }}/{{ loan.numberOfInstallments }}</td>
                                                        <td>{{ formatDate(installment.dueDate) }}</td>
                                                        <td>{{ formatCurrency(installment.principalAmount) }}</td>
                                                        <td>{{ formatCurrency(installment.interestAmount) }}</td>
                                                        <td>{{ formatCurrency(installment.totalAmount) }}</td>
                                                        <td>
                                                            <span class="badge" :class="getInstallmentStatusBadgeClass(installment.status)">
                                                                {{ installment.status }}
                                                            </span>
                                                        </td>
                                                        <td>
                                                            <button v-if="installment.status !== 'Pago'"
                                                                    class="text-primary hover:text-primary-dark"
                                                                    title="Visualizar detalhes">
                                                                <icon-eye class="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
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
    </div>
</template>

<script lang="ts" setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute } from 'vue-router';
import { useMeta } from '@/composables/use-meta';
import { useKrefasyStore } from '@/stores/index';
import { Loan } from '@/services/loans.service';
import { TabGroup, TabList, Tab, TabPanels, TabPanel } from '@headlessui/vue';
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
    installments?: any[];
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

// Computed properties
const canApproveLoan = computed(() => {
    return !!loan.value;
});

const canRejectLoan = computed(() => {
    return !!loan.value;
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

const getInstallmentStatusBadgeClass = (status: string) => {
    switch (status?.toLowerCase()) {
        case 'pago':
        case 'paid':
            return 'badge-outline-success';
        case 'pendente':
        case 'pending':
            return 'badge-outline-warning';
        case 'atrasado':
        case 'overdue':
            return 'badge-outline-danger';
        default:
            return 'badge-outline-secondary';
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

    if (confirm('Tem certeza que deseja aprovar este empréstimo?')) {
        try {
            loading.value = true;
            await store.approveLoan(loan.value.id, {
                approved: true,
                modifiedAmount: loan.value.amount,
            });
            await loadLoanDetails(); // Recarregar dados atualizados
        } catch (err: any) {
            alert('Erro ao aprovar empréstimo: ' + (err.message || 'Erro desconhecido'));
        } finally {
            loading.value = false;
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
