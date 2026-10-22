# 🅿️ ParkCloud - Cloud-Based Smart Parking Slot Reservation & Allocation Platform

> A full-stack, enterprise-grade cloud parking reservation, allotment, and gate validation platform built with **FastAPI (Python 3.11+)**, **React.js (Vite + Tailwind CSS)**, **SQLAlchemy 2.0 ORM**, **PostgreSQL (AWS RDS)**, **AWS S3 (SSE-S3 Encrypted Passes)**, **AWS SES**, **Nginx Reverse Proxy**, and **Systemd Service Automation** (Optimized for **AWS Free Tier** without Docker).

---

## 🌟 Key Features

### Authentication & Role-Based Access Control (RBAC)
- **Master Password Security**: User credentials securely salted and hashed with `bcrypt`, ensuring plain-text passwords never reach storage.
- **JWT Session Authorization**: Stateless, secure Bearer token authentication safeguarding all driver actions, gate validations, and admin analytics.
- **Role-Based Access Control (RBAC)**: Distinct authorization scopes isolating capabilities for **Vehicle Drivers**, **Gate Attendants**, and **System Administrators**.
- **Instant Demo Login**: One-click demo role selector (`🚗 Driver`, `🎫 Attendant`, `🛡️ Admin`) on the authentication portal for fast feature evaluation.

### Driver Portal & Live Slot Allotment
- **Real-Time Facility Availability**: Live capacity counters, hourly pricing, and geolocation addresses across multi-level parking garages.
- **Interactive Visual Slot Grid**: Color-coded slot floor plans with categorized allotments for **Standard Cars**, **Motorcycles**, and **EV Charging Stations**.
- **Dynamic Reservation Engine**: Real-time pricing calculator with duration slider, license plate validation, and mock prepaid transaction records.
- **Digital QR Parking Pass**: In-browser high-resolution QR rendering and encrypted PDF pass download generated in real time using ReportLab & Pillow.

### Gate Attendant & Verification Console
- **Instant Gate Pass Scanner**: Search and scan console to validate driver QR code hashes or barcodes at lot entrance and exit gates.
- **Two-Phase Gate State Machine**: Automatic lifecycle transitions from `booked` $\to$ `checked_in` upon arrival, and `checked_in` $\to$ `completed` upon departure.
- **Automated Slot Release**: Immediately frees allocated slots and replenishes facility available capacity the instant a vehicle checks out.
- **Session Gate Activity Log**: Real-time attendant audit feed recording entry/exit actions, driver names, vehicle numbers, and timestamps.

### Administrative Control & Cloud Analytics
- **Real-Time Occupancy Gauges**: Visual capacity progress gauges with automated **>85% Full Alert** warnings for proactive lot overflow management.
- **Revenue & Booking Metrics**: Aggregate lifetime revenue summaries, active in-lot vehicle counts, and financial transaction histories.
- **24-Hour Peak Traffic Distribution**: Hourly histogram statistics tracking morning rush, afternoon, and evening booking demand.
- **Dynamic Facility Management**: Administrative creation of new parking lots with automatic alphanumeric slot generation (e.g. `A-101` to `C-120`).
- **1-Click Sample Data Seeder**: Built-in seeding engine populating multi-facility parking structures and slots for zero-friction evaluation.

### AWS Free Tier & Direct Hosting Architecture (No Docker)
- **Server-Side Encrypted S3 Storage**: Parking passes and PDF certificates encrypted at rest using AWS S3 SSE-S3 (`AES256`).
- **Automated Email Dispatch via AWS SES**: Confirmation ticket dispatch with embedded PDF pass download links.
- **Native EC2 Systemd Daemon**: Uvicorn application service running with auto-restart resilience (`Restart=always`) and system sandboxing.
- **Nginx Reverse Proxy**: High-performance caching, Gzip compression, and seamless `/api` proxy routing.
- **Out-Of-Memory Protection**: Automated 2GB swap space allocation script shielding Free Tier 1GB RAM instances (`t2.micro` / `t3.micro`).

---

## 📂 Project Structure

