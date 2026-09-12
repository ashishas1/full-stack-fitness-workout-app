# Modern Gym & Fitness Platform - Production Backend API

A high-performance, enterprise-ready RESTful backend powering a complete gym and fitness web platform. Built with **Node.js**, **TypeScript**, **Express**, **PostgreSQL**, **Prisma ORM**, **Zod**, and **JWT**.

---

## 🌟 Features & Capabilities

- 🔐 **Authentication & Authorization**:
  - Email & password registration with Argon2/Bcrypt password hashing.
  - JWT token pair architecture (15-minute access token, 30-day refresh token).
  - Secure refresh token rotation and revocation.
  - Role-Based Access Control (RBAC): `USER`, `TRAINER`, and `ADMIN`.
- 🏋️ **Comprehensive Exercise Library**:
  - Full-text search and multi-criteria filtering (muscle group, category, equipment, difficulty).
  - Standard exercises library + user-created custom exercises.
  - User exercise favoriting system.
- 📋 **Workout Templates**:
  - Create and manage multi-exercise routines with target sets, reps, target RPE, and rest intervals.
  - Public community templates and one-click template cloning into private library.
- ⏱️ **Live Workout Session Tracking**:
  - Start live workout sessions from scratch or pre-loaded templates.
  - Log completed sets with weight (kg), reps, RPE, and warmup flags.
  - Automatic session duration, total volume (kg), and calorie expenditure calculations.
- 🏆 **Automated PR (Personal Record) Detection**:
  - Automatically analyzes completed sessions for Heaviest Weight, Max Reps, Estimated 1RM (Epley & Brzycki formulas), and Max Volume.
  - Historical progression timeline per exercise.
- 📈 **Body Progress & Analytics**:
  - Body measurements tracking (Weight, Body Fat %, Chest, Waist, Arms, Thighs, Hips, Calves).
  - Visual progress photos with photo type categorization (`FRONT`, `BACK`, `SIDE`).
  - Weekly volume progression, muscle group distribution charts, and GitHub-style workout consistency heatmaps.
- 📊 **Unified Dashboard**:
  - Aggregated endpoint returning active workout session, current & longest streaks, weekly consistency vs target, recent PRs, and active program status.
- 🤖 **Smart Recommendation Engine**:
  - Identifies underworked muscle groups based on recent training history and recommends targeted exercises.
- 🎯 **Multi-Week Workout Programs**:
  - Structured multi-week programs with day-by-day routines and user enrollment progress tracking.
- 🔔 **In-App Notifications**:
  - Automated alerts for new PRs, streak milestones, and program achievements.
- 🛡️ **Enterprise Security & Reliability**:
  - Helmet HTTP security headers.
  - Granular CORS configuration.
  - Rate limiting (auth routes and global endpoints).
  - Strict input validation via Zod schemas.
  - Centralized error handling and Prisma transaction safety.
  - Swagger / OpenAPI 3.0 documentation at `/api/docs`.

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Runtime & Language** | Node.js (v20+) & TypeScript 5.7 (Strict Mode) |
| **Framework** | Express.js 4.21 |
| **Database** | PostgreSQL 16/18 |
| **ORM** | Prisma ORM 6.4 |
| **Validation** | Zod 3.24 |
| **Security & Auth** | JSON Web Tokens (`jsonwebtoken`), `bcryptjs`, `helmet`, `cors` |
| **Documentation** | Swagger / OpenAPI 3.0 (`swagger-ui-express`, `swagger-jsdoc`) |
| **File Storage** | Pluggable storage abstraction (`LocalStorageService`) |
| **Testing** | Jest 29, Supertest 7, `ts-jest` |

---

## 📂 Project Structure

```
backend/
├── prisma/
│   ├── schema.prisma         # 20+ Prisma models & relationships
│   └── seed.ts               # Idempotent seed (exercises, programs, templates, demo users)
├── src/
│   ├── config/               # Database singleton, environment parsing, swagger
│   ├── constants/            # Enums, HTTP codes, roles
│   ├── controllers/          # Thin request/response controllers
│   ├── middleware/           # auth, validate, errorHandler, rateLimiter, upload
│   ├── routes/               # Modular Express routers
│   ├── services/             # Core business logic, analytics, PR detection
│   ├── types/                # Authenticated request types and shared interfaces
│   ├── utils/                # 1RM calculations, streaks, custom errors, security
│   ├── validators/           # Zod validation schemas and inferred types
│   ├── app.ts                # Express app configuration & middleware
│   └── server.ts             # Server entrypoint & graceful shutdown
├── tests/                    # Integration test suites (Auth, Exercises, Workouts, RBAC)
├── uploads/                  # Local media directory for uploads
├── Dockerfile                # Multi-stage production container
├── docker-compose.yml        # PostgreSQL & Backend API orchestration
└── package.json
```

