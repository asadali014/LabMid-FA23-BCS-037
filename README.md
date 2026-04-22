# Daraz Clone — DevOps Deployment Guide

**Student:** FA23-BCS-037
**Course:** DevOps for Cloud Computing (CSC418)
**Exam:** Lab Mid-Term — April 2026

---

## Application Architecture (3-Tier)

| Tier                   | Technology                        | Role                                |
| ---------------------- | --------------------------------- | ----------------------------------- |
| **Front-end**    | HTML + CSS + JavaScript (jQuery)  | UI served by Express                |
| **Back-end API** | Node.js + Express (`server.js`) | REST API at `/api/products`       |
| **Database**     | MongoDB (via Mongoose)            | Stores & seeds 10 product documents |

> **Featured Deals** section fetches products from **our own MongoDB database** via `GET /api/products?limit=4`.
> No third-party APIs — fully self-contained.

---

## Part 1 — Docker: Build, Run & Optimize

### 1.1 Verify Docker Installation

```bash
docker --version
docker info
```

### 1.2 Build the Docker Image

> Tag name uses student Reg No. as required.

```bash
docker build -t fa23bcs037/daraz-clone:fa23-bcs-037 .
```

### 1.3 Verify the Image Was Created

```bash
docker images
```

### 1.4 Run the Full Stack Locally (App + MongoDB)

```bash
# Using Docker Compose — starts both app and MongoDB together
docker-compose up --build
```

Open **http://localhost:8080** in your browser to verify the app is running.

### 1.5 Stop & Remove Containers

```bash
docker-compose down
```

### Docker Optimisation Justification

| Practice                          | What Was Done                                                                           | Benefit                                                                        |
| --------------------------------- | --------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **Minimal base image**      | Used `node:18-alpine` instead of `node:18` (full Debian)                            | Reduces image size by ~60%                                                     |
| **Layer caching for deps**  | `package.json` copied and `npm install` run **before** copying source code    | Deps layer is cached — rebuild only re-installs when `package.json` changes |
| **`.dockerignore` file**  | Excluded `node_modules/`, `.git`, `*.md`, `k8s-*.yaml`, `docker-compose.yaml` | Smaller build context, no local `node_modules` overwriting the image's own   |
| **Production-only install** | `npm install --production` — skips devDependencies                                   | Smaller final image                                                            |

---

## Part 2 — Git & GitHub Version Control

### 2.1 Initialize Local Repository

```bash
git init
git remote add origin https://github.com/<your-username>/LabMid-FA23-BCS-037.git
```

### 2.2 First Commit — Full Source + Docker Files

```bash
git add .
git commit -m "feat: initial commit — Daraz Clone with Express/MongoDB backend, Dockerfile, K8s"
git push -u origin main
```

### 2.3 Second Commit — Improvement

```bash
# After making a small change (e.g., added resource limits to k8s-deployment.yaml)
git add k8s-deployment.yaml
git commit -m "chore: add CPU/memory resource limits to Kubernetes deployment"
git push
```

### 2.4 Pull Latest Changes

```bash
git pull origin main
```

### 2.5 View Commit History

```bash
git log --oneline
```

---

## Part 3 — Azure + Kubernetes Deployment

### 3.1 Azure Service Architecture

| Azure Service                                | Purpose                                                                |
| -------------------------------------------- | ---------------------------------------------------------------------- |
| **Azure Kubernetes Service (AKS)**     | Managed K8s cluster running app + MongoDB pods                         |
| **Azure Load Balancer**                | Auto-provisioned by K8s `LoadBalancer` service — provides public IP |
| **Azure Managed Disks** *(optional)* | Persistent Volume for MongoDB data in production                       |

### 3.2 Push Image to Docker Hub

```bash
docker login
docker push fa23bcs037/daraz-clone:fa23-bcs-037
```

### 3.3 Create AKS Cluster (Azure CLI)

