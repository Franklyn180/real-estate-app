 # RealtyOne Estate

A simple real estate website with a frontend, backend API, and SQLite database. The project includes one Dockerfile for the frontend and one Dockerfile for the backend so you can build and run each service independently. You can then use your own `docker-compose.yml` for practice.

## Features

- Property listings with pricing and location details
- Agent spotlight section
- Enquiry form API endpoint
- SQLite-backed database for persistent listing data
- Clean landing page design for a real estate brand

## Project structure

```text
real-estate-app/
├── README.md
├── .gitignore
├── database/
│   └── schema.sql
├── frontend/
│   ├── Dockerfile
│   ├── index.html
│   ├── styles.css
│   ├── config.js
│   └── app.js
├── backend/
│   ├── Dockerfile
│   ├── package.json
│   ├── server.js
│   ├── db.js
│   └── data/
│       └── .gitkeep
└──
```

## Local setup

### 1) Backend

```bash
cd backend
npm install
npm start
```

The backend runs on port `5000` and automatically creates the SQLite database in `backend/data/real_estate.db` if it does not already exist.

### 2) Frontend

Open the frontend in a browser directly from the folder:

```bash
cd frontend
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

> If you want the frontend to talk to the backend while running in Docker Compose, update the API URL in `frontend/config.js` to use the service name such as `http://backend:5000`.

## API endpoints

- `GET /api/health` – returns server status
- `GET /api/properties` – returns all property listings
- `GET /api/properties/:id` – returns one listing
- `GET /api/agents` – returns the sales team
- `POST /api/enquiries` – accepts a user enquiry payload

Example request:

```bash
curl http://localhost:5000/api/properties
```

## Docker build instructions

### Frontend image

```bash
docker build -t real-estate-frontend ./frontend
```

### Backend image

```bash
docker build -t real-estate-backend ./backend
```

### Run containers manually

```bash
docker run -d -p 80:80 --name real-estate-frontend real-estate-frontend
docker run -d -p 5000:5000 -v $(pwd)/backend/data:/app/data --name real-estate-backend real-estate-backend
```

The frontend container serves static files on port `80`, while the backend API listens on port `5000`.

## Database

The project uses SQLite with a schema file at `database/schema.sql` and creates the database at runtime. Sample property and agent data are inserted automatically when the database is empty.

## Deployment notes

- The backend should run in a container with a persistent volume for `backend/data`.
- The frontend can be served by Nginx in its own container.
- For your own Compose practice, create a `docker-compose.yml` that wires the frontend and backend together and exposes ports `80` and `5000`.
- If you want to deploy to a cloud provider, set the backend port to `5000`, ensure the frontend is configured to call the backend URL, and mount the SQLite file directory as a persistent volume.

## Kubernetes deployment with GitHub Actions

This project is ready to be deployed to Kubernetes using a GitHub Actions pipeline.

Recommended architecture:

- Frontend: static site served by Nginx in a Kubernetes Deployment
- Backend: Node.js API in a Kubernetes Deployment
- Database: SQLite file-based persistence with a Kubernetes PersistentVolume or a managed database in production
- Ingress: exposes the frontend and API through a load balancer or ingress controller
- Health checks: liveness and readiness probes for both services

Typical GitHub Actions stages:

1. Install dependencies
2. Run lint and basic tests
3. Run security checks
4. Run SonarQube analysis
5. Build Docker images
6. Push images to container registry
7. Deploy to Kubernetes using `kubectl` or `helm`

Example workflow outline:

```yaml
name: real-estate-ci-cd

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  build-test:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Install backend dependencies
        run: cd backend && npm install

      - name: Run lint
        run: cd backend && npx eslint . || echo "No lint config configured"

      - name: Run unit tests
        run: cd backend && npm test -- --runInBand || echo "No tests configured yet"

      - name: Run security audit
        run: cd backend && npm audit --audit-level=high

      - name: SonarQube Scan
        uses: SonarSource/sonarqube-scan-action@v2
        env:
          SONAR_TOKEN: ${{ secrets.SONAR_TOKEN }}
          SONAR_HOST_URL: ${{ secrets.SONAR_HOST_URL }}

      - name: Build frontend image
        run: docker build -t ${{ secrets.DOCKER_USERNAME }}/real-estate-frontend:latest ./frontend

      - name: Build backend image
        run: docker build -t ${{ secrets.DOCKER_USERNAME }}/real-estate-backend:latest ./backend

      - name: Login to Docker Hub
        run: echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin

      - name: Push images
        run: |
          docker push ${{ secrets.DOCKER_USERNAME }}/real-estate-frontend:latest
          docker push ${{ secrets.DOCKER_USERNAME }}/real-estate-backend:latest

  deploy-kubernetes:
    needs: build-test
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4

      - name: Set up kubectl
        uses: azure/setup-kubectl@v4

      - name: Deploy to Kubernetes
        env:
          KUBECONFIG: ${{ secrets.KUBECONFIG }}
        run: |
          kubectl apply -f k8s/
          kubectl rollout status deployment/real-estate-backend --timeout=180s
          kubectl rollout status deployment/real-estate-frontend --timeout=180s
```