---

## 🚀 Quickstart Guide

### 1. Prerequisites
- Node.js 20+ and npm
- PostgreSQL running locally or in Docker

### 2. Configure Environment Variables
Copy `.env.example` to `.env` and verify database credentials:
```bash
cp .env.example .env
```
Default connection string for local PostgreSQL:
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
DATABASE_URL=postgresql://postgres@127.0.0.1:5433/fitness_backend_db?schema=public
JWT_SECRET=your_jwt_access_secret
JWT_REFRESH_SECRET=your_jwt_refresh_secret
```

### 3. Install Dependencies
```bash
npm install
```

### 4. Database Setup & Seed
Synchronize Prisma schema and seed database with 23+ exercises, starter workout templates, achievements, and demo accounts:
```bash
# Push schema to database
npx prisma db push

# Seed starter exercises, templates, programs, and test users
npm run prisma:seed
```

### 5. Run the Server
```bash
# Development mode with hot-reload
npm run dev

# Production build and run
npm run build
npm start
```
The server will start at `http://localhost:5000`.

---

## 📖 API Documentation (Swagger UI)

Interactive OpenAPI documentation is available at:
👉 **[http://localhost:5000/api/docs](http://localhost:5000/api/docs)**

Download raw OpenAPI JSON:
👉 `http://localhost:5000/api/docs.json`

---

## 📡 Core API Routes

### 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/auth/register` | Register new athlete account | No |
| `POST` | `/api/auth/login` | Log in and receive access + refresh tokens | No |
| `POST` | `/api/auth/refresh-token` | Rotate refresh token and get new access token | No |
| `POST` | `/api/auth/logout` | Revoke refresh token | No |
| `POST` | `/api/auth/forgot-password`| Request password reset link/token | No |
| `POST` | `/api/auth/reset-password` | Reset password using valid token | No |
| `POST` | `/api/auth/change-password`| Change current password | Yes |
| `GET`  | `/api/auth/me` | Get authenticated user info | Yes |

### 🏋️ Exercises (`/api/exercises`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET`  | `/api/exercises` | List exercises (filters: category, equipment, search) | Optional |
| `GET`  | `/api/exercises/:id` | Get exercise details | Optional |
| `POST` | `/api/exercises` | Create custom exercise | Yes |
| `PATCH`| `/api/exercises/:id` | Update custom exercise (or admin) | Yes |
| `DELETE`| `/api/exercises/:id`| Delete custom exercise (or admin) | Yes |
| `POST` | `/api/exercises/:id/favorite` | Toggle favorite exercise | Yes |
| `GET`  | `/api/exercises/favorites` | Get user favorite exercises | Yes |

### 📋 Workout Templates (`/api/workouts`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET`  | `/api/workouts` | List templates (personal & public) | Yes |
| `POST` | `/api/workouts` | Create new workout template | Yes |
| `GET`  | `/api/workouts/:id` | Get template by ID | Yes |
| `PATCH`| `/api/workouts/:id` | Update template | Yes |
| `DELETE`| `/api/workouts/:id`| Delete template | Yes |
| `POST` | `/api/workouts/:id/clone` | Clone template to personal library | Yes |
| `POST` | `/api/workouts/:id/favorite`| Toggle favorite template | Yes |

### ⏱️ Workout Sessions & Live Tracking (`/api/sessions`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/sessions/start` | Start live session (from template or blank) | Yes |
| `GET`  | `/api/sessions/active` | Get current in-progress session | Yes |
| `GET`  | `/api/sessions` | List user workout history | Yes |
| `GET`  | `/api/sessions/:id` | Get session details with exercises & sets | Yes |
| `POST` | `/api/sessions/:id/exercises` | Add exercise to live session | Yes |
| `POST` | `/api/sessions/:id/exercises/:sessionExerciseId/sets` | Log completed set | Yes |
| `PATCH`| `/api/sessions/:id/sets/:setId` | Update logged set | Yes |
| `DELETE`| `/api/sessions/:id/sets/:setId`| Delete logged set | Yes |
| `POST` | `/api/sessions/:id/complete` | Complete workout (auto-triggers PR & volume check) | Yes |
| `POST` | `/api/sessions/:id/abandon` | Mark session abandoned | Yes |
| `GET`  | `/api/sessions/prs` | Get user Personal Records | Yes |
| `GET`  | `/api/sessions/prs/timeline/:exerciseId` | Get 1RM progression timeline | Yes |

### 📈 Progress & Analytics (`/api/progress`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `POST` | `/api/progress/measurements` | Record body measurements | Yes |
| `GET`  | `/api/progress/measurements` | List historical measurements | Yes |
| `POST` | `/api/progress/photos` | Upload progress photo (multipart/form-data) | Yes |
| `GET`  | `/api/progress/photos` | Get photos by pose type | Yes |
| `GET`  | `/api/progress/analytics/weight` | Weight progression trend points | Yes |
| `GET`  | `/api/progress/analytics/volume` | Weekly volume progression | Yes |
| `GET`  | `/api/progress/analytics/muscle-distribution` | Muscle sets & volume breakdown | Yes |
| `GET`  | `/api/progress/analytics/consistency` | Year-round consistency dates | Yes |

### 📊 Dashboard & Recommendations
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET`  | `/api/dashboard` | Aggregated dashboard: streak, recent sessions, PRs | Yes |
| `GET`  | `/api/recommendations` | Smart underworked muscle & workout suggestions | Yes |

### 🎯 Workout Programs (`/api/programs`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET`  | `/api/programs` | List multi-week programs | No |
| `GET`  | `/api/programs/:id` | Get program curriculum & enrollment status | Optional |
| `POST` | `/api/programs/:id/enroll` | Enroll in program | Yes |
| `POST` | `/api/programs/:id/progress`| Advance week / day in program | Yes |

### 💳 Commerce & Memberships (`/api/v1/commerce` or `/api/commerce`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET`  | `/api/v1/commerce/plans` | List active plans (₹99 Monthly, ₹550 Yearly, ₹1200 Lifetime) | No |
| `POST` | `/api/v1/commerce/order` | Create cryptographic payment order & UPI QR code | Yes |
| `POST` | `/api/v1/commerce/verify` | Verify payment signature & activate membership | Yes |
| `GET`  | `/api/v1/commerce/my-membership` | Get user active membership & expiry | Yes |
| `GET`  | `/api/v1/commerce/invoices` | List user tax invoices | Yes |
| `GET`  | `/api/v1/commerce/invoices/:id` | Get detailed invoice (`INV-YYYY-XXXXX`) | Yes |

### 🛡️ Admin (`/api/v1/admin` or `/api/admin`)
| Method | Endpoint | Description | Auth Required |
|---|---|---|---|
| `GET`  | `/api/admin/users` | List platform users with filters | Admin only |
| `GET`  | `/api/admin/users/:id` | Detailed user inspection | Admin only |
| `PATCH`| `/api/admin/users/:id/status`| Suspend or activate user | Admin only |
| `PATCH`| `/api/admin/users/:id` | Update user role or status (with audit trail) | Admin only |
| `GET`  | `/api/admin/stats` | Platform-wide MRR, revenue, volume, and user stats | Admin only |
| `GET`  | `/api/admin/payments` | All platform payment transactions | Admin only |
| `GET`  | `/api/admin/audit-logs`| Query append-only audit trail | Admin only |

---

## 🧪 Testing

Run the automated integration test suite with Jest:
```bash
npm test
```

---

## 🐳 Docker Deployment

Run the complete platform and PostgreSQL database with Docker Compose:
```bash
docker compose up -d --build
```
Check container logs:
```bash
docker compose logs -f api
```
Stop services:
```bash
docker compose down
```

---

## 🔑 Default Seed Accounts

After running `npm run prisma:seed`:
- **Admin**: `admin@fitness.app` / `Admin@12345`
- **Trainer**: `coach@fitness.app` / `Trainer@12345`
- **Athlete**: `athlete@fitness.app` / `Athlete@12345`
