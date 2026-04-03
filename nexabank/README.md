# 🏦 NexaBank — Full-Stack Online Banking System

> A complete, production-ready online banking platform with Web (Next.js), Mobile (React Native/Expo), and Backend (Node.js/Express/PostgreSQL)

---

## 📁 Project Structure

```
nexabank/
├── web/                    # Next.js 14 Web App (User + Admin)
│   └── src/
│       ├── app/
│       │   ├── page.tsx              # Landing page
│       │   ├── auth/
│       │   │   ├── login/            # User login
│       │   │   ├── register/         # Multi-step registration
│       │   │   └── forgot-password/  # Password reset
│       │   ├── dashboard/            # User banking portal
│       │   │   ├── page.tsx          # Overview & balance
│       │   │   ├── accounts/         # Account management
│       │   │   ├── transactions/     # Transaction history
│       │   │   ├── cards/            # Card management
│       │   │   ├── transfer/         # Fund transfer with OTP
│       │   │   ├── bills/            # Bill payments
│       │   │   ├── loans/            # Loan management
│       │   │   ├── profile/          # User profile
│       │   │   └── settings/         # App settings
│       │   └── admin/                # Admin portal (separate)
│       │       ├── login/            # Admin-only login
│       │       ├── dashboard/        # Admin overview
│       │       ├── users/            # Customer management
│       │       ├── kyc/              # KYC review & approval
│       │       ├── transactions/     # Transaction monitoring
│       │       ├── cards/            # Card management
│       │       ├── loans/            # Loan approvals
│       │       └── audit/            # Audit logs
│       ├── components/               # Reusable UI components
│       ├── lib/
│       │   ├── api.ts                # Axios client (user + admin)
│       │   └── auth-context.tsx      # Auth state management
│       └── types/                    # TypeScript types
│
├── server/                 # Node.js + Express API
│   └── src/
│       ├── index.js                  # Server entry point
│       ├── config/
│       │   ├── database.js           # PostgreSQL pool
│       │   ├── redis.js              # Redis cache
│       │   ├── migrate.js            # DB schema migrations
│       │   └── seed.js               # Demo data seeder
│       ├── controllers/
│       │   ├── auth.controller.js    # Register/login/OTP/reset
│       │   ├── transaction.controller.js
│       │   └── card.controller.js
│       ├── middleware/
│       │   ├── auth.js               # JWT verify (user + admin)
│       │   ├── errorHandler.js
│       │   └── notFound.js
│       ├── routes/
│       │   ├── auth.routes.js        # /api/v1/auth/*
│       │   ├── adminAuth.routes.js   # /api/v1/admin/auth/*
│       │   ├── account.routes.js
│       │   ├── transaction.routes.js
│       │   ├── card.routes.js
│       │   ├── user.routes.js
│       │   └── admin.routes.js       # Protected admin routes
│       └── utils/
│           ├── audit.js
│           ├── generators.js
│           ├── mailer.js
│           ├── notifications.js
│           └── sms.js
│
└── mobile/                 # React Native + Expo
    └── src/app/
        ├── index.tsx                 # Splash screen
        ├── _layout.tsx               # Root layout
        ├── auth/login.tsx            # Mobile login
        └── tabs/
            ├── _layout.tsx           # Tab bar
            ├── index.tsx             # Home/Dashboard
            ├── transactions.tsx      # Transactions
            ├── transfer.tsx          # Send money
            ├── cards.tsx             # Card management
            └── profile.tsx           # Profile & settings
```

---

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 14
- Redis (optional, in-memory fallback available)

### 1. Clone & Install
```bash
git clone <repo>
cd nexabank
cp .env .env.local   # Edit with your values
npm install
```

### 2. Database Setup
```bash
# Create PostgreSQL database
createdb nexabank_db

# Run migrations (creates all tables)
npm run db:migrate

# Seed with demo data
npm run db:seed
```

### 3. Start Development
```bash
# Start both web and server
npm run dev

# Or separately:
npm run dev:server     # API on :5000
npm run dev:web        # Web on :3000
npm run dev:mobile     # Expo mobile app
```

---

## 🔐 Demo Credentials

