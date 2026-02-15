#!/bin/bash

# Direct curl command to create Resend template
# Copy and paste this command, replacing re_xxxxxxxxx with your actual API key

curl -X POST 'https://api.resend.com/templates' \
  -H 'Authorization: Bearer api_key' \
  -H 'Content-Type: application/json' \
  -d '{
  "name": "subscription-renewal-reminder",
  "html": "<!DOCTYPE html><html><head><meta charset=\"UTF-8\"><style>body{font-family:Arial,sans-serif;line-height:1.6;color:#333;max-width:600px;margin:0 auto;padding:20px}.header{background-color:#4F46E5;color:white;padding:20px;text-align:center;border-radius:8px 8px 0 0}.content{background-color:#f9fafb;padding:30px;border-radius:0 0 8px 8px}.subscriptions-list{background-color:white;padding:20px;border-radius:8px;margin:20px 0;border-left:4px solid #4F46E5}.warning{background-color:#FEF3C7;border:1px solid #F59E0B;padding:15px;border-radius:8px;margin:20px 0}.footer{text-align:center;margin-top:30px;color:#6B7280;font-size:12px}</style></head><body><div class=\"header\"><h1>Lembrete de Renovação</h1></div><div class=\"content\"><p>Olá,</p><p>Este é um lembrete de que {{{RENEWAL_MESSAGE}}}.</p><div class=\"subscriptions-list\"><h3>Assinaturas que serão renovadas:</h3>{{{SUBSCRIPTIONS_LIST}}}</div><div class=\"warning\"><strong>Data de renovação:</strong> {{{FORMATTED_DATE}}}</div><p>Certifique-se de ter fundos disponíveis para a cobrança automática.</p></div><div class=\"footer\"><p>Este é um email automático, por favor não responda.</p></div></body></html>",
  "variables": [
    {
      "key": "RENEWAL_MESSAGE",
      "type": "string",
      "fallback_value": "suas assinaturas vencem em 3 dias"
    },
    {
      "key": "SUBSCRIPTIONS_LIST",
      "type": "string",
      "fallback_value": "1. Netflix<br>2. Spotify"
    },
    {
      "key": "FORMATTED_DATE",
      "type": "string",
      "fallback_value": "15/03/2024"
    }
  ]
}'

