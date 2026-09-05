# Frontend — Smart Energy Management System

Vite + React frontend for the AI-Based Smart Energy Consumption Monitoring and Optimization System.

## Tech Stack
- React 19
- Vite 8
- React Router DOM 7
- Recharts
- Axios
- React Icons

## Setup & Run

```bash
cd frontend
npm install
npm run dev
```

App runs at: **http://localhost:5173**

## Project Structure

```
frontend/
├── public/               # Static assets (favicon, etc.)
├── src/
│   ├── assets/           # Images, icons, SVGs
│   ├── components/       # Reusable UI components (KpiCard, AdminSidebar, etc.)
│   │   └── common/       # 20 generic UI components
│   ├── context/          # React Context providers (Auth, Theme, Notification)
│   ├── data/             # Development energy dataset (no API yet)
│   ├── layouts/          # Page layout wrappers (AdminLayout, AuthLayout, etc.)
│   ├── pages/            # Page-level components
│   ├── routes/           # AppRoutes, ProtectedRoute, RoleRoute
│   ├── services/         # API service functions (dashboardService.js)
│   ├── styles/           # Global CSS (variables, typography, etc.)
│   ├── utils/            # Helper functions (energyCalculations, axiosInstance)
│   ├── App.jsx           # Root App component with context providers
│   └── main.jsx          # Vite entry point
├── index.html            # Root HTML template
├── vite.config.js        # Vite configuration
└── package.json          # Frontend dependencies
```

## Environment Variables

Create `.env` in `frontend/`:
```
VITE_API_BASE_URL=http://localhost:5000/api
```

## User Roles
- **Administrator** — Full campus dashboard
- **Department Staff / HOD** — Department-scoped views
- **Electrician / Maintenance** — Electrical & fault monitoring
