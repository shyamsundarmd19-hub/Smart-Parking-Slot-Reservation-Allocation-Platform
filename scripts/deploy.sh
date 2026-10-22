#!/usr/bin/env bash
# ==============================================================================
# ParkCloud - Automated Native EC2 Deployment Script
# ------------------------------------------------------------------------------
# Direct Native Hosting:
# 1. Pulls latest git commits from origin/main
# 2. Activates Python Virtual Environment & updates requirements
# 3. Builds React Frontend SPA into production bundle (/var/www/parkcloud)
# 4. Restarts FastAPI Uvicorn Systemd daemon
# 5. Reloads Nginx reverse proxy with zero downtime
# 6. Executes automated health check verification
# ==============================================================================

set -euo pipefail

# Visual Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

APP_DIR="/var/www/parkcloud"
BACKEND_DIR="${APP_DIR}/backend"
VENV_DIR="${BACKEND_DIR}/venv"
FRONTEND_SOURCE_DIR="${APP_DIR}/frontend_repo"

# Identify repository root directory
SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(dirname "${SCRIPTS_DIR}")"

log_info "=========================================================="
log_info "Starting ParkCloud Automated EC2 Deployment..."
log_info "Timestamp: $(date -u +"%Y-%m-%dT%H:%M:%SZ")"
log_info "Working Repo Root: ${REPO_ROOT}"
log_info "=========================================================="

# 1. Pull Latest Changes from Git
cd "${REPO_ROOT}"
if [ -d ".git" ]; then
    log_info "Fetching latest commits from Git remote origin..."
    git fetch origin main
    git reset --hard origin/main
    log_success "Repository updated to latest commit $(git rev-parse --short HEAD)."
else
    log_warn "Not a git clone root; continuing with local filesystem changes."
fi

# 2. Update Python Backend
log_info "Updating FastAPI Backend Virtual Environment..."
if [ ! -d "${VENV_DIR}" ]; then
    log_info "Creating virtual environment at ${VENV_DIR}..."
    python3 -m venv "${VENV_DIR}"
fi

# Activate venv & install dependencies
source "${VENV_DIR}/bin/activate"
pip install --upgrade pip setuptools wheel
if [ -f "${REPO_ROOT}/backend/requirements.txt" ]; then
    log_info "Installing / updating dependencies from requirements.txt..."
    pip install -r "${REPO_ROOT}/backend/requirements.txt"
    log_success "Backend dependencies successfully synced."
fi

# Sync backend source code to /var/www/parkcloud/backend
if [ "${REPO_ROOT}/backend" != "${BACKEND_DIR}" ]; then
    log_info "Syncing backend code to ${BACKEND_DIR}..."
    mkdir -p "${BACKEND_DIR}"
    rsync -av --exclude 'venv' --exclude '__pycache__' --exclude '*.pyc' "${REPO_ROOT}/backend/" "${BACKEND_DIR}/"
fi

# Ensure .env exists
if [ ! -f "${BACKEND_DIR}/.env" ] && [ -f "${REPO_ROOT}/backend/.env.example" ]; then
    log_warn "Creating default .env from .env.example..."
    cp "${REPO_ROOT}/backend/.env.example" "${BACKEND_DIR}/.env"
fi

# 3. Build & Deploy React Frontend SPA
log_info "Building React Frontend SPA..."
FRONTEND_DIR="${REPO_ROOT}/frontend"
if [ -d "${FRONTEND_DIR}" ] && [ -f "${FRONTEND_DIR}/package.json" ]; then
    cd "${FRONTEND_DIR}"
    
    # Check if npm is available
    if command -v npm &> /dev/null; then
        log_info "Installing frontend node packages..."
        npm ci || npm install
        log_info "Compiling production Vite assets..."
        npm run build
        
        # Copy compiled bundle to Nginx root directory
        log_info "Deploying frontend build assets to ${APP_DIR}..."
        mkdir -p "${APP_DIR}"
        sudo cp -r dist/* "${APP_DIR}/"
        log_success "React SPA deployed successfully."
    elif [ -d "${FRONTEND_DIR}/dist" ]; then
        log_info "Copying pre-built dist assets to ${APP_DIR}..."
        sudo cp -r dist/* "${APP_DIR}/"
        log_success "Pre-built React SPA copied."
    else
        log_warn "Node.js / npm not found and no dist folder present. Skipping frontend build."
    fi
fi

# 4. Set Correct Permissions
log_info "Applying filesystem permissions to ubuntu:www-data..."
sudo chown -R ubuntu:www-data "${APP_DIR}"
sudo chmod -R 775 "${APP_DIR}"

# 5. Restart Backend Systemd Service
log_info "Restarting parkcloud systemd service..."
sudo systemctl daemon-reload
sudo systemctl restart parkcloud
sudo systemctl is-active --quiet parkcloud && log_success "parkcloud.service is active and running." || {
    log_error "parkcloud.service failed to restart!"
    sudo journalctl -u parkcloud -n 25 --no-pager
    exit 1
}

# 6. Reload Nginx Reverse Proxy
log_info "Testing and reloading Nginx..."
sudo nginx -t
sudo systemctl reload nginx
log_success "Nginx successfully reloaded."

# 7. Health Check Verification
log_info "Verifying backend health check endpoint..."
sleep 2
HEALTH_RESPONSE=$(curl -s http://127.0.0.1:8000/api/health || echo "FAILED")

if [[ "${HEALTH_RESPONSE}" == *"ok"* ]]; then
    log_success "Health check PASSED: ${HEALTH_RESPONSE}"
else
    log_warn "Health check returned unexpected response: ${HEALTH_RESPONSE}"
fi

log_info "=========================================================="
log_success "ParkCloud Deployment Finished Successfully!"
log_info "=========================================================="
