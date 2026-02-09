# Order Workflow API

API de pedidos com Postgres, endpoints de webhook e consulta.

## Requisitos
- Node.js
- Docker (opcional, para Postgres)

## Configuracao
Variaveis em [.env](.env):
- POSTGRES_DB
- POSTGRES_USER
- POSTGRES_PASSWORD
- POSTGRES_PORT

## Subir Postgres
```bash
docker compose up -d