Suggested Kubernetes resources:

- `Deployment` for frontend
- `Deployment` for backend
- `Service` for each component
- `Ingress` or `LoadBalancer` for application access
- `PersistentVolumeClaim` for SQLite storage if using a file-based database
- `ConfigMap` for environment variables
- `Secret` for Docker credentials and app secrets

Example Kubernetes deployment pattern:

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: real-estate-backend
spec:
  replicas: 2
  selector:
    matchLabels:
      app: real-estate-backend
  template:
    metadata:
      labels:
        app: real-estate-backend
    spec:
      containers:
        - name: backend
          image: your-registry/real-estate-backend:latest
          ports:
            - containerPort: 5000
          env:
            - name: PORT
              value: "5000"
          readinessProbe:
            httpGet:
              path: /api/health
              port: 5000
            initialDelaySeconds: 10
            periodSeconds: 10
```

> For a production-grade deployment, SQLite is usually replaced with PostgreSQL, MySQL, or another managed database. If you keep SQLite for learning purposes, use a persistent volume and backup strategy.

## Basic testing checklist

This project should include the following test layers:

- Unit tests for backend logic and API validation
- Integration tests for endpoints such as `/api/health`, `/api/properties`, and `/api/agents`
- API smoke tests to validate the service is reachable after deployment
- Dependency vulnerability scanning with `npm audit`
- Container security scanning with Trivy or Snyk
- Static analysis with SonarQube
- Optional end-to-end browser tests with Playwright or Cypress

Recommended tools:

- Jest or Vitest for backend unit tests
- Supertest for HTTP endpoint testing
- ESLint for code quality checks
- SonarQube for code quality and coverage analysis
- Trivy for image vulnerability scanning
- OWASP Dependency-Check for dependency review

Example backend quality commands:

```bash
cd backend
npm install
npm audit --audit-level=high
npx eslint .
npm test
```

For SonarQube, define a `sonar-project.properties` file:

```properties
sonar.projectKey=real-estate-app
sonar.projectName=RealtyOne Estate
sonar.sources=backend,frontend
sonar.javascript.lcov.reportPaths=coverage/lcov.info
sonar.exclusions=**/node_modules/**,**/dist/**
```

## Monitoring with Prometheus and Grafana

To monitor the application in Kubernetes, use Prometheus for metrics collection and Grafana for dashboards.

Recommended metrics:

- HTTP request rate and latency
- API status codes
- CPU and memory usage
- Disk usage for SQLite persistence
- Pod readiness and restarts
- Error rate and request failures

### Backend metrics

The backend should expose a metrics endpoint such as `/metrics` using `prom-client`.

Example Node.js metrics setup:

```js
const client = require('prom-client');

const collectDefaultMetrics = client.collectDefaultMetrics;
collectDefaultMetrics({ timeout: 5000 });

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});
```

### Prometheus configuration

Prometheus scraping configuration example:

```yaml
scrape_configs:
  - job_name: 'real-estate-backend'
    metrics_path: /metrics
    static_configs:
      - targets: ['real-estate-backend-service:5000']
```

### Grafana setup

- Add Prometheus as a data source in Grafana
- Import dashboards for:
  - Node exporter
  - Kubernetes cluster metrics
  - application HTTP metrics
- Create a dashboard with panels for:
  - API response time
  - request count per endpoint
  - pod CPU and memory
  - error rate

### Recommended monitoring stack

- Prometheus for scraping and alerting
- Alertmanager for notifications
- Grafana for visualization
- Kubernetes dashboard / metrics-server for cluster health

Typical alert rules:

- High API 5xx rate
- High CPU or memory usage
- Backend pod unavailable
- Database storage near limit
- Frontend error spike

## Recommended production setup

For a real deployment, use:

- Container registry: Docker Hub, GitHub Container Registry, or Azure Container Registry
- Kubernetes cluster: AKS, EKS, GKE, or local k3d/kind for testing
- Ingress controller: NGINX Ingress or Traefik
- Secrets management: Kubernetes Secrets or Azure Key Vault / AWS Secrets Manager
- TLS: cert-manager with Let’s Encrypt
- Backups: scheduled database backup and artifact retention

## Useful commands

```bash
# Backend
cd backend && npm install && npm start

# Frontend
cd frontend && python3 -m http.server 8080

# Build Docker images
docker build -t real-estate-frontend ./frontend
docker build -t real-estate-backend ./backend

# Kubernetes checks
kubectl get pods
kubectl get svc
kubectl logs deployment/real-estate-backend

# Monitoring
kubectl port-forward svc/prometheus-server 9090:80
kubectl port-forward svc/grafana 3000:80
```

## License

This project is intended for learning and demonstration purposes.
