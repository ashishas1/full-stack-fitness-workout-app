# REST API Reference & Specification

Base URL: `http://localhost:5000/api/v1` (Interactive Swagger UI: `http://localhost:5000/api/v1/docs`)

All requests returning authenticated data require the `Authorization` header:
```
Authorization: Bearer <access_token>
```

---

## 1. System & Health

### GET `/api/v1/health`
Deep health inspection checking PostgreSQL latency, cache status, and event bus.
- **Response**:
```json
{
  "success": true,
  "message": "Fitness Platform API v1 is healthy and operational",
  "data": {
    "status": "UP",
    "timestamp": "2026-09-12T03:16:19.199Z",
    "uptime": 62.22,
    "version": "v1",
    "components": {
      "database": { "status": "HEALTHY", "latencyMs": 2 },
      "cache": { "status": "HEALTHY", "provider": "memory_with_redis_fallback" },
      "eventQueue": { "status": "HEALTHY", "provider": "async_event_bus" }
    }
  }
}
```

---

## 2. Identity & Authentication (`/api/v1/auth`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `POST` | `/api/v1/auth/register` | Register new user account | No |
| `POST` | `/api/v1/auth/login` | Authenticate with email & password | No |
| `POST` | `/api/v1/auth/refresh-token` | Rotate refresh token for new access/refresh pair | No |
| `POST` | `/api/v1/auth/logout` | Revoke active refresh token | Yes |
| `GET` | `/api/v1/auth/me` | Fetch authenticated user profile & role | Yes |
| `POST` | `/api/v1/auth/forgot-password` | Request password reset token | No |
| `POST` | `/api/v1/auth/reset-password` | Set new password with valid reset token | No |

---

## 3. Fitness & Workouts (`/api/v1`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/v1/exercises` | List exercises with pagination & filters | Optional |
| `GET` | `/api/v1/exercises/:id` | Get exercise details and execution cues | Optional |
| `POST` | `/api/v1/exercises/:id/favorite` | Toggle exercise in user favorites | Yes |
| `GET` | `/api/v1/workouts/templates` | List user & public workout templates | Yes |
| `POST` | `/api/v1/workouts/templates` | Create custom workout template | Yes |
| `POST` | `/api/v1/workouts/templates/:id/clone` | Clone public template to private collection | Yes |
| `POST` | `/api/v1/workouts/sessions` | Start a live workout session | Yes |
| `POST` | `/api/v1/workouts/sessions/:id/sets` | Record a completed exercise set | Yes |
| `POST` | `/api/v1/workouts/sessions/:id/complete` | Complete session, calculate PRs & volume | Yes |
| `GET` | `/api/v1/workouts/sessions` | Fetch workout session history | Yes |
| `GET` | `/api/v1/workouts/records` | Fetch personal records (1RM, Heaviest, Max Reps) | Yes |

---

## 4. Commerce & Memberships (`/api/v1/commerce`)

| Method | Endpoint | Description | Auth Required |
|---|---|---|:---:|
| `GET` | `/api/v1/commerce/plans` | Fetch available plans (₹99 Monthly, ₹550 Yearly, ₹1200 Lifetime) | No |
| `POST` | `/api/v1/commerce/order` | Create cryptographic payment order & UPI QR code | Yes |
| `POST` | `/api/v1/commerce/verify` | Verify payment signature and activate membership | Yes |
| `GET` | `/api/v1/commerce/my-membership` | Retrieve current active membership status & expiry | Yes |
| `GET` | `/api/v1/commerce/invoices` | List billing invoices with PDF metadata | Yes |
| `GET` | `/api/v1/commerce/invoices/:id` | Get detailed invoice breakdown (`INV-YYYY-XXXXX`) | Yes |

---

## 5. Administration (`/api/v1/admin`)

| Method | Endpoint | Description | Minimum Role |
|---|---|---|:---:|
| `GET` | `/api/v1/admin/stats` | Platform metrics (MRR, Total Revenue, Active Users) | `ADMIN` |
| `GET` | `/api/v1/admin/users` | Paginated user management list | `ADMIN` |
| `PATCH` | `/api/v1/admin/users/:id` | Update user status/role with audit logging | `ADMIN` |
| `GET` | `/api/v1/admin/payments` | All platform payment transactions | `ADMIN` |
| `GET` | `/api/v1/admin/audit-logs` | Query append-only administrative audit log | `ADMIN` |
