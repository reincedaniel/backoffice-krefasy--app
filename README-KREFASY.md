# 🏦 Backoffice Krefasy - Gestão de Créditos e Empréstimos

## 📋 Visão Geral

O **Backoffice Krefasy** é uma aplicação web desenvolvida com base no template **Vristo Vue** para gestão completa de créditos e empréstimos. Esta solução oferece uma interface administrativa robusta e intuitiva para gestores de instituições financeiras.

## 🚀 Tecnologias Utilizadas

- **Vue 3** com Composition API e TypeScript
- **Vite** como bundler e dev server
- **Tailwind CSS** para estilização responsiva
- **Pinia** para gerenciamento de estado
- **Vue Router 4** com proteção de rotas
- **ApexCharts** para visualizações e gráficos
- **Axios** para comunicação com API
- **i18n** para internacionalização (PT/EN)

## 🏗️ Arquitetura

### Estrutura de Pastas
```
src/
 ├─ services/           # Serviços de API
 │   ├─ api.ts         # Configuração base da API
 │   ├─ auth.service.ts # Autenticação
 │   ├─ clients.service.ts # Gestão de clientes
 │   ├─ loans.service.ts   # Gestão de empréstimos
 │   ├─ parcels.service.ts # Gestão de parcelas
 │   └─ messages.service.ts # Chat e mensagens
 ├─ stores/            # Stores Pinia
 │   ├─ index.ts       # Store principal
 │   └─ krefasy.store.ts # Store do Krefasy
 ├─ views/             # Páginas da aplicação
 │   ├─ auth/          # Autenticação
 │   ├─ dashboard/     # Dashboard principal
 │   ├─ clients/       # Gestão de clientes
 │   ├─ loans/         # Gestão de empréstimos
 │   ├─ parcels/       # Gestão de parcelas
 │   ├─ chat/          # Chat e atendimento
 │   ├─ reports/       # Relatórios
 │   └─ settings/      # Configurações
 └─ router/            # Configuração de rotas
```

## 🔐 Sistema de Autenticação

### Requisitos de Acesso
- **Apenas usuários com role "Admin"** podem acessar o backoffice
- Autenticação via JWT token
- Proteção de rotas automática
- Redirecionamento automático para login

### Endpoints de Autenticação
- `POST /auth/login` - Login do usuário
- `POST /auth/refresh` - Refresh do token
- `POST /auth/change-password` - Alterar senha
- `GET /auth/validate` - Validar token

## 📊 Dashboard Principal

### KPIs Exibidos
- **Total de Clientes**: Número total de clientes cadastrados
- **Empréstimos Ativos**: Quantidade de empréstimos em andamento
- **Valor Total Emprestado**: Montante total emprestado
- **Taxa de Inadimplência**: Percentual de empréstimos em atraso

### Gráficos
- **Evolução de Empréstimos**: Gráfico de área mensal
- **Distribuição por Produto**: Gráfico de rosca por tipo de crédito

### Tabelas Rápidas
- **Empréstimos Pendentes**: Solicitações aguardando aprovação
- **Parcelas Vencendo**: Parcelas com vencimento próximo

## 👥 Gestão de Clientes

### Funcionalidades
- ✅ Listagem com paginação e filtros
- ✅ Cadastro de novos clientes
- ✅ Edição de dados existentes
- ✅ Visualização de perfil completo
- ✅ Histórico de empréstimos
- ✅ Histórico de mensagens
- ✅ Exportação para Excel/CSV

### Filtros Disponíveis
- Status do cliente (Ativo, Inativo, Bloqueado)
- Tipo de documento (CPF, CNPJ, RG, Passaporte)
- Faixa de score de crédito
- Clientes com empréstimos ativos

## 💰 Gestão de Empréstimos

### Estados do Empréstimo
- **PENDING**: Aguardando aprovação
- **APPROVED**: Aprovado
- **REJECTED**: Rejeitado
- **ACTIVE**: Ativo (em andamento)
- **COMPLETED**: Liquidado
- **DEFAULTED**: Inadimplente
- **RESTRUCTURED**: Reestruturado

### Funcionalidades
- ✅ Aprovação/Rejeição de solicitações
- ✅ Modificação de condições
- ✅ Upload e verificação de documentos
- ✅ Disbursement (transferência de recursos)
- ✅ Reestruturação de empréstimos
- ✅ Simulação de crédito

### Produtos de Crédito
- **Pessoal**: Crédito pessoal
- **Empresarial**: Crédito para empresas
- **Hipotecário**: Financiamento imobiliário
- **Veículo**: Financiamento de veículos
- **Educação**: Financiamento educacional

## 📅 Gestão de Parcelas