### User Login (Web & Mobile)
| Field | Value |
|-------|-------|
| Email | `demo@nexabank.com` |
| Password | `Demo@2024!` |

### Admin Login (Web only - `/admin/login`)
| Field | Value |
|-------|-------|
| Employee ID | `EMP-SUPER-001` |
| Password | `Admin@2024!` |

> ⚠️ **Admin and User logins are completely separate systems with different JWT secrets.**

---

## 🌐 API Reference

Base URL: `http://localhost:5000/api/v1`

### Auth Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register new user |
| POST | `/auth/login` | User login |
| POST | `/auth/refresh` | Refresh access token |
| POST | `/auth/logout` | Logout (blacklist token) |
| POST | `/auth/forgot-password` | Send reset email |
| POST | `/auth/reset-password` | Reset with token |
| GET | `/auth/verify-email/:token` | Verify email |
| POST | `/auth/send-otp` | Send phone OTP |
| POST | `/auth/verify-otp` | Verify phone OTP |

### Admin Auth (Separate)
| Method | Path | Description |
|--------|------|-------------|
| POST | `/admin/auth/login` | Admin login (Employee ID) |
| GET | `/admin/auth/me` | Admin profile |

### User APIs (require Bearer token)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/accounts` | List accounts |
| POST | `/accounts/open` | Open new account |
| GET | `/transactions` | Transaction history |
| POST | `/transactions/transfer` | Fund transfer |
| POST | `/transactions/pay-bill` | Bill payment |
| GET | `/cards` | My cards |
| POST | `/cards/apply` | Apply for card |
| POST | `/cards/:id/activate` | Activate card |
| POST | `/cards/:id/block` | Block card |

### Admin APIs (require Admin Bearer token)
| Method | Path | Description |
|--------|------|-------------|
| GET | `/admin/stats` | Dashboard statistics |
| GET | `/admin/users` | All customers |
| PATCH | `/admin/users/:id/status` | Suspend/activate |
| GET | `/admin/kyc/pending` | Pending KYC list |
| PATCH | `/admin/kyc/:id` | Approve/reject KYC |
| GET | `/admin/transactions` | All transactions |
| GET | `/admin/audit` | Audit logs |

---

## ✨ Features

### User Features
- 🔐 Secure login with email/phone + password
- 📱 Biometric login on mobile (Face ID / Fingerprint)
- 🏦 Multiple account types (Savings, Current, Salary, FD, RD)
- 💳 Debit & Credit card management
- 💸 Fund transfer (NEFT, IMPS, RTGS, UPI) with OTP
- 📄 Bill payments (Electricity, Water, DTH, etc.)
- 📊 Transaction history with filters
- 🔔 Real-time notifications (Email + SMS + Push)
- 🎯 KYC document upload
- 🔒 2-Factor Authentication
- 🌙 Dark mode support

### Admin Features
- 👥 Full customer management
- ✅ KYC review and approval workflow
- 🚨 Flagged transaction monitoring
- ❄️ Account freeze/unfreeze
- 🔑 Role-based access (Super Admin, Branch Manager, CS, Compliance, Auditor)
- 📈 Real-time dashboard with charts
- 📋 Complete audit trail
- 💼 Loan approval workflow
- 🏢 Branch management

---

## 🛡️ Security

- JWT with short expiry (15 min) + refresh token rotation
- Separate JWT secrets for users and admins
- bcrypt password hashing (12 rounds)
- Account lockout after 5 failed attempts
- Token blacklisting on logout (Redis)
- Transaction OTP verification
- Rate limiting on all endpoints
- Helmet.js security headers
- CORS protection
- SQL injection prevention (parameterized queries)
- Audit logging for all critical actions

---

## 📱 Mobile App

Built with React Native + Expo:
- Expo Router for navigation
- Biometric authentication
- Push notifications
- Secure token storage (expo-secure-store)
- Beautiful native UI with animations

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Frontend | Next.js 14, React, TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| Mobile | React Native, Expo |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Cache | Redis |
| Auth | JWT, bcrypt |
| Email | Nodemailer / SendGrid |
| SMS | Twilio |
| Charts | Recharts |
| State | Zustand + TanStack Query |

---

## 📄 License

Proprietary — NexaBank © 2024
