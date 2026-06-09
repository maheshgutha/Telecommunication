# AOTMS — Caller Dashboard
**Automation Operations & Telecom Management System**

A complete MERN stack CRM & caller dashboard for managing leads, tracking calls, and running campaigns.

---

## Tech Stack
- **Frontend:** React 18, Vite, Tailwind CSS, React Router v6, Recharts, Axios
- **Backend:** Node.js, Express.js, MongoDB, Mongoose, JWT Auth
- **Database:** MongoDB (local or Atlas)

---

## Project Structure
```
aotms/
├── backend/
│   └── src/
│       ├── config/db.js          # MongoDB connection
│       ├── middleware/auth.js    # JWT middleware
│       ├── models/
│       │   ├── User.js           # Users (callers, admins)
│       │   ├── Lead.js           # Leads with activity history
│       │   ├── Campaign.js       # Campaigns
│       │   └── FollowUp.js       # Follow-up scheduling
│       ├── routes/
│       │   ├── auth.js           # Login, register, profile
│       │   ├── leads.js          # Lead CRUD + call logging
│       │   ├── followups.js      # Follow-up management
│       │   ├── campaigns.js      # Campaign management
│       │   ├── reports.js        # Leaderboard & call stats
│       │   └── users.js          # User listing
│       ├── seed.js               # Demo data seeder
│       └── server.js             # Express app entry
└── frontend/
    └── src/
        ├── components/
        │   ├── Layout/           # Sidebar, Topbar, Layout
        │   └── common/           # StatusBadge, shared UI
        ├── context/AuthContext   # Global auth state
        ├── pages/
        │   ├── Login.jsx         # Auth page
        │   ├── Dashboard.jsx     # Stats + follow-ups + recent calls
        │   ├── MyCalls.jsx       # Call list + lead detail + call timer
        │   ├── Leads.jsx         # Leads table with filters
        │   ├── AddLead.jsx       # Add / edit lead form
        │   ├── Campaigns.jsx     # Campaign cards
        │   ├── CampaignDetail.jsx# Campaign leads + charts
        │   ├── Leaderboard.jsx   # Caller rankings
        │   └── Reports.jsx       # Charts + export
        ├── services/api.js       # Axios API calls
        └── App.jsx               # Routes
```

---

## Setup

### Prerequisites
- Node.js 18+
- MongoDB running locally (`mongod`) or MongoDB Atlas URI

### 1. Clone / navigate to project
```bash
cd aotms
```

### 2. Backend setup
```bash
cd backend
npm install

# Configure environment
cp .env.example .env
# Edit .env — set MONGODB_URI if using Atlas

# Seed demo data (optional)
npm run seed

# Start server
npm run dev       # development (nodemon)
npm start         # production
```
Backend runs at: `http://localhost:5000`

### 3. Frontend setup
```bash
cd frontend
npm install
npm run dev
```
Frontend runs at: `http://localhost:3000`

---

## Environment Variables (`backend/.env`)
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/aotms
JWT_SECRET=aotms_super_secret_jwt_key_2024
JWT_EXPIRE=7d
NODE_ENV=development
```

---

## Demo Accounts (after seeding)
| Role   | Email                   | Password    |
|--------|-------------------------|-------------|
| Admin  | admin@aotms.com         | admin123    |
| Caller | poojitha@aotms.com      | caller123   |
| Caller | haseena@aotms.com       | caller123   |

---

## API Endpoints

### Auth
| Method | Endpoint            | Description       |
|--------|---------------------|-------------------|
| POST   | /api/auth/login     | Login             |
| POST   | /api/auth/register  | Register user     |
| GET    | /api/auth/me        | Current user      |
| PUT    | /api/auth/profile   | Update profile    |

### Leads
| Method | Endpoint                | Description              |
|--------|-------------------------|--------------------------|
| GET    | /api/leads              | List leads (paginated)   |
| GET    | /api/leads/my-calls     | Caller's lead list       |
| GET    | /api/leads/stats        | Dashboard stats          |
| POST   | /api/leads              | Create lead              |
| GET    | /api/leads/:id          | Get lead detail          |
| PUT    | /api/leads/:id          | Update lead              |
| DELETE | /api/leads/:id          | Delete lead              |
| POST   | /api/leads/:id/call     | Log a call               |
| POST   | /api/leads/:id/note     | Add note/whatsapp/sms    |
| PUT    | /api/leads/:id/status   | Update lead status       |

### Campaigns, Follow-ups, Reports
| Method | Endpoint                    | Description         |
|--------|-----------------------------|---------------------|
| GET    | /api/campaigns              | List campaigns      |
| POST   | /api/campaigns              | Create campaign     |
| GET    | /api/campaigns/:id          | Campaign detail     |
| GET    | /api/followups              | List follow-ups     |
| POST   | /api/followups              | Create follow-up    |
| GET    | /api/reports/leaderboard    | Leaderboard data    |
| GET    | /api/reports/calls-summary  | Call stats          |

---

## Features

### Caller Dashboard
- **Dashboard** — Today's stats, follow-up widget, lead-by-stage donut chart, recent calls
- **My Calls** — Split-pane view: call list on left, lead detail on right. Real-time call timer, log calls, add notes, change status, WhatsApp/SMS actions
- **Leads** — Paginated table with status/source filters, search, bulk select, quick delete
- **Add Lead** — Full form: name, phone, email, courses, budget, dates, campaign assignment
- **Campaigns** — Card grid view, per-campaign stats (total leads, active, callers)
- **Campaign Detail** — Three-panel: stats sidebar + lead list + lead detail with charts (lost reasons pie, status bar)
- **Leaderboard** — Day/Week/Month/Year tabs, podium display, sorted by calls/duration/sales
- **Reports** — Call summary stats, bar/pie charts, export buttons, tabbed views

---

## Lead Statuses
`Fresh` → `Connected` → `Call Not Responding` → `Call Back Later` → `Not interested` → `Demo Scheduled` → `Demo Done` → `Won` / `Lost`

## Lead Sources
Manual, Facebook, WhatsApp, Website, Excel, Referral

---

## Production Deployment

### Backend (PM2)
```bash
npm install -g pm2
pm2 start src/server.js --name aotms-api
pm2 save && pm2 startup
```

### Frontend (Nginx)
```bash
npm run build
# Serve dist/ folder with Nginx
```

### MongoDB Atlas
Replace `MONGODB_URI` in `.env` with your Atlas connection string.
