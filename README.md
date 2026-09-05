# AI-Based Smart Energy Consumption Monitoring and Optimization System for Educational Institutions

A full-stack enterprise energy monitoring, analytics, and optimization dashboard designed for educational institution campuses.

## Project Structure

```
project-root/
│
├── frontend/                     # React + Vite Frontend Application
│   ├── public/                   # Public static assets & favicon
│   ├── src/
│   │   ├── assets/               # Local images, SVG icons
│   │   ├── components/           # Reusable UI components (Sidebar, Navbar, KpiCard, etc.)
│   │   │   └── common/           # 20 modular design system components
│   │   ├── context/              # Context providers (Auth, Theme, Notification)
│   │   ├── data/                 # Development energy datasets & configurations
│   │   ├── layouts/              # Role-based dashboard layouts (AdminLayout, AuthLayout, etc.)
│   │   ├── pages/                # Views (AdminDashboard, AdminBuildings, AdminDepartments, etc.)
│   │   ├── routes/               # Routing configuration & route protection
│   │   ├── services/             # API communication service layer
│   │   ├── styles/               # Global CSS variables, typography, resets
│   │   ├── utils/                # Calculation utilities & Axios instance
│   │   ├── App.jsx               # Root React Component
│   │   └── main.jsx              # React DOM Entry
│   ├── index.html                # Vite HTML Template
│   ├── vite.config.js            # Vite Configuration
│   ├── package.json              # Frontend Dependencies
│   ├── .env                      # Frontend Environment Config (API URL)
│   └── README.md
│
├── backend/                      # Node.js + Express.js REST API Server
│   ├── src/
│   │   ├── config/               # Database and environment configurations
│   │   ├── controllers/          # Request handlers (Buildings, Departments, Energy, Alerts, Auth, Users)
│   │   ├── middleware/           # Auth guard, error handling, request logging
│   │   ├── models/               # Data model schemas (MySQL prepared)
│   │   ├── routes/               # Express endpoint routers
│   │   ├── services/             # Domain business logic
│   │   └── utils/                # Standardized API response utilities
│   ├── server.js                 # Main Express application entry point
│   ├── package.json              # Backend Dependencies
│   ├── .env                      # Server & MySQL Database Configuration
│   └── README.md
│
├── database/                     # MySQL Database Assets
│   ├── schema.sql                # Table definitions & relational constraints
│   └── seed.sql                  # Initial institutional seed data
│
└── README.md                     # Root Project Documentation
```

## Quick Start Guide

### 1. Run the Frontend (React + Vite)
```bash
cd frontend
npm install
npm run dev
```
The frontend dashboard will run at: **http://localhost:5173**

### 2. Run the Backend (Express API)
```bash
cd backend
npm install
npm run dev
```
The backend API server will run at: **http://localhost:5000**
Health check: **http://localhost:5000/api/health**

---

## User Roles
1. **Administrator** — Full campus energy telemetry, all 8 physical buildings, all academic departments, financial costs, and campus-wide optimization.
2. **Department Staff / HOD** — Department-specific energy consumption, load indicators, and budget utilization.
3. **Electrician / Maintenance Staff** — Sub-panel metrics, voltage spikes, power factor monitoring, and active fault alerts.

## Campus Infrastructure Monitored
- **8 Campus Buildings**: IB Block, AS Block, Mechanical Block, Sunflower Block, Research Park, Library, Girls Hostel, Boys Hostel.
- **Academic & Residential Units**: EEE, EIE, Textile, ECE, Civil, Mech, CT, CSE, IT, Aeronautical, Central Admin, Yamuna, Ganga, Narmadha, Cauvery, Emerald, Sapphire, Pearl, Ruby.
