#!/usr/bin/env bash
# ==============================================================================
# ParkCloud - AWS EC2 Free Tier Automated Setup Script
# Ubuntu 22.04 LTS / 24.04 LTS
# ------------------------------------------------------------------------------
# Direct Hosting Architecture (No Docker):
# - Python 3 Virtual Environment (venv) + Uvicorn Systemd Service
# - Nginx Reverse Proxy (Serving React SPA build & routing /api to FastAPI)
# - Swap Space allocation (Prevents OOM on EC2 t2.micro / t3.micro with 1GB RAM)
# ==============================================================================

set -euo pipefail

# Visual Formatting
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

log_info() { echo -e "${BLUE}[INFO]${NC} $1"; }
log_success() { echo -e "${GREEN}[SUCCESS]${NC} $1"; }
log_warn() { echo -e "${YELLOW}[WARN]${NC} $1"; }
log_error() { echo -e "${RED}[ERROR]${NC} $1"; }

# 1. Check Root Privileges
if [ "$EUID" -ne 0 ]; then
    log_error "Please run this script as root or with sudo:"
    echo "  sudo bash $0"
    exit 1
fi

APP_DIR="/var/www/parkcloud"
BACKEND_DIR="${APP_DIR}/backend"
VENV_DIR="${BACKEND_DIR}/venv"
SCRIPTS_SOURCE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "${SCRIPTS_SOURCE_DIR}")"

log_info "=========================================================="
log_info "Starting ParkCloud AWS EC2 Infrastructure Setup..."
log_info "Working Directory: ${APP_DIR}"
log_info "=========================================================="

# 2. Configure 2GB Swap Memory (Critical for AWS Free Tier 1GB RAM instances)
if [ ! -f /swapfile ]; then
    log_info "Configuring 2GB Swap Memory to prevent Free Tier OOM crashes..."
    fallocate -l 2G /swapfile || dd if=/dev/zero of=/swapfile bs=1M count=2048
    chmod 600 /swapfile
    mkswap /swapfile
    swapon /swapfile
    echo '/swapfile none swap sw 0 0' >> /etc/fstab
    log_success "Swapfile created and mounted."
else
    log_info "Swapfile already exists, skipping."
fi

# 3. Update System & Install Core Dependencies
log_info "Updating apt packages and installing runtime dependencies..."
export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y \
    python3 \
    python3-pip \
    python3-venv \
    nginx \
    git \
    curl \
    libpq-dev \
    postgresql-client \
    build-essential \
    ufw

log_success "System dependencies installed."

# 4. Prepare Web Application Directories
log_info "Preparing application directory structure at ${APP_DIR}..."
mkdir -p "${APP_DIR}"
mkdir -p "${BACKEND_DIR}"

# Create a sample index.html if frontend is not yet built
if [ ! -f "${APP_DIR}/index.html" ]; then
    cat << 'EOF' > "${APP_DIR}/index.html"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ParkCloud - Smart Parking Reservation</title>
    <script src="https://cdn.tailwindcss.com"></script>
</head>
<body class="bg-orange-50/50 min-h-screen flex items-center justify-center font-sans">
    <div class="bg-white/80 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-orange-100 max-w-lg text-center">
        <div class="w-16 h-16 bg-orange-500 text-white rounded-2xl mx-auto flex items-center justify-center text-2xl font-bold shadow-lg shadow-orange-500/30 mb-4">
            P
        </div>
        <h1 class="text-2xl font-bold text-gray-900 mb-2">ParkCloud is Live!</h1>
        <p class="text-gray-600 mb-6">AWS EC2 Nginx Reverse Proxy & FastAPI Backend are successfully configured.</p>
        <div class="flex justify-center gap-3">
            <a href="/api/health" class="px-4 py-2 bg-orange-500 text-white font-medium rounded-lg hover:bg-orange-600 transition">API Health</a>
            <a href="/docs" class="px-4 py-2 bg-orange-100 text-orange-700 font-medium rounded-lg hover:bg-orange-200 transition">Swagger Docs</a>
        </div>
    </div>
</body>
</html>
EOF
fi

# Copy built frontend assets if dist folder exists
if [ -d "${PROJECT_ROOT}/frontend/dist" ]; then
    log_info "Syncing compiled React SPA build to ${APP_DIR}..."
    cp -r "${PROJECT_ROOT}/frontend/dist/"* "${APP_DIR}/"
fi

