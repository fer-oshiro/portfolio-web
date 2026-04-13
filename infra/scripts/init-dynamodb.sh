#!/bin/bash

# Script para inicializar DynamoDB local com tabelas
# Este script aguarda o DynamoDB ficar pronto e cria a tabela 'connections'

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Variáveis
export AWS_ACCESS_KEY_ID=fakeMyKeyId
export AWS_SECRET_ACCESS_KEY=fakeSecretAccessKey
export AWS_DEFAULT_REGION=localhost

DYNAMODB_HOST=${DYNAMODB_HOST:-localhost}
DYNAMODB_PORT=${DYNAMODB_PORT:-8000}
AWS_REGION=${AWS_REGION:-us-east-1}
MAX_RETRIES=30
RETRY_DELAY=2

echo "${YELLOW}🔄 Iniciando script de setup do DynamoDB Local...${NC}"

# Função para aguardar DynamoDB estar pronto
wait_for_dynamodb() {
    local retry_count=0

    echo "${YELLOW}⏳ Aguardando DynamoDB ficar pronto em http://${DYNAMODB_HOST}:${DYNAMODB_PORT}...${NC}"

    while [ $retry_count -lt $MAX_RETRIES ]; do
        if curl -s http://${DYNAMODB_HOST}:${DYNAMODB_PORT}/ > /dev/null 2>&1; then
            echo "${GREEN}✅ DynamoDB está pronto!${NC}"
            return 0
        fi

        retry_count=$((retry_count + 1))
        echo "${YELLOW}Tentativa $retry_count/$MAX_RETRIES - aguardando...${NC}"
        sleep $RETRY_DELAY
    done

    echo "${RED}❌ Erro: DynamoDB não ficou pronto após ${MAX_RETRIES} tentativas${NC}"
    return 1
}

# Função para criar tabela connections
create_connections_table() {
    echo "${YELLOW}📋 Criando tabela 'connections'...${NC}"


    # Verificar se a tabela já existe
    if aws dynamodb describe-table \
        --table-name portfolio-connections \
        --endpoint-url http://${DYNAMODB_HOST}:${DYNAMODB_PORT} \
        --region ${AWS_REGION} \
        > /dev/null 2>&1; then

        echo "${YELLOW}⚠️  Tabela 'portfolio-connections' já existe${NC}"
        return 0
    fi

    # Criar a tabela
    aws dynamodb create-table \
        --table-name portfolio-connections \
        --attribute-definitions \
            AttributeName=connectionId,AttributeType=S \
        --key-schema \
            AttributeName=connectionId,KeyType=HASH \
        --billing-mode PAY_PER_REQUEST \
        --endpoint-url http://${DYNAMODB_HOST}:${DYNAMODB_PORT} \
        --region ${AWS_REGION}

    if [ $? -eq 0 ]; then
        echo "${GREEN}✅ Tabela 'portfolio-connections' criada com sucesso!${NC}"
        return 0
    else
        echo "${RED}❌ Erro ao criar tabela 'portfolio-connections'${NC}"
        return 1
    fi
}

# Função para listar todas as tabelas
list_tables() {
    echo "${YELLOW}📊 Listando todas as tabelas...${NC}"

    aws dynamodb list-tables \
        --endpoint-url http://${DYNAMODB_HOST}:${DYNAMODB_PORT} \
        --region ${AWS_REGION} \
        --output table
}

# Executar o setup
echo ""
echo "═══════════════════════════════════════════════════════════"
echo "     DynamoDB Local Setup"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "Configurações:"
echo "  Host: ${DYNAMODB_HOST}"
echo "  Porta: ${DYNAMODB_PORT}"
echo "  Região: ${AWS_REGION}"
echo ""

# Aguardar DynamoDB
if ! wait_for_dynamodb; then
    exit 1
fi

# Criar tabela
echo ""
if ! create_connections_table; then
    exit 1
fi

# Listar tabelas
echo ""
list_tables

echo ""
echo "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo "${GREEN}  Setup do DynamoDB Local concluído com sucesso! 🎉${NC}"
echo "${GREEN}════════════════════════════════════════════════════════════${NC}"
echo ""
echo "Para usar em sua aplicação Node.js, configure:"
echo "  - Endpoint: http://${DYNAMODB_HOST}:${DYNAMODB_PORT}"
echo "  - Região: ${AWS_REGION}"
echo ""
