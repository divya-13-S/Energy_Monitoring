# Backend — Smart Energy Management REST API

Express.js REST API backend for the AI-Based Smart Energy Consumption Monitoring and Optimization System.

## Tech Stack
- Node.js (ES Modules)
- Express.js 4.19
- MySQL2 (Promise-based DB driver)
- CORS & Dotenv

## Folder Structure

```
backend/
├── src/
│   ├── config/           # Database & environment configurations (db.js)
│   ├── controllers/      # Route request/response handlers
│   │   ├── authController.js
│   │   ├── buildingController.js
│   │   ├── departmentController.js
│   │   ├── energyController.js
│   │   ├── alertController.js
│   │   └── userController.js
│   ├── routes/           # Express router endpoints
│   │   ├── authRoutes.js
│   │   ├── buildingRoutes.js
│   │   ├── departmentRoutes.js
│   │   ├── energyRoutes.js
│   │   ├── alertRoutes.js
│   │   └── userRoutes.js
│   ├── models/           # Data models mapped to MySQL schema
│   │   ├── Building.js
│   │   ├── Department.js
│   │   ├── EnergyReading.js
│   │   ├── Alert.js
│   │   └── User.js
│   ├── middleware/       # Custom middleware (auth, error, logger)
│   │   ├── authMiddleware.js
│   │   ├── errorMiddleware.js
│   │   └── loggerMiddleware.js
│   ├── services/         # Domain business logic
│   │   ├── energyService.js
│   │   └── alertService.js
│   └── utils/            # Helper utilities (apiResponse.js)
├── server.js             # Main Express server entry point
├── package.json          # Backend dependencies & scripts
├── .env                  # Port & MySQL environment configuration
└── README.md
```

## Setup & Run

```bash
cd backend
npm install
npm run dev
```

Server runs at: **http://localhost:5000**
Health check endpoint: **http://localhost:5000/api/health**

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/health` | API status health check |
| POST | `/api/auth/login` | User login |
| GET | `/api/auth/me` | Current authenticated user |
| GET | `/api/buildings` | All campus buildings |
| GET | `/api/buildings/:id` | Single building details |
| GET | `/api/departments` | All academic departments & units |
| GET | `/api/energy/kpis` | Summary energy KPIs |
| GET | `/api/energy/readings` | Hourly telemetry readings |
| GET | `/api/alerts` | System alerts list |
| GET | `/api/users` | User access management |
