# Security & Compliance Architecture

## 1. Threat Model & Defense-in-Depth

The gym platform enforces a defense-in-depth posture across all layers:

1. **Network & Transport Layer**:
   - TLS 1.3 encryption in transit.
   - `Helmet` security headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Strict-Transport-Security`, `Content-Security-Policy`.
   - Strict CORS configuration restricting origins to trusted frontends (`localhost:3000`, production domain).

2. **Rate Limiting & Abuse Prevention**:
   - Auth Rate Limiter: 10 requests per 15-minute window per IP on login/register endpoints to thwart brute-force attacks.
   - Global Rate Limiter: 200 requests per 15-minute window for standard API calls.

3. **Input Validation & Injection Defense**:
   - Zero unvalidated data reaches business logic or database queries.
   - All HTTP request bodies, queries, and parameters are validated using strict **Zod schemas**.
   - Prisma ORM utilizes parameterized SQL queries exclusively, eliminating SQL injection vectors.

---

## 2. Authentication & Credential Security

- **Password Hashing**: Bcrypt / Argon2 with adaptive salt rounds (minimum work factor 10).
- **JWT Architecture**:
  - **Access Token**: Short-lived (15 minutes), containing user ID, email, and role.
  - **Refresh Token**: Long-lived (30 days), stored in the database hashed via SHA-256 (`crypto.createHash('sha256')`).
  - **JTI Collision Defense**: Every issued refresh token embeds a unique `jti: crypto.randomUUID()` guaranteeing cryptographic uniqueness across sub-second concurrent renewals.
  - **Token Revocation**: Refresh tokens are revoked on logout or rotated upon refresh. Replay of an old refresh token invalidates the entire token family.

---

## 3. Role-Based Access Control (RBAC)

| Role | Exercise Library | Workout Sessions | My Memberships | Purchase Plans | Admin Analytics | User Management | Audit Logs |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| **USER** | Read / Create Custom | Full Control | Read Own | Full Control | ❌ | ❌ | ❌ |
| **TRAINER** | Read / Create Custom / Public | Full Control | Read Own | Full Control | Read Only | Read Clients | ❌ |
| **STAFF** | Read / Manage Catalog | Full Control | Read Own | Full Control | Read Only | Read All | ❌ |
| **ADMIN** | Full Catalog Management | Full Control | Read Own | Full Control | Full Access | Full Access | Full Access |
| **SUPER_ADMIN** | Full Catalog Management | Full Control | Read Own | Full Control | Full Access | Full Access | Full Access |

---

## 4. Payment & Financial Security

- **Signature Verification**: Payment notifications and client callbacks require HMAC-SHA256 signature verification matching `crypto.createHmac('sha256', secret).update(orderId + "|" + paymentId).digest('hex')`.
- **Idempotency Guarantee**: Payment verification checks order status atomically. Re-submitted or duplicate payment requests return `{ idempotent: true }` without re-charging or duplicate membership extension.
- **Auditing**: All administrative actions (user suspension, role changes, membership adjustments) are recorded to an append-only `AdminAuditLog` table.
