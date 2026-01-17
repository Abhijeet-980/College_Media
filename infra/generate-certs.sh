#!/bin/bash
set -e

echo "🔐 Generating mTLS Certificates..."

OUTPUT_DIR="../certs"
mkdir -p $OUTPUT_DIR

# 1. Create CA
echo "Creating CA..."
openssl req -new -x509 -days 365 -nodes \
    -out $OUTPUT_DIR/ca.crt \
    -keyout $OUTPUT_DIR/ca.key \
    -subj "/C=US/ST=State/L=City/O=CollegeMedia/OU=Root/CN=CollegeMedia-CA"

# 2. Server Cert (Transcoder Service)
echo "Creating Server Cert..."
openssl req -new -nodes \
    -out $OUTPUT_DIR/server.csr \
    -keyout $OUTPUT_DIR/server.key \
    -subj "/C=US/ST=State/L=City/O=CollegeMedia/OU=Service/CN=transcoder-service"

openssl x509 -req -in $OUTPUT_DIR/server.csr \
    -CA $OUTPUT_DIR/ca.crt \
    -CAkey $OUTPUT_DIR/ca.key \
    -CAcreateserial \
    -out $OUTPUT_DIR/server.crt \
    -days 365

# 3. Client Cert (Backend App)
echo "Creating Client Cert..."
openssl req -new -nodes \
    -out $OUTPUT_DIR/client.csr \
    -keyout $OUTPUT_DIR/client.key \
    -subj "/C=US/ST=State/L=City/O=CollegeMedia/OU=Client/CN=backend-api"

openssl x509 -req -in $OUTPUT_DIR/client.csr \
    -CA $OUTPUT_DIR/ca.crt \
    -CAkey $OUTPUT_DIR/ca.key \
    -CAcreateserial \
    -out $OUTPUT_DIR/client.crt \
    -days 365

# Cleanup CSRs
rm $OUTPUT_DIR/*.csr

echo "✅ Certificates generated in $OUTPUT_DIR"
