# NexaBank — Online Banking System

> An online banking platform with Web (Next.js) and Backend (Node.js/Express/PostgreSQL).

## 🚀 Quick Start

### Prerequisites
- Node.js >= 18
- PostgreSQL >= 14

### 1. Clone & Install
```bash
git clone <repo>
cd nexabank
cp .env .env.local   # Edit with your values
npm install
```

### 2. Database Setup
```bash
createdb nexabank_db
npm run db:migrate
npm run db:seed
```

### 3. Start Development
```bash

npm run dev:server     
npm run dev:web       
```

---

## Demo Credentials

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

> **Admin and User logins are completely separate systems with different JWT secrets.**

---

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

## Features

### User Features
-  Secure login with email/phone + password
-  Biometric login on mobile (Face ID / Fingerprint)
-  Multiple account types (Savings, Current, Salary, FD, RD)
-  Debit & Credit card management
-  Fund transfer (NEFT, IMPS, RTGS, UPI) with OTP
-  Bill payments (Electricity, Water, DTH, etc.)
-  Transaction history with filters
-  Real-time notifications (Email + SMS + Push)
-  KYC document upload
-  2-Factor Authentication
-  Dark mode support

### Admin Features
-  Full customer management
-  KYC review and approval workflow
-  Flagged transaction monitoring
-  Account freeze/unfreeze
-  Role-based access (Super Admin, Branch Manager, CS, Compliance, Auditor)
-  Real-time dashboard with charts
-  Complete audit trail
-  Loan approval workflow
-  Branch management

---

##  Security

- JWT with short expiry (15 min) + refresh token rotation
- Separate JWT secrets for users and admins
- bcrypt password hashing
- Account lockout after 5 failed attempts
- Transaction OTP verification
- Rate limiting on all endpoints
- Helmet.js security headers
- CORS protection
- SQL injection prevention (parameterized queries)
- Audit logging for all critical actions

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Web Frontend | Next.js 14, React, TypeScript |
| Styling | Tailwind CSS, Framer Motion |
| Mobile | React Native, Expo |
| Backend | Node.js, Express |
| Database | PostgreSQL |
| Auth | JWT, bcrypt |
| Email | Nodemailer |

---