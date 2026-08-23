# Tpisken

A containerized two-tier sample application built during my DevOps internship at Migros Ticaret A.Ş. (2025). The project covers the full container workflow end to end: local development with Docker Compose, image publishing to both Docker Hub and a private Harbor registry, Kubernetes deployment on Minikube, and a CI pipeline on Azure DevOps.

## Stack

| Layer | Technology |
|---|---|
| Backend | Python / Flask |
| Frontend | Static HTML, CSS, JavaScript |
| Containerization | Docker, Docker Compose |
| Registry | Docker Hub, Harbor (private) |
| Orchestration | Kubernetes (Minikube) |
| CI/CD | Azure DevOps Pipelines |

## Repository structure

```
backend/                        Flask application (app.py, requirements.txt, Dockerfile)
frontend/                       Static frontend (index.html, script.js, style.css, Dockerfile)
docker-compose.yml              Local multi-service setup
k8s-backend-deployment.yaml     Kubernetes Deployment + Service for the backend
k8s-frontend-deployment.yaml    Kubernetes Deployment + Service for the frontend
azure-pipelines.yml             CI pipeline definition
```

## Requirements

- Docker and Docker Compose
- Python 3.8+ (only if running the backend outside a container)
- `kubectl` and a Kubernetes cluster (Minikube, kind, or remote) for the deployment step

## Running locally

```bash
docker-compose up --build
```

The backend serves on port `5000`. Check `docker-compose.yml` for the frontend port mapping.

To run the backend directly, without Docker:

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python app.py
```

## Building and publishing images

```bash
docker build -t tpisken-backend:latest ./backend
docker build -t tpisken-frontend:latest ./frontend
```

Images were tagged and pushed to two registries during development — Docker Hub for public access and a self-hosted Harbor instance for centralized, access-controlled image management:

```bash
# Harbor (private registry)
docker tag tpisken-backend:latest <harbor-host>/<project>/tpisken-backend:latest
docker push <harbor-host>/<project>/tpisken-backend:latest
```

## Deploying to Kubernetes

The manifests define a Deployment and a Service for each tier. Update the `image:` fields to point at your own registry, then apply:

```bash
kubectl apply -f k8s-backend-deployment.yaml
kubectl apply -f k8s-frontend-deployment.yaml
kubectl get pods
```

Deployments handle replica count and rolling pod replacement; Services provide load balancing across pods and expose the application outside the cluster. Tested on Minikube.

## CI pipeline

`azure-pipelines.yml` defines the build pipeline used on Azure DevOps. It was configured, run, and debugged through the pipeline logs until it completed successfully. A separate `docker-compose.public.yml` was used to define how services behave outside the local environment.

## Author



Tuana Pişken — [github.com/tuanapskn](https://github.com/tuanapskn)
