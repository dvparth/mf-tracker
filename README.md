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
- `FRONTEND_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Optional backend environment:

- `GOOGLE_CALLBACK`
- `RAPIDAPI_KEY`
- `RAPIDAPI_HOST`
- `GITHUB_TOKEN` - enables AI portfolio insights through GitHub Models

## Frontend Setup

```powershell
cd frontend
copy .env.example .env
npm install
npm start
```

Required frontend environment:

- `REACT_APP_BACKEND_URL`

Optional frontend environment:

- `REACT_APP_DATA_ADAPTER`
- `REACT_APP_RAPIDAPI_KEY`
- `REACT_APP_RAPIDAPI_HOST`

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
- `/api/portfolioInsight` - AI portfolio summary through GitHub Models

## Deployment Notes

Frontend and backend can still deploy independently from this monorepo:

- Netlify frontend base directory: `frontend`
- Render backend root directory: `backend`

Set each service's environment variables in the hosting provider. Do not commit `.env` files.
