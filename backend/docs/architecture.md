# Architectural Design Document: Gym Platform Backend

## 1. Core Architectural Principle: Modular Monolith

The backend is architected as a **Domain-Driven Modular Monolith**. All core business domains reside within the same codebase and runtime process, but each domain enforces strict boundaries between:
- **Presentation Layer** (`controllers/`, `routes/`)
- **Application Services** (`services/`)
- **Domain Business Rules** (`models/`, `types/`)
- **Infrastructure & Persistence** (`database/`, `cache/`, `payments/`, `storage/`, `queue/`)

```
                         INTERNET
                             │
                             ▼
                    Express API Gateway
              [Request ID, Helmet, CORS, Limit]
                             │
                             ▼
                    API Layer (/api/v1/*)
                             │
       ┌─────────────────────┼─────────────────────┐
       ▼                     ▼                     ▼
 Identity Module       Fitness Module        Commerce Module
  • Auth                • Exercises           • Plans
  • Users               • Workouts            • Orders
  • Roles & RBAC        • Live Sessions       • Payments (UPI/QR)
  • Sessions            • Programs            • Invoices
                        • Progress & PRs      • Refunds
       │                     │                     │
       └─────────────────────┼─────────────────────┘
                             ▼
                     Engagement Module
                      • Achievements
                      • Streaks
                      • Notifications
                             │
                             ▼
                     Domain Event Bus
                      • Worker Queue
                      • Async Listeners
                             │
              ┌──────────────┴──────────────┐
              ▼                             ▼
   PostgreSQL 16 (Prisma)      Cache & Storage (Redis/Memory)
```

---

## 2. Domain Boundaries

### Identity Domain (`src/modules/identity/`)
- **Responsibilities**: Athlete and staff authentication, cryptographic password hashing, access/refresh token pair lifecycle, refresh token rotation with `jti` collision protection, and Role-Based Access Control (`USER`, `TRAINER`, `STAFF`, `ADMIN`, `SUPER_ADMIN`).
- **Data Boundaries**: Owns `User`, `UserProfile`, `RefreshToken`, `PasswordResetToken`.

### Fitness Domain (`src/modules/fitness/`)
- **Responsibilities**: Exercise catalog, search & multi-filtering, workout routines and template cloning, live workout session execution and set logging, automated Personal Record detection (Epley and Brzycki 1RM formulas), body measurements, progress photos, and multi-week curriculum progression.
- **Data Boundaries**: Owns `Exercise`, `WorkoutTemplate`, `WorkoutSession`, `PersonalRecord`, `ProgressMeasurement`, `ProgressPhoto`, `WorkoutProgram`.

### Commerce Domain (`src/modules/commerce/`)
- **Responsibilities**: Configurable membership plans (Monthly ₹99, Yearly ₹550, Lifetime ₹1,200), order creation, payment gateway abstraction (UPI, QR, Cards, Netbanking), idempotency protection, transactional payment verification, membership lifecycle management (`PENDING` -> `ACTIVE` -> `EXPIRING` -> `EXPIRED`), and sequential invoice generation (`INV-YYYY-XXXXX`).
- **Data Boundaries**: Owns `MembershipPlan`, `Membership`, `Order`, `Payment`, `PaymentAttempt`, `Refund`, `Invoice`.

### Engagement Domain (`src/modules/engagement/`)
- **Responsibilities**: Consecutive workout streaks, milestone badge detection, in-app notification dispatch, and event listeners.
- **Data Boundaries**: Owns `Notification`, `Achievement`, `UserAchievement`.

### Administration Domain (`src/modules/administration/`)
- **Responsibilities**: User moderation, role assignment, platform revenue and workout analytics, exercise library curation, and append-only audit logging (`AdminAuditLog`).
- **Data Boundaries**: Owns `AdminAuditLog`.

---

## 3. Future Scalability & Microservices Extraction Path

When traffic and organizational growth justify extracting specific domains into independent microservices:
1. **Stage 1 (Current)**: Modular Monolith sharing a single PostgreSQL database with logical foreign keys and in-memory/Redis events.
2. **Stage 2**: Separate database schemas per domain (`identity_db`, `fitness_db`, `commerce_db`) while remaining in a single deployable unit.
3. **Stage 3**: Extract `commerce` or `fitness` into standalone microservices behind an API Gateway, communicating via message queues (RabbitMQ / Kafka) using the existing `DomainEvent` schemas.
