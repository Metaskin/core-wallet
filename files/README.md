# CoreWallet — Private Digital Bank

A production-quality, closed-beta digital banking system for up to 6 invited users. Built with Next.js, Node.js/Express, and PostgreSQL.

```
╔══════════════════════════════════════════╗
║   CoreWallet v1.0 · Closed Beta          ║
║   Private · Secure · Future-Ready        ║
╚══════════════════════════════════════════╝
```

---

## Architecture

```
corewallet/
├── backend/           # Node.js + Express API
│   └── src/
│       ├── config/    # Database connection
│       ├── controllers/
│       │   ├── authController.js
│       │   ├── transactionController.js
│       │   └── userController.js
│       ├── middleware/ # Auth + validation
│       └── routes/    # API routes
├── frontend/          # Next.js 14 + TypeScript
│   └── src/
│       ├── app/       # App Router pages
│       │   ├── auth/login/
│       │   ├── dashboard/
│       │   └── admin/
│       ├── components/
│       │   └── layout/AppLayout.tsx
│       └── lib/       # API client, store, utils
└── database/
    ├── schema.sql     # Full PostgreSQL schema
    └── seed.sql       # Admin + 2 users
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, React 18, TypeScript |
| Styling | Tailwind CSS + custom design system |
| State | Zustand (persisted) |
| Backend | Node.js + Express 4 |
| Database | PostgreSQL 14+ |
| Auth | JWT (bcrypt passwords) |
| Security | Helmet, CORS, rate limiting |

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

---

## Quick Setup

### 1. Clone and install dependencies

```bash
# Backend
cd corewallet/backend
npm install

# Frontend
cd corewallet/frontend
npm install
```

### 2. Set up PostgreSQL database

```bash
# Create the database
createdb corewallet

# Run the schema
psql corewallet < database/schema.sql

# Seed with admin + 2 users
psql corewallet < database/seed.sql
```

### 3. Configure backend environment

```bash
cd backend
cp .env.example .env
```

Edit `.env`:
```env
PORT=4000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=5432
DB_NAME=corewallet
DB_USER=postgres
DB_PASSWORD=your_postgres_password

JWT_SECRET=your-super-secret-jwt-key-minimum-32-characters
JWT_EXPIRES_IN=7d

MAX_USERS=6
FRONTEND_URL=http://localhost:3000
```

### 4. Configure frontend environment

```bash
cd frontend
cp .env.example .env.local
```

Edit `.env.local`:
```env
NEXT_PUBLIC_API_URL=http://localhost:4000
```

### 5. Start development servers

```bash
# Terminal 1 — Backend
cd backend
npm run dev

# Terminal 2 — Frontend
cd frontend
npm run dev
```

Visit: **http://localhost:3000**

---

## Default Credentials (Seed)

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@corewallet.io | Admin@CoreWallet2024 |
| User | alice@example.com | User@CoreWallet2024 |
| User | bob@example.com | User@CoreWallet2024 |

⚠️ **Change all passwords before any real use.**

---

## API Reference

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | — | Login, returns JWT |
| GET | `/api/auth/me` | User | Get current user |

### Wallet (User)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/wallet/transactions` | User | Transaction history |
| POST | `/api/wallet/transfer` | User | Transfer to another user |

### Admin
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/admin/stats` | Admin | System stats |
| GET | `/api/admin/users` | Admin | All users + balances |
| POST | `/api/admin/users` | Admin | Create new user |
| PATCH | `/api/admin/users/:id/toggle-status` | Admin | Freeze/unfreeze |
| POST | `/api/admin/credit` | Admin | Credit account |
| POST | `/api/admin/debit` | Admin | Debit account |
| GET | `/api/admin/transactions` | Admin | Full ledger |
| GET | `/api/admin/audit-log` | Admin | Audit trail |

---

## Database Schema

### Tables
- **users** — Authentication, profile, role
- **accounts** — Wallet per user (balance, currency, status)
- **transactions** — Immutable ledger (credit/debit/transfer)
- **admin_logs** — Tamper-evident admin action audit trail

### Key Design Decisions
- All transactions are **atomic** (PostgreSQL transactions + row-level locking)
- Balances are **snapshotted** in each transaction row (audit trail)
- Transactions are **never updated or deleted** — append-only ledger
- `FOR UPDATE` row locking prevents race conditions / double-spend
- Negative balances are prevented by database constraints

---

## Security

- Passwords hashed with **bcrypt** (cost 12)
- JWT authentication with configurable expiry
- **Rate limiting**: 100 req/15min general, 10 req/15min for login
- **Helmet** HTTP security headers
- Input validation on all endpoints (express-validator)
- CORS restricted to frontend origin
- Admin routes protected by role middleware
- **Row-level locking** prevents concurrent balance manipulation

---

## Business Rules

- Maximum **6 users** (enforced at API level)
- **No negative balances** (DB constraint + API check)
- Transfers only between **active accounts**
- Only admin can **credit/debit** (users can only transfer)
- Every action produces an **immutable ledger entry**
- Admin actions are logged to **admin_logs** for audit

---

## Future Integration Points

The codebase is structured for easy payment API integration:

### Stripe / Unit Integration
```javascript
// accounts table has `external_account_id` column
// transactions table has `external_reference` column

// Add to transactionController.js:
const stripeCharge = await stripe.paymentIntents.create({...});
await createTransaction({ externalReference: stripeCharge.id, ... });
```

### Real Money Deposits
1. Add webhook handlers for Stripe/Unit events
2. Map `external_account_id` to real bank account
3. On webhook: call `adminCredit()` with external reference

### Card Issuing (Unit)
1. Store `unit_card_id` in accounts table
2. Listen to Unit transaction webhooks
3. Auto-debit on card spend via `adminDebit()`

---

## Production Checklist

- [ ] Change all seed passwords
- [ ] Set strong `JWT_SECRET` (32+ random chars)
- [ ] Set `NODE_ENV=production`
- [ ] Use SSL/TLS for database connection
- [ ] Deploy behind HTTPS reverse proxy (nginx)
- [ ] Set up database backups
- [ ] Configure proper CORS origin
- [ ] Review and tighten rate limits
- [ ] Set up monitoring / alerting
- [ ] Enable PostgreSQL connection pooling (PgBouncer)

---

## Development Scripts

```bash
# Backend
npm run dev          # Start with nodemon
npm run start        # Production start

# Frontend
npm run dev          # Next.js dev server
npm run build        # Production build
npm run start        # Start production server
```

---

Built with care for the CoreWallet closed beta.