### Estados da Parcela
- **PENDING**: Pendente
- **PAID**: Paga
- **OVERDUE**: Em atraso
- **PARTIALLY_PAID**: Parcialmente paga
- **RENEGOTIATED**: Renegociada
- **WRITTEN_OFF**: Baixada

### Funcionalidades
- ✅ Controle de vencimentos
- ✅ Registro de pagamentos
- ✅ Cálculo de juros de mora
- ✅ Renegociação de parcelas
- ✅ Lembretes automáticos
- ✅ Relatórios de cobrança

## 💬 Sistema de Chat/Atendimento

### Funcionalidades
- ✅ Conversas organizadas por cliente
- ✅ Atribuição a administradores
- ✅ Categorização por tipo de assunto
- ✅ Priorização de atendimento
- ✅ Upload de arquivos
- ✅ Histórico completo
- ✅ Notificações em tempo real

### Categorias de Atendimento
- **LOAN_INQUIRY**: Consultas sobre empréstimos
- **PAYMENT_ISSUE**: Problemas com pagamentos
- **TECHNICAL_SUPPORT**: Suporte técnico
- **COMPLAINT**: Reclamações
- **GENERAL**: Assuntos gerais

## 📈 Relatórios e Analytics

### Tipos de Relatórios
- **Clientes**: Cadastros, status, score de crédito
- **Empréstimos**: Aprovações, valores, inadimplência
- **Parcelas**: Pagamentos, atrasos, cobrança
- **Atendimento**: Conversas, tempo de resposta

### Formatos de Exportação
- **Excel (.xlsx)**: Relatórios detalhados
- **CSV**: Dados para análise externa
- **PDF**: Relatórios para impressão

## ⚙️ Configurações

### Gestão de Usuários
- ✅ Cadastro de administradores
- ✅ Definição de permissões
- ✅ Controle de acesso por módulo
- ✅ Logs de atividade

### Configurações Globais
- ✅ Taxas de juros por produto
- ✅ Prazos máximos de financiamento
- ✅ Limites de crédito
- ✅ Configurações de cobrança

## 🔧 Instalação e Configuração

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Acesso à API do Krefasy

### Instalação
```bash
# Clonar o repositório
git clone <repository-url>
cd vristo-vue-main

# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com as configurações da API

# Executar em desenvolvimento
npm run dev

# Build para produção
npm run build
```

### Variáveis de Ambiente
```env
# API Configuration
VITE_API_BASE_URL=https://credit-staging-api.krefasy.com/api/v1
VITE_APP_NAME=Krefasy Backoffice
VITE_APP_VERSION=1.0.0
```

## 🚀 Deploy

### Build de Produção
```bash
npm run build
```

### Docker (Recomendado)
```dockerfile
FROM node:18-alpine as build
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 📱 Responsividade

- ✅ **Desktop**: Interface completa com sidebar
- ✅ **Tablet**: Layout adaptativo
- ✅ **Mobile**: Menu hambúrguer e cards empilhados
- ✅ **Dark Mode**: Suporte completo a tema escuro

## 🌐 Internacionalização

- ✅ **Português (PT)**: Idioma padrão
- ✅ **Inglês (EN)**: Suporte completo
- ✅ **RTL**: Suporte a idiomas árabes

## 🔒 Segurança

- ✅ **JWT Authentication**: Tokens seguros
- ✅ **Role-based Access Control**: Controle por perfil
- ✅ **Route Protection**: Proteção automática de rotas
- ✅ **Input Validation**: Validação de formulários
- ✅ **XSS Protection**: Proteção contra ataques XSS

## 📊 Monitoramento

- ✅ **Error Logging**: Logs de erros automáticos
- ✅ **Performance Metrics**: Métricas de performance
- ✅ **User Activity**: Rastreamento de atividades
- ✅ **API Health**: Monitoramento da saúde da API

## 🤝 Contribuição

### Padrões de Código
- **TypeScript**: Tipagem estática obrigatória
- **Composition API**: Uso preferencial da Composition API
- **Tailwind CSS**: Classes utilitárias do Tailwind
- **ESLint + Prettier**: Formatação automática

### Estrutura de Commits
```
feat: adiciona nova funcionalidade
fix: corrige bug existente
docs: atualiza documentação
style: formatação de código
refactor: refatoração sem mudança funcional
test: adiciona ou corrige testes
chore: tarefas de manutenção
```

## 📞 Suporte

- **Documentação**: Este README
- **Issues**: GitHub Issues
- **Email**: suporte@krefasy.com
- **Telefone**: +55 (11) 99999-9999

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

**Desenvolvido com ❤️ pela equipe Krefasy**
