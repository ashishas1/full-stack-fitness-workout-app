# SIXFORGE — Modern Full-Stack Gym & Fitness Platform

A production-grade, full-stack fitness, workout tracking, and membership platform built with **Next.js (React 19)**, **Node.js / Express**, **TypeScript**, **PostgreSQL**, **Prisma ORM**, and **Drizzle ORM**.

---

## ⚡ Quick Links & Live Services

| Service | Address | Description |
|---|---|---|
| **Web Frontend** | [http://localhost:3000](http://localhost:3000) | Next.js 16 Client App (Workouts, Library, Membership, Progress) |
| **Backend REST API** | [http://localhost:5000/api/v1](http://localhost:5000/api/v1) | Express.js Modular Monolith Engine |
| **Interactive API Docs** | [http://localhost:5000/api/v1/docs](http://localhost:5000/api/v1/docs) | Swagger / OpenAPI 3.0 Documentation |
| **System Health Check** | [http://localhost:5000/api/v1/health](http://localhost:5000/api/v1/health) | Deep health probe (PostgreSQL latency, cache, event bus) |

---

## 🔑 Demo Accounts & Credentials

### 1. Athlete Web App (`http://localhost:3000/login`)
| Role | Email | Password | Quick Login |
|---|---|---|:---:|
| **Demo Athlete** | `demo@sixforge.app` | `demo1234` | Click **"⚡ Quick Demo Athlete Login"** |
| **Ashish** | `ashish776280@gmail.com` | *(Self-registered)* | Use "Forgot Password" to reset anytime |

### 2. Backend Admin & Staff (`http://localhost:5000`)
| Role | Email | Password | Access Level |
|---|---|---|---|
| **Super Admin** | `admin@fitness.app` | `Admin@12345` | Full platform stats, user management, audit logs |
| **Head Coach** | `coach@fitness.app` | `Trainer@12345` | Custom workout programs, exercise curation |
| **Athlete** | `athlete@fitness.app` | `Athlete@12345` | Live workout sessions, PR detection |

---

## 🚀 How to Run the Project

### 1. Prerequisites
- **Node.js**: v20 or higher (`node -v`)
- **PostgreSQL**: Running locally on port `5433` (or configured in `.env`)

### 2. Start the Frontend (Next.js)
```bash
# In the project root:
cd C:\Users\ashis\Downloads\full-stack-fitness-workout-app
npm install
npm run dev
```
The frontend will boot on **`http://localhost:3000`**.

### 3. Start the Backend API (Express.js)
```bash
# In the backend directory:
cd backend
npm install
npm run dev
```
The backend will boot on **`http://localhost:5000`**.

### 4. Run Automated Backend Tests
```bash
cd backend
npm test
```
*(Runs 6 test suites and 30 integration tests across Commerce, Auth, Workouts, Exercises, Dashboard, and Admin).*

---

## 💳 Membership Plans & Payment System

Navigate to **`http://localhost:3000/dashboard/membership`** to explore the active tier system:

### 1. Active Pricing Tiers (INR ₹)
| Plan | Price (INR) | Duration | Features |
|---|:---:|:---:|---|
| **Monthly Pro** | **₹99** | 30 Days | 19+ exercises, audio workout companion, streak tracker, coach suggestions |
| **Yearly Elite** | **₹550** | 365 Days | *Save ₹638/year*. All 4 programs, 98-day heat map, custom routine builder |
| **VIP Lifetime** | **₹1,200** | Lifetime | Permanent VIP Founder badge, zero recurring fees, priority AI review |

### 2. Supported Payment Channels
1. **Instant UPI QR Code**:
   - Generates a **real, scannable UPI QR code** (`upi://pay?pa=sixforge.fit@icici&pn=SixForge%20Fitness&am=99.00&cu=INR`).
   - Compatible with Google Pay, PhonePe, Paytm, and BHIM apps.
   - After scanning and paying on your mobile, enter the **12-digit Bank UTR / Reference number** to verify and activate.
   - Includes a **⚡ Test UTR** button for rapid simulated verification.
2. **UPI ID / VPA**:
   - Enter your UPI VPA (e.g. `yourname@okhdfcbank`).
   - Dispatches a collect request with an interactive 3-minute approval countdown.
3. **RuPay / Visa / MasterCard**:
   - Clean, secure payment card form.
   - Interactive **3D Secure OTP verification modal** with simulated test OTP `123456`.
4. **Net Banking**:
   - Direct bank gateway authorization for HDFC, SBI, ICICI, Axis, Kotak, and PNB.
5. **Developer / Test Mode (Reset to Free)**:
   - On the membership page, click **"🔄 Reset to Free (Test Mode)"** at any time to reset your account to the Free Trial tier so you can test purchasing Monthly, Yearly, or Lifetime plans repeatedly.

---

## 🏋️ Key Application Features

### 1. Live Workout Companion & Stopwatch
- **Location**: `/dashboard/train`
- Interactive live workout player with audio countdown beeps for set reps, work duration, and rest intervals.
- Auto-saves completed sessions with calculated volume (kg) and calories burned.

### 2. 19+ Exercise Catalog
- **Location**: `/dashboard/exercises`
- Filter by target area (Upper, Lower, Obliques, Full), difficulty (Beginner, Intermediate, Advanced), or equipment.
- Illustrated 3D anatomical target cues, step-by-step form instructions, and pro coaching tips.
- Create, edit, and delete custom user exercises.

### 3. Body Progress & 98-Day Training Heatmap
- **Location**: `/dashboard/progress`
- Log body weight (kg), waist circumference (cm), and training journal notes.
- Interactive SVG trend line chart showing progress trajectories over time.
- GitHub-style 98-day workout consistency grid.

### 4. AI Coach Chat
- **Location**: `/dashboard/coach`
- Five-pillar core development blueprint (Nutrition, Resistance, Cardio, Sleep, Consistency).
- Interactive coach chat offering tailored workout recommendations based on your personal fitness goals and experience level.

### 5. Workout Programs & Routines
- **Location**: `/dashboard/plans`
- Pre-built multi-week training curricula:
  - *Hardcore Baseline* (Beginner)
  - *V-Taper Midline* (Intermediate)
  - *Atlas Core Armor* (Advanced)
  - *Shred Circuit 300* (Cardio/Abs)

---

## 🏛️ Project Structure

```
full-stack-fitness-workout-app/
├── src/                      # Next.js 16 Frontend Web Application
│   ├── app/
│   │   ├── api/              # Next.js API route handlers (Auth, Membership, Progress, Sessions)
│   │   ├── dashboard/        # Authenticated dashboard views (Train, Exercises, Plans, Coach, Membership)
│   │   ├── login/            # Athlete login page with forgot password & demo login
│   │   ├── signup/           # User registration flow
│   │   └── page.tsx          # High-converting landing page
│   ├── components/           # Reusable UI widgets, charts, and interactive clients
│   │   ├── membership-client.tsx # Dynamic UPI QR, Card 3DS, and NetBanking checkout
│   │   ├── workout-player.tsx    # Live session audio timer & set logger
│   │   ├── exercise-library.tsx  # Exercise catalog and filter system
│   │   └── progress-client.tsx   # Weight/waist charts & consistency heatmap
│   ├── db/                   # Drizzle ORM schema & seed data
│   └── lib/                  # JWT session cookies, password hashing, date utilities
├── backend/                  # Production Express.js REST API
│   ├── src/
│   │   ├── modules/
│   │   │   ├── identity/     # Auth, Users, Roles (RBAC), Sessions
│   │   │   ├── fitness/      # Exercises, Templates, Sessions, PRs, Programs
│   │   │   ├── commerce/     # Plans, Orders, UPI Payments, Invoices
│   │   │   └── administration/ # Metrics, Audit logs, User moderation
│   │   ├── infrastructure/   # Prisma DB, Memory/Redis Cache, Event Bus, HMAC Gateway
│   │   └── app.ts            # Express configuration, Helmet, CORS, Swagger
│   ├── prisma/               # 28 models, schema.prisma, and seed script
│   ├── tests/                # 6 Jest test suites (30 tests passing)
│   └── docs/                 # Architecture, Payments, Database, Security, and API docs
└── README.md                 # This root documentation file
```

---

## 🛡️ Security & Reliability

- **Password Hashing**: Bcrypt / Argon2 with adaptive salt rounds.
- **Cryptographic Order Signatures**: HMAC-SHA256 signature verification on all payments.
- **Idempotency**: All payment transactions verify order status to prevent duplicate charges or double extensions.
- **Sequential Invoices**: Tax-compliant invoice numbers generated sequentially (`INV-YYYY-XXXXX`).
- **Database Integrity**: Full foreign key cascading and atomic transactions.
