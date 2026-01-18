# College Media Deployment Guide

This comprehensive guide covers the deployment of the entire College Media platform, including frontend, backend, databases, and supporting services. It provides step-by-step instructions for local development setup, production deployment, CI/CD pipelines, environment configurations, monitoring, and scaling considerations.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Production Deployment](#production-deployment)
- [CI/CD Pipelines](#cicd-pipelines)
- [Environment Configurations](#environment-configurations)
- [Monitoring Setup](#monitoring-setup)
- [Rollback Procedures](#rollback-procedures)
- [Scaling Considerations](#scaling-considerations)
- [Troubleshooting](#troubleshooting)

## Prerequisites

### System Requirements

- **Operating System**: Windows 10+, macOS 10.15+, Ubuntu 18.04+
- **Memory**: Minimum 8GB RAM, Recommended 16GB+
- **Storage**: 20GB free space
- **Network**: Stable internet connection

### Required Software

#### Docker and Docker Compose
```bash
# Install Docker Desktop (Windows/macOS)
# Or install Docker Engine (Linux)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

#### Kubernetes Tools (for production)
```bash
# Install kubectl
curl -LO "https://dl.k8s.io/release/$(curl -L -s https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
sudo install -o root -g root -m 0755 kubectl /usr/local/bin/kubectl

# Install Helm
curl https://get.helm.sh/helm-v3.13.0-linux-amd64.tar.gz -o helm.tar.gz
tar -zxvf helm.tar.gz
sudo mv linux-amd64/helm /usr/local/bin/helm
```

#### Cloud CLI Tools (optional, based on provider)
```bash
# AWS CLI
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Google Cloud SDK
curl https://sdk.cloud.google.com | bash
exec -l $SHELL
```

### Required Accounts

- [Docker Hub](https://hub.docker.com) or private registry
- [GitHub](https://github.com) for CI/CD
- Cloud provider account (AWS/GCP/Azure)
- [MongoDB Atlas](https://cloud.mongodb.com) or self-hosted MongoDB
- Domain registrar for production

## Local Development Setup

### Docker Compose Setup

The project includes a comprehensive Docker Compose setup for local development with all required services.

#### Quick Start

```bash
# Clone the repository
git clone https://github.com/Ewocs/College_Media.git
cd College_Media

# Copy environment template
cp .env.example .env

# Edit environment variables (see Environment Configurations section)
nano .env

# Start all services
docker-compose up --build

# Or run in background
docker-compose up -d --build
```

#### Services Included

- **Frontend**: React/Vite application (port 3000)
- **Backend**: Node.js/Express API server (port 5000)
- **MongoDB**: Document database (port 27017)
- **Redis**: Caching and session store (port 6379)
- **MeiliSearch**: Search engine (port 7700)
- **Jaeger**: Distributed tracing (port 16686)
- **IPFS**: Decentralized storage (ports 4001, 5001, 8080)

#### Development Workflow

```bash
# View running containers
docker-compose ps

# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Execute commands in containers
docker-compose exec backend npm test
docker-compose exec frontend npm run lint

# Stop services
docker-compose down

# Rebuild after code changes
docker-compose up --build --force-recreate

# Clean up
docker-compose down -v --rmi all
```

### Manual Local Setup

If you prefer not to use Docker Compose, you can set up services individually.

#### Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env

# Start MongoDB and Redis locally or use cloud services
# Update .env with connection strings

# Start development server
npm run dev
```

#### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.example .env.local

# Start development server
npm run dev
```

## Environment Configuration

### Environment Variables

Create environment files for different stages:

#### Production (.env.production)
```env
# Application
NODE_ENV=production
PORT=5000
CLIENT_URL=https://yourdomain.com

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/college_media_prod

# Authentication
JWT_SECRET=your-production-jwt-secret
ACCESS_TOKEN_SECRET=your-production-access-secret
REFRESH_TOKEN_SECRET=your-production-refresh-secret

# Email Service
RESEND_API_KEY=your-production-resend-key

# AWS Services
AWS_ACCESS_KEY_ID=your-production-aws-key
AWS_SECRET_ACCESS_KEY=your-production-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=your-production-s3-bucket

# Redis (if using Redis Cloud or similar)
REDIS_URL=redis://username:password@your-redis-host:port

# Security
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

#### Staging (.env.staging)
```env
# Similar to production but with staging URLs and databases
NODE_ENV=staging
CLIENT_URL=https://staging.yourdomain.com
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/college_media_staging
```

### Environment Variable Management

- **Vercel**: Set in project settings > Environment Variables
- **Netlify**: Set in site settings > Environment variables
- **Docker**: Use `.env` file or docker-compose environment
- **AWS/Azure**: Use their respective secret management services

## Vercel Deployment

### Frontend Deployment

1. **Connect Repository**
   - Go to [Vercel Dashboard](https://vercel.com/dashboard)
   - Click "New Project"
   - Import your GitHub repository
   - Select the repository

2. **Configure Build Settings**
   - **Framework Preset**: Vite
   - **Root Directory**: `./frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
   - **Install Command**: `npm install`

3. **Environment Variables**
   - Add all required environment variables in Vercel dashboard
   - Set different values for production and preview deployments

4. **Domain Configuration**
   - Go to project settings > Domains
   - Add your custom domain
   - Configure DNS records as instructed

5. **Deploy**
   - Push to main branch or create deployment manually
   - Vercel will automatically build and deploy



## Netlify Deployment

### Frontend Deployment

1. **Connect Repository**
   - Go to [Netlify Dashboard](https://app.netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository

2. **Build Settings**
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`

3. **Environment Variables**
   - Go to Site settings > Environment variables
   - Add all required variables

4. **Domain Setup**
   - Go to Site settings > Domain management
   - Add custom domain
   - Configure DNS



## Docker Deployment

### Dockerfile (Frontend)

```dockerfile
# Multi-stage build for React app
FROM node:18-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM nginx:alpine

# Copy built assets from builder stage
COPY --from=builder /app/dist /usr/share/nginx/html

# Copy nginx configuration
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

### Docker Compose

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    ports:
      - "3000:80"
    environment:
      - NODE_ENV=production
```

### Running Docker Deployment

```bash
# Build and run with docker-compose
docker-compose up --build

# Or run individually
docker build -t college-media-frontend ./frontend
docker run -p 3000:80 college-media-frontend
```

## AWS Deployment

### EC2 + Docker Deployment

1. **Launch EC2 Instance**
   - Choose Amazon Linux 2 or Ubuntu
   - t3.medium or larger for production
   - Configure security groups (ports 22, 80, 443, 5000)

2. **Install Docker**
   ```bash
   # Update system
   sudo yum update -y  # Amazon Linux
   # or
   sudo apt update && sudo apt upgrade -y  # Ubuntu

   # Install Docker
   sudo amazon-linux-extras install docker  # Amazon Linux
   # or
   sudo apt install docker.io  # Ubuntu

   # Start Docker
   sudo systemctl start docker
   sudo systemctl enable docker
   ```

3. **Deploy Application**
   ```bash
   # Clone repository
   git clone https://github.com/your-repo/college-media.git
   cd college-media

   # Run with docker-compose
   sudo docker-compose up -d
   ```

4. **Configure Load Balancer**
   - Create Application Load Balancer
   - Configure target groups for frontend (port 3000) and backend (port 5000)
   - Set up SSL certificate with ACM

### ECS Fargate Deployment

1. **Create ECR Repository**
   ```bash
   aws ecr create-repository --repository-name college-media-frontend
   aws ecr create-repository --repository-name college-media-backend
   ```

2. **Build and Push Images**
   ```bash
   # Get login token
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.us-east-1.amazonaws.com

   # Build and tag images
   docker build -t college-media-frontend ./frontend
   docker build -t college-media-backend ./backend

   # Tag for ECR
   docker tag college-media-frontend:latest your-account-id.dkr.ecr.us-east-1.amazonaws.com/college-media-frontend:latest
   docker tag college-media-backend:latest your-account-id.dkr.ecr.us-east-1.amazonaws.com/college-media-backend:latest

   # Push images
   docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/college-media-frontend:latest
   docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/college-media-backend:latest
   ```

3. **Create ECS Cluster**
   - Use Fargate launch type
   - Create task definitions for frontend and backend
   - Set up services with load balancers

## Azure Deployment

### App Service Deployment

1. **Create App Service**
   - Go to Azure Portal > App Services
   - Create Web App for frontend (Node.js runtime)
   - Create API App for backend (Node.js runtime)

2. **Configure Deployment**
   - Connect to GitHub repository
   - Set deployment branch
   - Configure build settings

3. **Environment Variables**
   - Set in App Service > Configuration > Application settings

4. **Database Setup**
   - Use Azure Cosmos DB (MongoDB API) or Azure Database for MongoDB

### Container Instances

1. **Create Container Registry**
   ```bash
   az acr create --resource-group your-rg --name youracr --sku Basic
   ```

2. **Build and Push Images**
   ```bash
   # Login to ACR
   az acr login --name youracr

   # Build and tag images
   docker build -t youracr.azurecr.io/college-media-frontend ./frontend
   docker build -t youracr.azurecr.io/college-media-backend ./backend

   # Push images
   docker push youracr.azurecr.io/college-media-frontend
   docker push youracr.azurecr.io/college-media-backend
   ```

3. **Deploy to Container Instances**
   ```bash
   az container create \
     --resource-group your-rg \
     --name college-media-frontend \
     --image youracr.azurecr.io/college-media-frontend \
     --dns-name-label college-media-frontend \
     --ports 80
   ```



## Production Deployment

### Docker Deployment

#### Build and Push Images

```bash
# Build frontend image
cd frontend
docker build -t college-media/frontend:latest .

# Build backend image
cd backend
docker build -t college-media/backend:latest .

# Tag for registry
docker tag college-media/frontend:latest your-registry.com/college-media/frontend:latest
docker tag college-media/backend:latest your-registry.com/college-media/backend:latest

# Push images
docker push your-registry.com/college-media/frontend:latest
docker push your-registry.com/college-media/backend:latest
```

#### Docker Compose for Production

```yaml
version: '3.8'

services:
  frontend:
    image: your-registry.com/college-media/frontend:latest
    ports:
      - "80:80"
    environment:
      - NODE_ENV=production
    restart: unless-stopped

  backend:
    image: your-registry.com/college-media/backend:latest
    ports:
      - "5000:5000"
    environment:
      - NODE_ENV=production
      - MONGODB_URI=mongodb://mongo:27017/college_media
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis
    restart: unless-stopped

  mongo:
    image: mongo:6.0
    volumes:
      - mongo_data:/data/db
    environment:
      - MONGO_INITDB_ROOT_USERNAME=admin
      - MONGO_INITDB_ROOT_PASSWORD=password
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    restart: unless-stopped

  meilisearch:
    image: getmeili/meilisearch:v1.0
    volumes:
      - meili_data:/meili_data
    environment:
      - MEILI_MASTER_KEY=your-master-key
    restart: unless-stopped

volumes:
  mongo_data:
  redis_data:
  meili_data:
```

### Kubernetes Deployment

The project includes Kubernetes manifests for production deployment.

#### Prerequisites

```bash
# Create namespace
kubectl create namespace college-media

# Create secrets
kubectl create secret generic app-secrets \
  --from-literal=jwt-secret=your-jwt-secret \
  --from-literal=meili-master-key=your-meili-key \
  --namespace college-media
```

#### Deploy Services

```bash
# Deploy MongoDB
kubectl apply -f k8s/mongo.yaml

# Deploy Redis
kubectl apply -f k8s/redis.yaml

# Deploy MeiliSearch
kubectl apply -f k8s/meilisearch.yaml

# Deploy backend
kubectl apply -f k8s/backend.yaml

# Deploy frontend
kubectl apply -f k8s/frontend.yaml

# Deploy ingress
kubectl apply -f k8s/ingress.yaml
```

#### Verify Deployment

```bash
# Check pod status
kubectl get pods -n college-media

# Check services
kubectl get services -n college-media

# Check ingress
kubectl get ingress -n college-media

# View logs
kubectl logs -f deployment/backend -n college-media
```

### Cloud Provider Deployments

#### AWS ECS/Fargate

1. **Create ECR Repositories**
   ```bash
   aws ecr create-repository --repository-name college-media-frontend
   aws ecr create-repository --repository-name college-media-backend
   ```

2. **Build and Push Images**
   ```bash
   # Get login token
   aws ecr get-login-password --region us-east-1 | docker login --username AWS --password-stdin your-account-id.dkr.ecr.us-east-1.amazonaws.com

   # Tag and push images
   docker tag college-media/frontend:latest your-account-id.dkr.ecr.us-east-1.amazonaws.com/college-media-frontend:latest
   docker push your-account-id.dkr.ecr.us-east-1.amazonaws.com/college-media-frontend:latest
   ```

3. **Create ECS Cluster**
   ```bash
   aws ecs create-cluster --cluster-name college-media-cluster
   ```

4. **Deploy Services**
   Use AWS Console or AWS CLI to create task definitions and services for frontend and backend.

#### Google Cloud GKE

1. **Create GKE Cluster**
   ```bash
   gcloud container clusters create college-media-cluster \
     --num-nodes=3 \
     --zone=us-central1-a
   ```

2. **Build and Push Images**
   ```bash
   gcloud builds submit --tag gcr.io/your-project/college-media-frontend .
   gcloud builds submit --tag gcr.io/your-project/college-media-backend .
   ```

3. **Deploy to GKE**
   ```bash
   kubectl apply -f k8s/
   ```

#### Azure AKS

1. **Create AKS Cluster**
   ```bash
   az aks create --resource-group your-rg --name college-media-cluster --node-count 3
   ```

2. **Build and Push Images**
   ```bash
   az acr build --registry youracr --image college-media/frontend:latest ./frontend
   az acr build --registry youracr --image college-media/backend:latest ./backend
   ```

3. **Deploy to AKS**
   ```bash
   kubectl apply -f k8s/
   ```

## CI/CD Pipelines

### GitHub Actions Setup

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v4

    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '18'
        cache: 'npm'

    - name: Install dependencies
      run: |
        cd frontend && npm ci
        cd ../backend && npm ci

    - name: Run tests
      run: |
        cd frontend && npm run test:ci
        cd ../backend && npm test

    - name: Build images
      run: |
        docker build -t college-media-frontend ./frontend
        docker build -t college-media-backend ./backend

  deploy:
    needs: test
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'

    steps:
    - uses: actions/checkout@v4

    - name: Configure AWS credentials
      uses: aws-actions/configure-aws-credentials@v4
      with:
        aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
        aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
        aws-region: us-east-1

    - name: Login to Amazon ECR
      id: login-ecr
      uses: aws-actions/amazon-ecr-login@v2

    - name: Build and push frontend image
      run: |
        docker build -t ${{ steps.login-ecr.outputs.registry }}/college-media-frontend ./frontend
        docker push ${{ steps.login-ecr.outputs.registry }}/college-media-frontend

    - name: Build and push backend image
      run: |
        docker build -t ${{ steps.login-ecr.outputs.registry }}/college-media-backend ./backend
        docker push ${{ steps.login-ecr.outputs.registry }}/college-media-backend

    - name: Deploy to ECS
      run: |
        aws ecs update-service --cluster college-media-cluster --service college-media-backend --force-new-deployment
        aws ecs update-service --cluster college-media-cluster --service college-media-frontend --force-new-deployment
```

### Automated Deployment Scripts

#### Deploy Script

```bash
#!/bin/bash
# deploy.sh

set -e

echo "Starting deployment..."

# Build images
docker build -t college-media-frontend ./frontend
docker build -t college-media-backend ./backend

# Push images
docker push your-registry.com/college-media-frontend:latest
docker push your-registry.com/college-media-backend:latest

# Deploy to Kubernetes
kubectl apply -f k8s/

# Wait for rollout
kubectl rollout status deployment/backend -n college-media
kubectl rollout status deployment/frontend -n college-media

# Run health checks
curl -f https://your-domain.com/api/health
curl -f https://your-domain.com/

echo "Deployment completed successfully!"
```

#### Rollback Script

```bash
#!/bin/bash
# rollback.sh

echo "Rolling back deployment..."

# Rollback Kubernetes deployments
kubectl rollout undo deployment/backend -n college-media
kubectl rollout undo deployment/frontend -n college-media

# Wait for rollback
kubectl rollout status deployment/backend -n college-media
kubectl rollout status deployment/frontend -n college-media

echo "Rollback completed!"
```

## Environment Configurations

### Environment Variables

#### Development (.env)

```env
# Application
NODE_ENV=development
PORT=5000
CLIENT_URL=http://localhost:3000

# Database
MONGODB_URI=mongodb://localhost:27017/college_media_dev

# Authentication
JWT_SECRET=dev-jwt-secret-key
ACCESS_TOKEN_SECRET=dev-access-secret
REFRESH_TOKEN_SECRET=dev-refresh-secret

# Email Service
RESEND_API_KEY=dev-resend-key

# Redis
REDIS_URL=redis://localhost:6379

# Search
MEILI_HOST=http://localhost:7700
MEILI_MASTER_KEY=dev-master-key

# Tracing
JAEGER_ENDPOINT=http://localhost:14268/api/traces

# Security
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173
```

#### Production (.env.production)

```env
# Application
NODE_ENV=production
PORT=5000
CLIENT_URL=https://yourdomain.com

# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/college_media_prod

# Authentication
JWT_SECRET=prod-jwt-secret-key
ACCESS_TOKEN_SECRET=prod-access-secret
REFRESH_TOKEN_SECRET=prod-refresh-secret

# Email Service
RESEND_API_KEY=prod-resend-key

# AWS Services
AWS_ACCESS_KEY_ID=prod-aws-key
AWS_SECRET_ACCESS_KEY=prod-aws-secret
AWS_REGION=us-east-1
AWS_S3_BUCKET=prod-s3-bucket

# Redis (Cloud)
REDIS_URL=redis://username:password@your-redis-host:port

# Search
MEILI_HOST=https://your-meili-host
MEILI_MASTER_KEY=prod-master-key

# Monitoring
SENTRY_DSN=your-sentry-dsn
METRICS_TOKEN=prod-metrics-token

# Security
ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
SSL_KEY_PATH=/path/to/ssl/key.pem
SSL_CERT_PATH=/path/to/ssl/cert.pem
```

### Kubernetes ConfigMaps and Secrets

#### ConfigMap for Non-Sensitive Config

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: app-config
  namespace: college-media
data:
  NODE_ENV: "production"
  CLIENT_URL: "https://yourdomain.com"
  MEILI_HOST: "http://meilisearch:7700"
```

#### Secrets for Sensitive Data

```yaml
apiVersion: v1
kind: Secret
metadata:
  name: app-secrets
  namespace: college-media
type: Opaque
data:
  jwt-secret: <base64-encoded-jwt-secret>
  meili-master-key: <base64-encoded-meili-key>
  mongodb-uri: <base64-encoded-mongo-uri>
  redis-url: <base64-encoded-redis-url>
```

### Environment Variable Management

#### AWS Systems Manager Parameter Store

```bash
# Store parameters
aws ssm put-parameter --name "/college-media/prod/JWT_SECRET" --value "your-secret" --type "SecureString"
aws ssm put-parameter --name "/college-media/prod/MONGODB_URI" --value "your-uri" --type "SecureString"

# Retrieve in application
aws ssm get-parameters-by-path --path "/college-media/prod/"
```

#### Google Cloud Secret Manager

```bash
# Create secrets
echo -n "your-secret" | gcloud secrets create jwt-secret --data-file=-
echo -n "your-uri" | gcloud secrets create mongodb-uri --data-file=-

# Access in application
gcloud secrets versions access latest --secret=jwt-secret
```

## Monitoring Setup

### Application Metrics

The backend includes built-in metrics collection using Prometheus client.

#### Accessing Metrics

```bash
# Local development
curl http://localhost:5000/metrics

# Production (with authentication)
curl -H "x-metrics-token: your-token" https://your-api.com/metrics
```

#### Prometheus Configuration

```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'college-media-backend'
    static_configs:
      - targets: ['backend:5000']
    metrics_path: '/metrics'
    params:
      'x-metrics-token': ['your-metrics-token']
```

### External Monitoring Tools

#### Sentry for Error Tracking

```javascript
// backend/utils/sentry.js
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0,
});
```

#### DataDog for Infrastructure Monitoring

```yaml
# datadog-agent.yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: datadog-agent-config
data:
  datadog.yaml: |
    api_key: "your-datadog-api-key"
    app_key: "your-datadog-app-key"
    logs_enabled: true
    apm_config:
      enabled: true
```

#### Grafana Dashboards

Create dashboards for:
- Application performance metrics
- Error rates and types
- Database query performance
- Kubernetes cluster health
- User activity and engagement

### Health Checks

#### Backend Health Endpoint

```javascript
app.get("/health", (req, res) => {
  // Check database connectivity
  // Check Redis connectivity
  // Check external services
  res.json({ status: "healthy", timestamp: new Date().toISOString() });
});
```

#### Kubernetes Liveness and Readiness Probes

```yaml
livenessProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 30
  periodSeconds: 10
  timeoutSeconds: 5
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /health
    port: 5000
  initialDelaySeconds: 10
  periodSeconds: 5
  timeoutSeconds: 3
```

## Rollback Procedures

### Automated Rollback

#### Kubernetes Rollback

```bash
# Rollback to previous deployment
kubectl rollout undo deployment/backend -n college-media

# Rollback to specific revision
kubectl rollout undo deployment/backend --to-revision=2 -n college-media

# Check rollout history
kubectl rollout history deployment/backend -n college-media
```

#### Docker Rollback

```bash
# Tag previous image
docker tag college-media-backend:v1 college-media-backend:latest

# Update deployment
kubectl set image deployment/backend backend=college-media-backend:v1 -n college-media
```

### Manual Rollback Steps

1. **Identify the Issue**
   - Check application logs
   - Monitor error rates and performance metrics
   - Verify database integrity

2. **Stop the Deployment**
   ```bash
   kubectl scale deployment backend --replicas=0 -n college-media
   ```

3. **Restore Previous Version**
   ```bash
   kubectl set image deployment/backend backend=college-media-backend:v1 -n college-media
   ```

4. **Scale Back Up**
   ```bash
   kubectl scale deployment backend --replicas=2 -n college-media
   ```

5. **Verify Rollback**
   - Check application health
   - Run integration tests
   - Monitor for errors

### Database Rollback

```bash
# Create backup before deployment
mongodump --db college_media --out /backup/$(date +%Y%m%d_%H%M%S)

# Restore if needed
mongorestore --db college_media /backup/latest-backup
```

## Scaling Considerations

### Horizontal Pod Autoscaling

#### Kubernetes HPA

```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: backend-hpa
  namespace: college-media
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: backend
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

### Load Balancing

#### Nginx Ingress Configuration

```yaml
apiVersion: networking.k8s.io/v1
kind: Ingress
metadata:
  name: college-media-ingress
  annotations:
    nginx.ingress.kubernetes.io/proxy-body-size: "50m"
    nginx.ingress.kubernetes.io/rate-limit: "100"
    nginx.ingress.kubernetes.io/rate-limit-window: "1m"
spec:
  ingressClassName: nginx
  rules:
  - http:
      paths:
      - path: /api
        pathType: Prefix
        backend:
          service:
            name: backend
            port:
              number: 5000
      - path: /
        pathType: Prefix
        backend:
          service:
            name: frontend
            port:
              number: 80
```

### Database Scaling

#### MongoDB Sharding

```javascript
// Enable sharding
sh.enableSharding("college_media")

// Shard collections
sh.shardCollection("college_media.users", { "_id": 1 })
sh.shardCollection("college_media.posts", { "createdAt": 1 })
```

#### Redis Clustering

```yaml
# redis-cluster.yaml
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: redis-cluster
spec:
  serviceName: redis-cluster
  replicas: 6
  template:
    spec:
      containers:
      - name: redis
        image: redis:7-alpine
        command: ["redis-server", "/etc/redis/redis.conf"]
        volumeMounts:
        - name: redis-config
          mountPath: /etc/redis
```

### CDN Integration

#### CloudFront Distribution

```bash
# Create CloudFront distribution
aws cloudfront create-distribution --distribution-config file://cloudfront-config.json
```

#### CDN Configuration for Static Assets

```nginx
# nginx.conf for frontend
location /static/ {
    expires 1y;
    add_header Cache-Control "public, immutable";
    proxy_pass http://frontend;
}

location /api/ {
    proxy_pass http://backend;
    proxy_set_header X-Real-IP $remote_addr;
}
```

## Monitoring and Logging

### Application Monitoring

#### Vercel/Netlify Analytics
- Built-in performance monitoring
- Real-time error tracking
- User analytics

#### External Monitoring (Recommended)

**Sentry for Error Tracking**
```bash
npm install @sentry/react @sentry/tracing
```

```javascript
// Frontend error tracking
import * as Sentry from "@sentry/react";
import { BrowserTracing } from "@sentry/tracing";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [new BrowserTracing()],
  tracesSampleRate: 1.0,
});
```



### Logging Setup

Frontend applications typically use browser developer tools and external monitoring services for logging. For production deployments:

- **Vercel/Netlify**: Built-in logging in deployment dashboards
- **Browser Console**: Use `console.log()`, `console.warn()`, `console.error()`
- **External Services**: Sentry, LogRocket, or similar for error tracking

#### Log Aggregation

**Vercel Analytics**
- Real-time log streaming
- Error tracking and alerting
- Performance metrics

**Netlify Logs**
- Build logs and runtime logs
- Function logs (if using Netlify Functions)
- Access logs and error logs

## Troubleshooting

### Common Deployment Issues

#### Build Failures
- Check Node.js version compatibility
- Verify all dependencies are installed
- Check for missing environment variables during build

#### Runtime Errors
- Verify environment variables are set correctly
- Check database connectivity
- Validate API endpoints and CORS settings

#### Performance Issues
- Monitor resource usage (CPU, memory)
- Check database query performance
- Implement caching where appropriate

#### SSL/HTTPS Issues
- Verify certificate installation
- Check domain DNS configuration
- Ensure proper redirect rules

### Rollback Strategy

1. **Version Tagging**
   ```bash
   git tag v1.2.3
   git push origin v1.2.3
   ```

2. **Quick Rollback**
   - Most platforms support instant rollback to previous deployment
   - Keep backup of database before major migrations

3. **Blue-Green Deployment**
   - Deploy to staging environment first
   - Test thoroughly before production deployment
   - Use feature flags for gradual rollouts

### Support and Resources

- **Platform Documentation**:
  - [Vercel Docs](https://vercel.com/docs)
  - [Netlify Docs](https://docs.netlify.com)
  - [Docker Docs](https://docs.docker.com)
  - [AWS Docs](https://docs.aws.amazon.com)
  - [Azure Docs](https://docs.microsoft.com/azure)

- **Community Support**:
  - [GitHub Issues](https://github.com/Ewocs/College_Media/issues)
  - [Stack Overflow](https://stackoverflow.com/questions/tagged/college-media)

- **Monitoring Tools**:
  - [Sentry](https://sentry.io)
  - [DataDog](https://datadoghq.com)
  - [New Relic](https://newrelic.com)

This deployment guide covers the most common deployment scenarios. For specific requirements or custom deployments, please refer to the platform-specific documentation or create an issue for additional guidance.