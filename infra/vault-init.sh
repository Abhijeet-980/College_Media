#!/bin/bash

# Configuration
VAULT_CONTAINER="vault-dev"
VAULT_PORT=8200
VAULT_TOKEN="root"

echo "🚀 Starting Vault Initialization..."

# Check if Vault container is running
if ! docker ps | grep -q $VAULT_CONTAINER; then
    echo "Starting Vault Container..."
    docker run -d \
        --name $VAULT_CONTAINER \
        -p $VAULT_PORT:$VAULT_PORT \
        -e "VAULT_DEV_ROOT_TOKEN_ID=$VAULT_TOKEN" \
        -e "VAULT_ADDR=http://0.0.0.0:$VAULT_PORT" \
        vault:latest
    
    echo "Waiting for Vault to be ready..."
    sleep 5
else
    echo "Vault container already running."
fi

# Seed Secrets (using curl to avoid requiring vault cli)
echo "Seeding Secrets..."

# Backend Secrets
curl -s \
    --header "X-Vault-Token: $VAULT_TOKEN" \
    --request POST \
    --data '{ "options": { "cas": 0 }, "data": { "mongo_uri": "mongodb://mongo:27017/college_media", "jwt_secret": "dynamically_seeded_secret_123", "redis_url": "redis://redis:6379" } }' \
    http://127.0.0.1:$VAULT_PORT/v1/secret/data/college-media/backend

echo ""
echo "✅ Secrets seeded to secret/data/college-media/backend"
echo "Vault UI available at http://localhost:$VAULT_PORT/ui (Token: root)"
