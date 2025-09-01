#!/bin/bash

# Krefasy Backoffice Installation Script
# Este script instala e configura o Backoffice do Krefasy

set -e

echo "🚀 Iniciando instalação do Backoffice Krefasy..."

# Verificar se o Node.js está instalado
if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale o Node.js 18+ primeiro."
    echo "📥 Download: https://nodejs.org/"
    exit 1
fi

# Verificar versão do Node.js
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js versão 18+ é necessária. Versão atual: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) encontrado"

# Verificar se o npm está instalado
if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor, instale o npm primeiro."
    exit 1
fi

echo "✅ npm $(npm -v) encontrado"

# Instalar dependências
echo "📦 Instalando dependências..."
npm install

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
    echo "📝 Criando arquivo .env..."
    cp env.example .env
    echo "⚠️  Por favor, edite o arquivo .env com suas configurações antes de continuar."
    echo "🔧 Configurações importantes:"
    echo "   - VITE_API_BASE_URL: URL da API do Krefasy"
    echo "   - VITE_APP_NAME: Nome da aplicação"
    echo "   - VITE_ENABLE_DEBUG_MODE: Modo debug"
    read -p "Pressione Enter para continuar após editar o .env..."
else
    echo "✅ Arquivo .env já existe"
fi

# Verificar se o Docker está instalado (opcional)
if command -v docker &> /dev/null; then
    echo "✅ Docker encontrado"
    echo "🐳 Para usar Docker, execute: docker-compose up -d"
else
    echo "ℹ️  Docker não encontrado. Para usar Docker, instale primeiro."
fi

# Verificar se o Git está instalado
if command -v git &> /dev/null; then
    echo "✅ Git encontrado"

    # Configurar git hooks se existirem
    if [ -d .git/hooks ]; then
        echo "🔧 Configurando Git hooks..."
        npm run prepare 2>/dev/null || echo "ℹ️  Git hooks não configurados"
    fi
else
    echo "ℹ️  Git não encontrado. Recomendado para controle de versão."
fi

# Criar diretórios necessários
echo "📁 Criando diretórios..."
mkdir -p logs
mkdir -p dist

# Verificar permissões
echo "🔐 Verificando permissões..."
chmod +x install.sh

echo ""
echo "🎉 Instalação concluída com sucesso!"
echo ""
echo "📋 Próximos passos:"
echo "1. Edite o arquivo .env com suas configurações"
echo "2. Execute 'npm run dev' para desenvolvimento"
echo "3. Execute 'npm run build' para produção"
echo "4. Para Docker: 'docker-compose up -d'"
echo ""
echo "🌐 Acesse: http://localhost:3000 (desenvolvimento) ou http://localhost (Docker)"
echo ""
echo "📚 Documentação: README-KREFASY.md"
echo "🐛 Suporte: GitHub Issues ou contato direto"
echo ""
echo "Boa sorte com o Backoffice Krefasy! 🚀"