```text
parking-allotment/
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Actions CI/CD (SSH EC2 zero-downtime deployment)
├── backend/
│   ├── app/
│   │   ├── core/
│   │   │   ├── config.py         # Pydantic environment settings & AWS configuration
│   │   │   ├── database.py       # SQLAlchemy 2.0 ORM engine & get_db dependency
│   │   │   └── security.py       # Bcrypt hashing, JWT tokens & RBAC require_role
│   │   ├── models/
│   │   │   ├── user.py           # User authentication & role entity
│   │   │   ├── parking.py        # ParkingLot & Slot entities
│   │   │   ├── reservation.py    # Reservation & Payment entities
│   │   │   └── audit.py          # System audit trail entity
│   │   ├── schemas/
│   │   │   ├── user.py           # Auth request/response validation schemas
│   │   │   ├── parking.py        # Lot & visual slot grid schemas
│   │   │   ├── reservation.py    # Booking & QR pass verification schemas
│   │   │   └── analytics.py      # Occupancy & peak hour analytics schemas
│   │   ├── routers/
│   │   │   ├── auth.py           # Register, login & profile endpoints
│   │   │   ├── parking_lots.py   # Live facility availability & lot creation
│   │   │   ├── slots.py          # Interactive visual slot grid endpoint
│   │   │   ├── reservations.py   # Booking, mock payment, S3 PDF pass & SES email
│   │   │   ├── verify.py         # Attendant QR gate verification (Check-In / Check-Out)
│   │   │   └── admin.py          # Capacity gauges, revenue analytics & seeder
│   │   ├── services/
│   │   │   ├── s3_service.py     # AWS S3 uploader with SSE-S3 AES-256 encryption
│   │   │   ├── qr_pdf_service.py # ReportLab branded PDF pass & QR code generator
│   │   │   └── ses_service.py    # AWS SES email confirmation ticket dispatcher
│   │   └── main.py               # FastAPI application entrypoint & static mounts
│   ├── requirements.txt          # Python dependencies
│   ├── seed_demo.py              # Initial demo accounts & parking lots seeder
│   └── .env.example              # Environment variables template
├── docs/
│   └── aws_infrastructure_blueprint.md # Full AWS ASG, ALB, S3 & CloudWatch blueprints
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx        # Role-aware navigation with Pale Orange branding
│   │   │   ├── SlotGrid.jsx      # Visual slot grid (Car, Bike, EV with status states)
│   │   │   ├── BookingModal.jsx  # License plate input, duration slider & instant PDF pass
│   │   │   └── PassCard.jsx      # Live QR code SVG pass card & cancel actions
│   │   ├── context/
│   │   │   └── AuthContext.jsx   # Global session state & Bearer token management
│   │   ├── pages/
│   │   │   ├── Login.jsx         # Sign-in portal with 1-click demo role pills
│   │   │   ├── Register.jsx      # Registration portal with role selector
│   │   │   ├── Dashboard.jsx     # Facility search, capacity meters & slot grid
│   │   │   ├── MyPasses.jsx      # Active & completed driver parking passes
│   │   │   ├── AttendantScanner.jsx # Gate scanner & live check-in / check-out log
│   │   │   └── AdminAnalytics.jsx# Capacity gauges, >85% alert & revenue stats
│   │   ├── services/
│   │   │   └── api.js            # Axios client with Bearer Token auth interceptor
│   │   ├── App.jsx               # SPA routing & cloud footer
│   │   ├── index.css             # Tailwind CSS tokens & custom peach scrollbars
│   │   └── main.jsx              # React DOM entry point
│   ├── package.json              # Frontend dependencies (React, Vite, Tailwind, Lucide)
│   ├── tailwind.config.js        # Extended peach palette tokens (#fff9f5 to #7c2d12)
│   └── vite.config.js            # Vite bundler & reverse proxy configuration
├── scripts/
│   ├── parkcloud.service         # Systemd service daemon unit file
│   ├── nginx.conf                # Nginx reverse proxy routing port 80 & /api
│   ├── setup_ec2.sh              # Automated EC2 bootstrapping script with 2GB swap
│   └── deploy.sh                 # Zero-downtime deployment & asset sync script
├── locustfile.py                 # Load testing benchmark (100 to 1,000 drivers)
├── .gitignore                    # Git ignore rules for node_modules, venv & secrets
├── LICENSE                       # MIT License
└── README.md                     # Master project documentation
```

---

## 💻 Installation & Setup

### Prerequisites
- **Python**: v3.10 or higher
- **Node.js**: v18.0.0 or higher (with npm)
- **Database**: PostgreSQL 14+ (Local or AWS RDS) or SQLite (Default local fallback)
- **Operating System**: Linux (Ubuntu 22.04 LTS / 24.04 LTS) or Windows 10/11

---

### 1. Clone Repository
```bash
git clone https://github.com/shyamsundarmd19-hub/parking-allotment-.git
cd parking-allotment-
```

---

### 2. Backend Setup
Navigate into the backend directory, initialize a Python virtual environment, and install dependencies:

```bash
cd backend
python -m venv venv

# On Linux / macOS:
source venv/bin/activate

# On Windows (PowerShell):
.\venv\Scripts\Activate.ps1

# Install required packages
pip install --upgrade pip
pip install -r requirements.txt
```

---

### 3. Frontend Setup
In a separate terminal, navigate into the frontend directory and install dependencies:

```bash
cd frontend
npm install
npm run build
```

---

### 4. Database Setup & Seeding
Create the database tables and seed initial demo facilities, slots, and user accounts:

```bash
cd backend
python seed_demo.py
```

---

### 5. Configure Environment Variables
Verify or adjust your `.env` file in the `backend/` directory:

```env
PROJECT_NAME="ParkCloud API"
VERSION="1.0.0"
SECRET_KEY="generate_a_secure_random_32_character_secret_key"
ACCESS_TOKEN_EXPIRE_MINUTES=1440

# Database Configuration (SQLite for local zero-friction execution, PostgreSQL for AWS RDS)
DATABASE_URL="sqlite:///./parkcloud.db"
# Or AWS RDS: "postgresql://postgres:YourPassword@your-rds-endpoint.amazonaws.com:5432/parkcloud"

# AWS Configuration (Leave empty to enable automatic local storage fallback)
AWS_REGION="us-east-1"
AWS_ACCESS_KEY_ID=""
AWS_SECRET_ACCESS_KEY=""
AWS_S3_BUCKET_NAME="parkcloud-passes"
AWS_SES_SENDER_EMAIL="noreply@parkcloud.app"
```