# 5. Copy Backend Files if source project exists locally
if [ -d "${PROJECT_ROOT}/backend" ] && [ "${PROJECT_ROOT}" != "${APP_DIR}" ]; then
    log_info "Syncing backend files to ${BACKEND_DIR}..."
    cp -r "${PROJECT_ROOT}/backend/"* "${BACKEND_DIR}/"
fi

# Ensure .env exists in backend
if [ ! -f "${BACKEND_DIR}/.env" ]; then
    if [ -f "${BACKEND_DIR}/.env.example" ]; then
        log_info "Creating default .env from .env.example..."
        cp "${BACKEND_DIR}/.env.example" "${BACKEND_DIR}/.env"
    else
        cat << 'EOF' > "${BACKEND_DIR}/.env"
PROJECT_NAME="ParkCloud API"
SECRET_KEY="generate_a_random_secret_in_production"
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/parkcloud"
AWS_REGION="us-east-1"
AWS_S3_BUCKET_NAME="parkcloud-passes"
EOF
    fi
fi

# 6. Setup Python Virtual Environment and Install Backend Requirements
log_info "Configuring Python 3 venv at ${VENV_DIR}..."
python3 -m venv "${VENV_DIR}"
"${VENV_DIR}/bin/pip" install --upgrade pip

if [ -f "${BACKEND_DIR}/requirements.txt" ]; then
    log_info "Installing Python dependencies from requirements.txt..."
    "${VENV_DIR}/bin/pip" install -r "${BACKEND_DIR}/requirements.txt"
    log_success "Backend dependencies installed successfully."
else
    log_warn "No requirements.txt found in ${BACKEND_DIR}. Skipping pip install."
fi

# 7. Configure Permissions
log_info "Configuring folder ownership and permissions..."
chown -R ubuntu:www-data "${APP_DIR}"
chmod -R 775 "${APP_DIR}"

# 8. Install Systemd Service
log_info "Installing ParkCloud systemd service..."
if [ -f "${SCRIPTS_SOURCE_DIR}/parkcloud.service" ]; then
    cp "${SCRIPTS_SOURCE_DIR}/parkcloud.service" /etc/systemd/system/parkcloud.service
elif [ -f "${PROJECT_ROOT}/scripts/parkcloud.service" ]; then
    cp "${PROJECT_ROOT}/scripts/parkcloud.service" /etc/systemd/system/parkcloud.service
else
    log_error "parkcloud.service not found!"
    exit 1
fi

systemctl daemon-reload
systemctl enable parkcloud
systemctl restart parkcloud
log_success "ParkCloud systemd service enabled and started."

# 9. Configure Nginx
log_info "Configuring Nginx Reverse Proxy..."
if [ -f "${SCRIPTS_SOURCE_DIR}/nginx.conf" ]; then
    cp "${SCRIPTS_SOURCE_DIR}/nginx.conf" /etc/nginx/sites-available/parkcloud
elif [ -f "${PROJECT_ROOT}/scripts/nginx.conf" ]; then
    cp "${PROJECT_ROOT}/scripts/nginx.conf" /etc/nginx/sites-available/parkcloud
else
    log_error "nginx.conf not found!"
    exit 1
fi

# Remove default site if enabled
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm -f /etc/nginx/sites-enabled/default
fi

# Enable parkcloud site
ln -sf /etc/nginx/sites-available/parkcloud /etc/nginx/sites-enabled/

# Test Nginx configuration
nginx -t
systemctl restart nginx
log_success "Nginx configured and reloaded."

# 10. Firewall Configuration (UFW)
log_info "Configuring UFW Firewall (allowing SSH, HTTP, HTTPS)..."
ufw allow OpenSSH || true
ufw allow 'Nginx Full' || ufw allow 80/tcp
ufw --force enable || true

# 11. Final Status Output
log_info "=========================================================="
log_success "ParkCloud Server Setup Complete!"
log_info "=========================================================="
echo -e "Service Status:"
systemctl status parkcloud --no-pager -l || true
echo ""
echo -e "Verify endpoints:"
echo "  Frontend SPA: http://<EC2-PUBLIC-IP>/"
echo "  API Health:   http://<EC2-PUBLIC-IP>/api/health"
echo "  Swagger Docs: http://<EC2-PUBLIC-IP>/docs"
echo ""
echo -e "View backend live logs: sudo journalctl -u parkcloud -f"
echo -e "Restart backend service: sudo systemctl restart parkcloud"
echo -e "Restart Nginx proxy:    sudo systemctl restart nginx"
