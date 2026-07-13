# AeroBlood

> "Connecting Blood. Saving Lives."

AeroBlood is an enterprise-grade, real-time blood intelligence platform that connects **Hospitals**, **Blood Banks**, and **Donors** in a highly integrated health informatics grid. It is built to reduce blood informational gaps, optimize reserve visibility, prevent biological product waste, and facilitate real-time emergency SOS coordination without delays.

---

## 🚀 Key Objectives & Solutions

1. **Information Synced Instantly**: Eliminates medical silos. When a hospital creates an SOS alert, it propagates in real-time across the regional network.
2. **Biological Shelf-life Tracked**: Implements automated clinical formulas calculating expiration thresholds (e.g. Platelets expire in 5 days, Packed Red Cells in 42 days) with 7/3/1 days color alerts.
3. **Emergency Blood Radar**: Enables hospitals to search specific blood types and locate nearest available caches with immediate lock capabilities.
4. **Digital Blood Passport**: Provides donors with custom profiles, verified clinical data checklist evaluations, impact metrics (Lives Saved), and scannable QR Passports.
5. **Interactive Network Map**: Replaces standard maps with custom-styled vectors supporting marker clusters, heat zones, supply filters, and popup resource cards.

---

## 🛠 Enterprise Tech Stack

* **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide Icons, Framer Motion, Recharts.
* **Backend Integration**: Supabase Auth (RBAC), Supabase Realtime (Replication Bus), Supabase PostgreSQL.
* **State Engine**: Zustand (InMemory Multi-Device Event Stream Replication).
* **Progressive Web App**: Caching static assets with standard service worker strategies.

---

## 📁 Enterprise Project Directory Structure

The repository implements a modular, clean architectural separation of concerns:

```
├── /docs/
│   ├── DATABASE_SCHEMA.md     # Complete DDL tables, indexes, audit logs & RLS policies
│   ├── DEPLOYMENT.md          # Cloud Run and Supabase provisioning guides
│   └── PWA_SETUP.md           # Service Worker and manifest.json caching setups
├── /src/
│   ├── app/                   # Root rendering layout
│   ├── components/            # Extracted visual subsystems
│   │   ├── LandingPage.tsx        # Hero, problem statement, counter grid, camps, footer
│   │   ├── NationalDashboard.tsx  # Public aggregate stats, Area charts, active SOS
│   │   ├── LiveNetworkMap.tsx     # Custom GIS interactive map, street vs heatmap
│   │   ├── HospitalDashboard.tsx  # SOS raises, editable resources, Radar searches
│   │   ├── BloodBankDashboard.tsx # Inventory table, auto-expiry checker, SOS matching
│   │   └── DonorDashboard.tsx     # Blood Passport, QR code scanner, eligibility testing
│   ├── lib/
│   │   └── store.ts           # Master Zustand state containing multi-portal reactive triggers
│   ├── types.ts               # Domain-driven model interfaces
│   ├── App.tsx                # Multi-Device Workspace routing engine
│   ├── index.css              # Corporate Google fonts and Tailwind tokens registration
│   └── main.tsx               # System bootstrapper
├── .env.example               # Secret declarations guide (Supabase, Maps, Firebase)
├── .gitignore                 # Exclusion lists (node_modules, dist, secrets)
├── package.json               # Package manifests (React 19, Recharts, motion, Tailwind)
└── vite.config.ts             # Bundler configuration file
```

---

## 📡 Live Multi-Device Sync Demo Workspace

Because a standard sandbox environment limits having multiple actual physical devices online simultaneously, AeroBlood incorporates an **Interactive Split Sandbox (Realtime Demo)** mode:

* Click **"Split Sandbox"** at the top header to split your screen into two simulated device displays (Device Alpha and Device Beta).
* Set Device Alpha to **Hospital Terminal** and Device Beta to **Blood Bank Manager** or **Donor Portal**.
* Raise an Emergency SOS in the Hospital Panel (Left) and watch as:
  1. The Realtime Event Log drawer records the replication signal instantly.
  2. The Blood Bank Manager (Right) receives a glowing alert notification.
  3. The Live Network GIS Map adds the critical red blinking marker.
  4. The Donor Portal updates the nearby matching requests panel immediately.
* Mark an SOS as **"Mark Fulfilled"** or update inventories and watch values update across dashboards in real-time!
