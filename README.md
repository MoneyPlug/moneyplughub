# ⚡ MoneyPlugHub — Production Referral & Commission System

**MoneyPlugHub** is a high-yield, production-ready referral and commission network featuring durable SQLite persistence, atomic referral registration, a real-money commission ledger, user affiliate dashboards, and an audited admin payout portal.

---

## 🚀 Quick Start Commands

### 1. Install Dependencies
```bash
npm install
```

### 2. Initialize Database & Seed Default Admin
```bash
npm run db:init
```

### 3. Run Automated Verification Test Suite
```bash
npm run test
```

### 4. Start Development Mode (Hot Reloading Frontend + Backend)
```bash
npm run dev
```
- Frontend UI: `http://localhost:5173`
- Backend API: `http://localhost:3000`

### 5. Build for Production
```bash
npm run build
```

### 6. Run Production Server
```bash
npm run start
```
- Full Single-Port Production App: `http://localhost:3000`

---

## 🛡️ Default Auditor (Admin) Credentials
- **Email**: `admin@moneyplughub.local`
- **Password**: `AdminSecret2026!`
- **Role**: `admin`
- **Referral Code**: `ADMIN-PLUG`

*(You can also use the "Auto-Fill Seed Admin Credentials" button on the login screen for instant access)*.

---

## 📦 Project Architecture & File Tree

```
moneyplughub/
├── README.md                       # Comprehensive documentation & deployment guide
├── package.json                    # Project metadata, run scripts & dependencies
├── tsconfig.json                   # Client TypeScript configuration
├── tsconfig.server.json            # Server TypeScript configuration
├── vite.config.ts                  # Vite bundler configuration & API proxy
├── tailwind.config.js              # Tailwind styling config (modern dark theme)
├── postcss.config.js               # PostCSS config
├── index.html                      # HTML root template
├── .env.example                    # Environment configuration template
├── data/
│   └── moneyplughub.db             # Durable SQLite Database file (WAL Mode)
└── src/
    ├── types/
    │   └── index.ts                # Shared TypeScript models (User, Commission, AuditLog, Stats)
    ├── backend/
    │   ├── server.ts               # Express server entry & SPA static bundle host
    │   ├── config.ts               # Commission settings ($10/ref), JWT & DB paths
    │   ├── db.ts                   # SQLite WAL connection, migrations, ACID transaction wrapper
    │   ├── seed.ts                 # Database seeder (admin bootstrap)
    │   ├── test.ts                 # End-to-end integration & verification test suite
    │   ├── middleware/
    │   │   └── auth.ts             # JWT authentication & admin authorization guards
    │   └── routes/
    │       ├── auth.ts             # Registration (with ref handling), Login, /me, validate-ref
    │       ├── referrals.ts        # User referral stats, commission ledger & network list
    │       └── admin.ts            # Payout approval, status transitions, user audits, immutable logs
    └── frontend/
        ├── index.css               # Global styling, custom scrollbars, glowing accents
        ├── main.tsx                # React DOM root with AuthProvider
        ├── App.tsx                 # Route coordinator & query parameter referral interceptor
        ├── context/
        │   └── AuthContext.tsx     # Global auth state, session management & token persistence
        ├── components/
        │   ├── Navbar.tsx          # Responsive navigation bar with role-based links
        │   ├── Footer.tsx          # Protocol disclosures, ledger guarantees, legal terms
        │   ├── StatusBadge.tsx     # Visual status pill (pending / approved / paid)
        │   ├── Modal.tsx           # Accessible dialog modal (QR codes, payout dialogs)
        │   ├── ReferralLink.tsx    # 1-click copy referral link widget with QR & social sharing
        │   ├── ReferralStats.tsx   # 4-stat KPI cards (Total Referrals, Pending, Approved, Paid)
        │   └── CommissionTable.tsx # Searchable/filterable commission ledger table
        └── pages/
            ├── LandingPage.tsx     # High-converting landing page with live earnings calculator
            ├── LoginPage.tsx       # Secure sign-in form with 1-click auditor credential fill
            ├── RegisterPage.tsx    # Sign-up form with real-time referral code verification (?ref=...)
            ├── DashboardPage.tsx   # User affiliate dashboard (link generator, earnings, ledger)
            └── AdminPage.tsx       # Auditor portal (KPIs, approval buttons, user directory, audit trail)
```

---

## ⚙️ Core Business Logic & Financial Legitimacy

### 1. Atomic Referral Registration
When a new user visits `https://moneyplughub.local/register?ref=PLUG-XXXXX` or inputs a referral code:
1. The backend validates that the referral code belongs to an existing user.
2. In a single **ACID SQLite transaction**:
   - The new user account is created with `referrer_user_id = referrer.id`.
   - The referrer's `referral_count` is incremented.
   - A new row is inserted in `commission_ledger` with `status: 'pending'` and `amount_cents: 1000` ($10.00 USD).
   - An immutable audit log entry is recorded with action `REFERRAL_COMMISSION_CREATED`.

### 2. Payout Audit Lifecycle
Every commission progresses through three auditable states:
- **`pending`**: Recorded automatically at registration. Awaiting platform auditor review.
- **`approved`**: Verified by auditor in the Admin Portal. Cleared for disbursement.
- **`paid`**: Disbursed to member's settlement rail (ACH / PayPal / Crypto).

---

## 🔒 Security & Persistence Guarantees
- **Durable Persistence**: SQLite configured with `PRAGMA journal_mode = WAL`, `PRAGMA synchronous = NORMAL`, and `PRAGMA foreign_keys = ON`.
- **Password Security**: Salted password hashing with `bcryptjs` (10 rounds).
- **Session Protection**: Cryptographically signed JSON Web Tokens (JWT) stored in HTTP-only cookies and Authorization headers.
- **Role Isolation**: Admin audit endpoints guarded with `requireAdmin` middleware.