```bash
az group create --name daraz-rg --location eastus

az aks create \
  --resource-group daraz-rg \
  --name daraz-cluster \
  --node-count 1 \
  --generate-ssh-keys

az aks get-credentials --resource-group daraz-rg --name daraz-cluster
```

### 3.4 Deploy MongoDB First, Then the App

```bash
# 1. Deploy MongoDB (internal ClusterIP service named 'mongo')
kubectl apply -f k8s-mongodb.yaml

# 2. Deploy the Node.js app (connects to 'mongo' via MONGO_URI env var)
kubectl apply -f k8s-deployment.yaml

# 3. Expose the app publicly
kubectl apply -f k8s-service.yaml
```

### 3.5 Verify Pods Are Running

```bash
kubectl get pods
kubectl get deployments
kubectl get services
```

### 3.6 Get the Public External IP

```bash
kubectl get service daraz-clone-service
```

> Wait ~60 seconds. The `EXTERNAL-IP` column shows the public Azure IP.
> Open **http://\<EXTERNAL-IP\>** — the app loads products from MongoDB automatically.

### 3.7 Scale the Deployment

```bash
# Scale up to 4 replicas
kubectl scale deployment daraz-clone-deployment --replicas=4
kubectl get pods

# Scale back down to 2
kubectl scale deployment daraz-clone-deployment --replicas=2
kubectl get pods
```

---

## Part 4 — Troubleshooting: Image Pull Error (ErrImagePull)

### Issue Identified

After `kubectl apply -f k8s-deployment.yaml`, pods were stuck in `ImagePullBackOff`.

```bash
kubectl get pods
# NAME                                    READY   STATUS             RESTARTS
# daraz-clone-deployment-xxx-yyy          0/1     ImagePullBackOff   0
```

### Diagnosis

```bash
kubectl describe pod daraz-clone-deployment-xxx-yyy
# Events:
#   Failed to pull image "fa23bcs037/daraz-clone:fa23-bcs-037":
#   repository does not exist or may require 'docker login'
```

**Root Cause:** Image was built locally but not pushed to Docker Hub before deploying.

### Fix Applied

```bash
docker login
docker push fa23bcs037/daraz-clone:fa23-bcs-037
kubectl rollout restart deployment daraz-clone-deployment
```

### Corrected Result

```bash
kubectl get pods
# NAME                                    READY   STATUS    RESTARTS
# daraz-clone-deployment-xxx-aaa          1/1     Running   0
# daraz-clone-deployment-xxx-bbb          1/1     Running   0
```

Both pods show `Running` and app is accessible via the external IP. ✅

---

## File Structure

```
LabMid-FA23-BCS-037/
├── index.html              # Front-end markup (Daraz Clone UI)
├── style.css               # Styling + responsive layout
├── script.js               # jQuery AJAX → calls /api/products (MongoDB)
├── server.js               # Node.js + Express backend + Mongoose connection
├── package.json            # Node.js dependencies (express, mongoose)
├── Dockerfile              # node:18-alpine image, layer-cached npm install
├── .dockerignore           # Excludes node_modules, .git, docs from build
├── .gitignore              # Git ignore rules
├── docker-compose.yaml     # Runs app + MongoDB together locally
├── k8s-deployment.yaml     # K8s Deployment: 2 replicas, MONGO_URI env var
├── k8s-service.yaml        # K8s LoadBalancer Service → public port 80
├── k8s-mongodb.yaml        # K8s MongoDB Deployment + ClusterIP Service
└── README.md               # This guide
```

---

## Required Submission Links

| Item                   | Value                                                      |
| ---------------------- | ---------------------------------------------------------- |
| GitHub Repo            | `https://github.com/<your-username>/LabMid-FA23-BCS-037` |
| Docker Hub Image       | `https://hub.docker.com/r/fa23bcs037/daraz-clone`        |
| Azure / K8s Public URL | `http://<EXTERNAL-IP>` (from `kubectl get service`)    |
