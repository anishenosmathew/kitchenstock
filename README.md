# KitchenStock

React + Node/Express + PostgreSQL kitchen inventory app. Mobile-first,
multi-tenant (each household is isolated), with an admin superuser.

## Folder structure

```
kitchenstock-app/
├── backend/
│   ├── src/
│   │   ├── server.js              # Express app entrypoint
│   │   ├── db/
│   │   │   ├── migrations.sql     # table definitions
│   │   │   └── pool.js            # Postgres connection pool
│   │   ├── middleware/
│   │   │   └── auth.js            # JWT check, kitchen access check, admin bypass
│   │   ├── controllers/
│   │   │   ├── auth.controller.js
│   │   │   ├── inventory.controller.js
│   │   │   └── household.controller.js
│   │   ├── routes/
│   │   │   ├── auth.routes.js
│   │   │   ├── inventory.routes.js
│   │   │   └── household.routes.js
│   │   └── seed/
│   │       └── seedAdmin.js       # creates the admin DB row
│   ├── package.json
│   └── .env.example
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx                 # all routes
    │   ├── api/client.js           # fetch wrapper
    │   ├── context/AuthContext.jsx # holds user/token/kitchen
    │   ├── components/             # BottomNav, ProtectedRoute
    │   ├── pages/                  # Login, Signup, Inventory, ItemDetail, Shopping, Account
    │   └── styles/theme.css        # design tokens, mobile-first layout
    ├── index.html
    ├── vite.config.js
    └── package.json
```

## Running it locally

### 1. Database
```bash
createdb kitchenstock
cd backend
cp .env.example .env        # edit DATABASE_URL if needed
npm install
npm run migrate             # creates all tables
npm run seed:admin          # creates admin@kitchenstock.local / admin
```

### 2. Backend
```bash
cd backend
npm run dev                 # http://localhost:4000
```

### 3. Frontend
```bash
cd frontend
cp .env.example .env
npm install
npm run dev                 # http://localhost:5173
```

Open `http://localhost:5173` on your laptop, or — since `vite.config.js`
sets `host: true` — open `http://<your-laptop-LAN-IP>:5173` on your actual
phone (same WiFi network) to test the real mobile experience.

## The admin superuser

Log in with:
- **Email:** `admin`
- **Password:** `admin`

This works even before the database seed runs — it's hardcoded in
`auth.controller.js` as a special case, separate from the normal
email/password check. It issues a token with `isAdmin: true`, which the
`requireKitchenAccess` middleware treats as automatic access to **any**
kitchen — useful for support and debugging, since you can open any
family's data without being a member of their household.

`npm run seed:admin` additionally creates a real `admin@kitchenstock.local`
row in the `users` table with `is_admin = true`, so admin status also
works the normal way (in case you want to retire the hardcoded bypass
later).

## Multi-tenancy model

- Every household is a row in `kitchens`.
- `kitchen_members` links users to kitchens with a role (`owner` or `member`).
- Every inventory/shopping-list request is scoped by `:kitchenId` in the
  URL, and `requireKitchenAccess` middleware checks the caller is actually
  a member of that kitchen before letting the request through.
- This means many families can use the same server/database and never see
  each other's data.

## What's implemented vs. what's left as an exercise

**Done:** signup/login, JWT auth, admin bypass, kitchen creation + invite
codes, inventory CRUD, quantity stepper with ledger history, derived
shopping list, WhatsApp share link (free, no API costs), household
member listing.

**Designed (HTML mockups) but not yet wired into React:** Add Item form,
Low Stock Alerts bulk-edit page, Household invite/remove-member actions,
Edit Profile, Change Password. These follow the exact same pattern as the
pages that ARE wired up — copy an existing page, point it at the matching
controller (`household.controller.js` already has the remove/leave logic
ready to call).
