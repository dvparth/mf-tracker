# MF Tracker

Full-stack mutual fund portfolio tracker with a React frontend and an Express/MongoDB backend.

The app lets authenticated users manage mutual fund holdings by scheme code, fetch NAV history, calculate portfolio value and profit/loss, and generate a short AI portfolio summary.

## Structure

- `frontend/` - React app built with Create React App and MUI
- `backend/` - Express API with Mongoose models and Google OAuth

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB connection string
- Google OAuth client credentials

## Backend Setup

```powershell
cd backend
copy .env.example .env
npm install
npm run dev
```

Required backend environment:

- `MONGO_URI`
- `JWT_SECRET`
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `JWT_CSRF_AUDIENCE`
- `FRONTEND_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Optional backend environment:

- `GOOGLE_CALLBACK`
- `RAPIDAPI_KEY`
- `RAPIDAPI_HOST`
- `GITHUB_TOKEN` - enables AI portfolio insights through GitHub Models
- `GITHUB_MODEL` - optional GitHub Models model ID, defaults to `openai/gpt-4.1`

## Frontend Setup

```powershell
cd frontend
copy .env.example .env
npm install
npm start
```

Required frontend environment:

- `VITE_BACKEND_URL`

Optional frontend environment:

- `VITE_DATA_ADAPTER`

## Scripts

From `frontend/`:

```powershell
npm start
npm run build
npm run test:ci
```

From `backend/`:

```powershell
npm start
npm run dev
```

## API Overview

- `/auth` - Google OAuth, logout, current user
- `/user/holdings` - authenticated holdings CRUD
- `/schemes` - DB-backed scheme metadata
- `/api/mf` - mutual fund NAV lookup
- `/api/portfolioInsight` - structured AI portfolio insight cards through GitHub Models

## Deployment Notes

Frontend and backend can still deploy independently from this monorepo:

- Netlify frontend base directory: `frontend`
- Render backend root directory: `backend`

Set each service's environment variables in the hosting provider. Do not commit `.env` files.

Production security defaults:

- Render backend: set `NODE_ENV=production` and `FRONTEND_URL=https://mf-snapshot.netlify.app`.
- Netlify frontend: `frontend/netlify.toml` pins Node 22, disables source maps through Vite config, and defines browser security headers.
- Keep provider credentials (`GITHUB_TOKEN`, `RAPIDAPI_KEY`, Google secret, Mongo URI) backend-only.
