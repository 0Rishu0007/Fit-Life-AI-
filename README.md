# FitLife AI — Smart Fitness & Health Optimization Platform

A full-stack web application that tracks workouts, diet, recovery, and provides AI-driven personalized recommendations.

## Architecture

```
fitlife-ai/
├── client/          # React + Vite + Tailwind CSS (port 3000)
├── server/          # Node.js + Express + MongoDB  (port 5000)
└── ai-service/      # Python FastAPI ML engine     (port 8000)
```

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS, Recharts |
| Backend | Node.js, Express, Mongoose, JWT, bcrypt |
| Database | MongoDB |
| AI Engine | Python FastAPI, scikit-learn, NumPy |

## Prerequisites

- **Node.js** v18+ and npm
- **Python** 3.9+
- **MongoDB** (local or Atlas cloud)

## Setup & Run

### 1. Clone & Install

```bash
# Backend
cd server
npm install

# Frontend
cd ../client
npm install

# AI Service
cd ../ai-service
pip install -r requirements.txt
```

### 2. Configure Environment

Copy `.env.example` to `.env` in `/server` and update `MONGODB_URI` if needed:

```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/fitlife-ai
JWT_SECRET=your_secret_key_here
JWT_EXPIRE=7d
AI_SERVICE_URL=http://localhost:8000
```

### 3. Seed Database (Optional)

```bash
cd server
npm run seed
```

Creates a demo user: `alex@fitlife.com` / `password123`

### 4. Start All Services

Open 3 terminal windows:

```bash
# Terminal 1 — Backend API
cd server
npm run dev

# Terminal 2 — Frontend
cd client
npm run dev

# Terminal 3 — AI Service
cd ai-service
python main.py
```

### 5. Open App

Navigate to **http://localhost:3000**

## Features

- **Authentication** — JWT-based register/login with bcrypt
- **Workout Tracking** — CRUD with exercise, sets, reps, weight, progression
- **Diet Tracking** — Meal logging with calories & macros, daily summaries
- **AI Recommendations** — Workout suggestions, calorie adjustments, progress predictions
- **Dashboard** — Charts (calorie trends, strength volume, exercise distribution)
- **Streak Tracking** — Consecutive workout day counting
- **Goal Setting** — Daily calorie, protein, and weekly workout targets
- **Analytics Score** — 0-100 fitness score with A-F grading

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| PUT | `/api/auth/goals` | Update goals |
| GET/POST | `/api/workouts` | List/create workouts |
| PUT/DELETE | `/api/workouts/:id` | Update/delete workout |
| GET/POST | `/api/diet` | List/create meals |
| GET | `/api/diet/summary` | Daily aggregation |
| PUT/DELETE | `/api/diet/:id` | Update/delete meal |
| GET | `/api/ai/recommendations` | AI insights |

## License

MIT