---

### 6. Automated Native EC2 Setup (AWS Deployment)
For automated, Docker-free direct hosting on an **AWS EC2 Ubuntu Free Tier** instance:

```bash
# Execute as root on the EC2 instance:
sudo bash scripts/setup_ec2.sh
```

The script automatically allocates a **2GB swap file** (preventing out-of-memory crashes on `t2.micro` 1GB RAM instances), installs Python 3, venv, Nginx, compiles the React SPA, registers the `parkcloud.service` systemd daemon, and configures UFW firewall rules.

---

### 7. Run the Application Locally

#### Start the FastAPI Backend:
```bash
cd backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```

#### Start the React Frontend:
```bash
cd frontend
npm run dev
```

Visit **[http://localhost:3001](http://localhost:3001)** (or **http://localhost:3000**) in your browser.

---

## 🌐 Live Demo & Endpoints

- **Frontend Web Application**: [http://localhost:3001](http://localhost:3001)
- **FastAPI Backend Service**: [http://localhost:8000](http://localhost:8000)
- **Interactive Swagger API Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Health Check Endpoint**: [http://localhost:8000/api/health](http://localhost:8000/api/health)
- **GitHub Repository**: [https://github.com/shyamsundarmd19-hub/parking-allotment-.git](https://github.com/shyamsundarmd19-hub/parking-allotment-.git)

---

## 🔑 Default Accounts & Sample Tracking Data (Created Automatically)

| Role / Entity | Email / Identifier | Default Password | Features Accessible |
| :--- | :--- | :--- | :--- |
| **Vehicle Driver** | `driver@parkcloud.app` | `password123` | Search lots, interactive slot layout, booking with S3 PDF pass & QR code |
| **Gate Attendant** | `attendant@parkcloud.app` | `password123` | Gate scanner, QR pass validation, 1-click Check-In / Check-Out state transitions |
| **Administrator** | `admin@parkcloud.app` | `password123` | Real-time lot occupancy gauges, >85% Full Alert, revenue stats & facility creation |
| **Custom Registration** | Any valid email | User-defined (6+ chars) | Private account dashboard, digital passes, vehicle reservations |
| **Pre-Seeded Facilities** | 3 Major Garages | Pre-configured tariffs | Central Plaza Garage, Skyline Tech Park, Airport Express Terminal |

*(Tip: On the Sign In screen, click the **🚗 Driver**, **🎫 Attendant**, or **🛡️ Admin** quick demo buttons to autofill credentials instantly).*

---

## 🔒 Security Best Practices Implemented

- **Bcrypt Password Hashing**: Passwords salted and hashed with `bcrypt`, preventing rainbow-table attacks and credential leaks.
- **Stateless JWT Authorization**: User sessions authenticated via signed JWT tokens carrying encrypted role claims and automatic expiration.
- **AWS S3 Server-Side Encryption (SSE-S3)**: Digital passes encrypted at rest with `AES256` keys managed directly by AWS.
- **TLS 1.2+ In-Transit Encryption**: All public communications enforced over HTTPS/TLS, with S3 bucket policies rejecting unencrypted transport.
- **SQL Injection Prevention**: 100% of database queries constructed via parameterized SQLAlchemy 2.0 ORM expressions.
- **Least-Privilege IAM Policies**: Dedicated IAM instance profile restricting EC2 access strictly to `passes/*` S3 prefixes and verified SES sender identities.
- **Sandboxed Systemd Execution**: The backend service runs under non-root user `ubuntu:www-data` with `ProtectSystem=full` and `PrivateTmp=true`.
- **Memory Defense**: Automated 2GB swap space partition shields AWS Free Tier micro instances from sudden memory exhaustion.

---

## ⚡ Continuous Integration & Load Testing

### 1. GitHub Actions CI/CD Pipeline
Every push to `main` executes [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml):
- Syntactically validates backend Python modules and imports.
- Compiles the React SPA production bundle.
- Deploys via secure SSH to the AWS EC2 instance and triggers `scripts/deploy.sh` with zero downtime.

**Required GitHub Repository Secrets**:
- `EC2_HOST`: Elastic IP or public DNS of the EC2 instance.
- `EC2_USER`: `ubuntu`
- `EC2_SSH_KEY`: Private `.pem` key corresponding to the EC2 key pair.

### 2. High-Capacity Load Testing with Locust
Run [`locustfile.py`](locustfile.py) to simulate between 100 and 1,000 drivers and gate attendants simultaneously:

```bash
# Run headless benchmark simulating 500 concurrent drivers generating reports:
locust -f locustfile.py --host http://<EC2-PUBLIC-IP> \
  --users 500 \
  --spawn-rate 50 \
  --run-time 2m \
  --headless \
  --html load_test_report.html \
  --csv load_test_metrics
```

---

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.
