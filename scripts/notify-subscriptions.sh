#!/bin/bash

# Script para notificar subscriptions aos usuários
# Uso: ./scripts/notify-subscriptions.sh

set -e

# Variáveis de ambiente
BASE_URL="${BASE_URL:-http://localhost:8080}"
API_KEY="${API_KEY}"

# Validação
if [ -z "$API_KEY" ]; then
  echo "Erro: API_KEY não foi fornecida"
  exit 1
fi

if [ -z "$BASE_URL" ]; then
  echo "Erro: BASE_URL não foi fornecida"
  exit 1
fi

# Endpoint
ENDPOINT="${BASE_URL}/api/subscriptions/notify"

echo "Notificando subscriptions aos usuários..."
echo "Endpoint: $ENDPOINT"
echo "Timestamp: $(date -u +"%Y-%m-%d %H:%M:%S UTC")"

# Fazer requisição
RESPONSE=$(curl -s -w "\n%{http_code}" \
  -X POST \
  -H "X-API-Key: ${API_KEY}" \
  "${ENDPOINT}")

# Separar body e status code
HTTP_BODY=$(echo "$RESPONSE" | sed '$d')
HTTP_CODE=$(echo "$RESPONSE" | tail -n1)

# Verificar resposta
if [ "$HTTP_CODE" -ge 200 ] && [ "$HTTP_CODE" -lt 300 ]; then
  echo "✅ Sucesso! Status: $HTTP_CODE"
  echo "Resposta: $HTTP_BODY"
  exit 0
else
  echo "❌ Erro! Status: $HTTP_CODE"
  echo "Resposta: $HTTP_BODY"
  exit 1
fi

