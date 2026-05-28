# MF Snapshot Application Review Guide

This document is the single-file orientation guide I would want before reviewing or changing this application again. It tells the whole story of the app: what it does, how it is structured, what each major capability depends on, and where the important logic lives.

## Executive Summary

MF Snapshot is a full-stack mutual fund portfolio tracker for Indian mutual fund investors.

The application lets authenticated users maintain a private list of mutual fund holdings, fetch current and historical NAV data, calculate portfolio value and gain/loss metrics, visualize allocation and concentration, and generate plain-English AI-assisted portfolio observations.

The system is split into:

- `frontend/`: React 18 + Vite + Material UI application.
- `backend/`: Express 5 API with MongoDB/Mongoose, Google OAuth, JWT cookies, CSRF protection, NAV adapters, and AI insight generation.

The user-facing product is not a broker or transaction platform. It is a read-only portfolio intelligence dashboard based on manually entered scheme, amount, and unit data.

## Architectural Invariants

These are the assumptions that most future changes should preserve:

- Saved user data is only holdings metadata: scheme code, invested amount, units, and timestamps. The app does not store transaction history or fetched NAV history.
- The backend owns authentication, cookies, CSRF validation, MongoDB persistence, external NAV/API calls, and AI insight generation.
- The frontend owns portfolio math, visual presentation, estimated historical value, allocation, and the heuristic health score.
- NAV data must be normalized to the canonical `{ entries, meta, source }` shape before dashboard code consumes it.
- Financial language should stay explanatory. The app may surface observations, risks, concentration, and movement, but should not recommend buy/sell/switch/redeem/add-money actions.
- The dashboard is built from current holdings and latest fetched NAV data. Any historical value shown is an estimate using current units, not a true historical account valuation.

## Repository Structure

```text
mf-tracker/
  package.json
  README.md
  APPLICATION_REVIEW_GUIDE.md
  backend/
    server.js
    package.json
    .env.example
    adapters/
      mfAdapter.js
    auth/
      passport.js
    middleware/
      authMiddleware.js
      csrf.js
      rateLimits.js
    migrations/
      importSchemesFromJson.js
    models/
      Scheme.js
      User.js
    routes/
      auth.js
      mf.js
      portfolioInsight.js
      schemes.js
      userHoldings.js
    services/
      llmService.js
      portfolioContextService.js
  frontend/
    package.json
    vite.config.js
    netlify.toml
    index.html
    .env.example
    public/
    scripts/
    src/
      App.jsx
      main.jsx
      theme.js
      index.css
      adapters/
        mfAdapters.js
      auth/
        csrf.js
        Login.jsx
        useAuth.js
      components/
      config/
        env.js
      utils/
        formatters.js
```

## Product Capabilities

### Authentication

Users sign in with Google OAuth.

Relevant files:

- `backend/auth/passport.js`
- `backend/routes/auth.js`
- `backend/middleware/authMiddleware.js`
- `frontend/src/auth/Login.jsx`
- `frontend/src/auth/useAuth.js`

Flow:

1. Frontend sends the user to `GET /auth/google`.
2. Backend creates an OAuth state cookie named `mf_oauth_state`.
3. Google redirects to `GET /auth/google/callback`.
4. Backend validates OAuth state.
5. Passport extracts minimal Google profile details.
6. Backend issues a short-lived JWT into an HttpOnly cookie named `mf_auth`.
7. Frontend calls `GET /auth/me` to detect the signed-in user.
8. Frontend preloads a CSRF token for secure mutations.

The auth JWT includes user id, name, email, and photo. The cookie is HttpOnly and lasts one hour.

### CSRF Protection

Authenticated write operations require a CSRF token.

Relevant files:

- `backend/middleware/csrf.js`
- `frontend/src/auth/csrf.js`

Flow:

1. Frontend calls `GET /auth/csrf`.
2. Backend returns a short-lived JWT CSRF token.
3. Frontend attaches it as `X-CSRF-Token`.
4. Backend validates issuer, audience, token type, and user id.

Protected mutations include:

- `POST /auth/logout`
- `POST /user/holdings`
- `PUT /user/holdings/:scheme_code`
- `DELETE /user/holdings/:scheme_code`

### Holdings Management

Users can add, edit, and delete mutual fund holdings.

Relevant files:

- `backend/routes/userHoldings.js`
- `backend/models/User.js`
- `frontend/src/components/HoldingsPage.jsx`
- `frontend/src/components/HoldingForm.jsx`

Stored holding fields:

```js
{
  scheme_code: Number,
  principal: Number,
  unit: Number,
  addedAt: Date
}
```

Backend constraints:

- Maximum 25 holdings per request.
- Maximum 100 funds per user.
- `scheme_code` must be a positive integer.
- `principal` must be between 0 and 1,000,000,000,000.
- `unit` must be between 0 and 1,000,000,000.

User-facing flow:

1. User opens `/holdings`.
2. User searches a fund by name.
3. User selects a scheme from autocomplete.
4. User enters invested amount and/or units.
5. App saves the holding to `/user/holdings`.
6. Dashboard uses the saved holdings to compute live portfolio metrics.

### Scheme Search

The app supports scheme lookup by name or code.

Relevant files:

- `backend/routes/schemes.js`
- `backend/models/Scheme.js`
- `frontend/src/components/HoldingForm.jsx`

Flow:

1. Frontend waits until the user types at least two characters.
2. It calls `GET /schemes?q=<query>`.
3. Backend first searches the MongoDB `schemes` collection.
4. If no local DB match exists, backend falls back to `https://api.mfapi.in/mf/search`.
5. Results are normalized to `{ scheme_code, scheme_name, meta }`.

Default unfiltered `GET /schemes` returns up to 500 DB schemes.

### NAV Data Fetching

The app fetches mutual fund NAV data by scheme code.

Relevant files:

- `backend/routes/mf.js`
- `backend/adapters/mfAdapter.js`
- `frontend/src/adapters/mfAdapters.js`

Supported backend endpoints:

- `GET /api/mf/:schemeCode`
- `GET /api/mf/:schemeCode?hybrid=true`
- `GET /api/mf?schemeCodes=code1,code2`
- `GET /api/mf/hybrid/:schemeCode`

Batch behavior:

- Maximum 25 scheme codes per request.
- Up to five concurrent scheme fetches.
- Scheme codes must be numeric and no longer than 12 characters.

Canonical NAV payload shape:

```js
{
  entries: [
    { date: "DD-MM-YYYY", nav: "123.45" }
  ],
  meta: {
    scheme_name: "Fund Name"
  },
  source: "mfapi" | "rapidapi" | ""
}
```

Adapters:

- `mfapi`: Uses `https://api.mfapi.in/mf/:scheme_code`.
- `hybrid`: Uses mfapi for history and RapidAPI for latest NAV if keys are configured.

Frontend adapter behavior:

- Controlled by `VITE_DATA_ADAPTER`.
- Defaults to `mfapi`.
- Supports `mfapi` and `hybrid`.
- Caches/deduplicates concurrent backend requests by adapter and scheme code list.
- Batch requests are the normal dashboard path. `MFTracker` and `HoldingsPage` pass arrays of scheme objects and expect an array of `{ schemeCode, data, error? }` results.
- For a single non-array scheme input, `frontend/src/adapters/mfAdapters.js` returns only the canonical `data` payload, not the backend envelope. Be careful if adding new single-scheme consumers.

### Portfolio Dashboard

The main dashboard route is `/`.

Relevant files:

- `frontend/src/components/MFTracker.jsx`
- `frontend/src/components/SummaryCard.jsx`
- `frontend/src/components/SchemeAccordion.jsx`
- `frontend/src/components/ui/DonutChart.jsx`
- `frontend/src/components/ui/InsightCard.jsx`
- `frontend/src/components/ui/MiniSparkline.jsx`

Dashboard loading flow:

1. Fetch holdings from `GET /user/holdings`.
2. Convert holdings to tracked scheme list.
3. Fetch NAV data through `fetchSchemeDataUsingAdapter`.
4. Normalize rows for display.
5. Compute current value, gain/loss, recent movement, estimated past values, allocation, and health.
6. Trigger AI insight generation if portfolio data exists.

Important dashboard state:

- `rows`: normalized fund rows created from holdings plus NAV payloads.
- `latestPortfolioStateRef`: the exact portfolio snapshot sent to the AI insight endpoint and reused for manual AI refresh.
- `visibleCount`: progressive rendering count for fund accordions, initially eight.
- AI state is separate from NAV/dashboard loading state, so dashboard data can render even when AI insight generation fails.

Displayed dashboard sections:

- Portfolio summary card.
- Current portfolio value.
- Money invested.
- Total gain/loss.
- Latest gain/loss.
- Overall return percentage.
- Latest change percentage.
- Estimated 1/2/3 month past values.
- Portfolio health score.
- Diversification/concentration labels.
- Key takeaways.
- Allocation donut.
- AI insight cards.
- Fund-level accordions.
- Back-to-top helper.

### Portfolio Calculations

Important calculation logic lives in:

- `frontend/src/components/MFTracker.jsx`
- `frontend/src/components/SummaryCard.jsx`
- `frontend/src/components/SchemeAccordion.jsx`
- `frontend/src/utils/formatters.js`

Per-fund calculations:

- Current NAV: latest NAV entry.
- Current market value: `currentNav * units`.
- Profit/loss: `marketValue - principal`.
- Latest movement: current market value minus previous NAV market value.
- Latest movement percentage: latest movement divided by previous NAV market value.
- Allocation percentage: fund market value divided by total portfolio market value.

Portfolio totals:

- Invested amount: sum of all `principal`.
- Current value: sum of valid fund market values.
- Total profit/loss: sum of valid fund profit/loss.
- Latest movement: sum of latest per-fund movements.

Calculation duplication to watch:

- `MFTracker.jsx` derives totals and the AI portfolio payload after data load, then derives display totals again during render.
- `SummaryCard.jsx` and `SchemeAccordion.jsx` calculate percentages from the values they receive.
- If changing calculation semantics, update all three places together and adjust the frontend test fixture expectations.

Estimated past values:

- The app finds NAV entries nearest to one, two, and three months before the latest available portfolio date.
- It multiplies those older NAVs by current units.
- This is an estimate and may not equal actual historical value if units changed during the period.

Portfolio health score:

The frontend derives a simple score from:

- Number of valid funds.
- Largest fund concentration.
- Overall return direction.

Labels include:

- `Healthy`
- `Balanced`
- `Needs attention`
- `High concentration`

This is an explanatory guide, not financial advice.

### AI Portfolio Insights

The app can generate AI-assisted insight cards.

Relevant files:

- `backend/routes/portfolioInsight.js`
- `backend/services/llmService.js`
- `backend/services/portfolioContextService.js`
- `frontend/src/components/MFTracker.jsx`
- `frontend/src/components/ui/InsightCard.jsx`

Endpoint:

- `POST /api/portfolioInsight`

Authentication:

- Requires `requireAuth`.
- Rate-limited by user id or IP.

Provider:

- GitHub Models API.
- Endpoint: `https://models.github.ai/inference/chat/completions`.
- Requires `GITHUB_TOKEN`.
- Defaults to model `openai/gpt-4.1`.

Allowed model ids:

- `openai/gpt-4.1`
- `openai/gpt-4.1-mini`
- `openai/gpt-4o`
- `openai/gpt-4o-mini`

AI request context includes:

- Portfolio totals.
- Fund-level scheme data.
- Derived facts.
- Inferred category exposure.
- Largest holdings.
- Top performers.
- Weakest performers.
- Concentration details.
- Broad market context when available.

AI response schema:

```json
{
  "summary": "Short overall portfolio summary",
  "cards": [
    {
      "type": "performance|concentration|risk|watchpoint",
      "title": "Short card title",
      "severity": "positive|neutral|caution",
      "message": "Plain-English explanation",
      "relatedSchemes": [123456]
    }
  ]
}
```

The backend validates and normalizes AI output before returning it.

Important behavior:

- AI insight responses are cached in-memory by portfolio hash and date.
- `refresh: true` bypasses the cache.
- If `GITHUB_TOKEN` is missing, the endpoint returns 503 with a user-safe unavailable message.
- The model is instructed not to provide buy/sell/switch/redeem/add-money recommendations.
- The model is instructed not to invent news, benchmarks, categories, or causes.
- The frontend currently posts AI insight requests without a CSRF token because the endpoint is authenticated and non-persistent. If the endpoint ever stores user-visible data or mutates state, add CSRF.
- The backend sanitizes the submitted portfolio snapshot before prompt construction. Maximum submitted schemes for AI insight is 50.

### Market Context For AI

The AI context service fetches broad market index context from Yahoo Finance.

Relevant file:

- `backend/services/portfolioContextService.js`

Symbols:

- Nifty 50: `^NSEI`
- Sensex: `^BSESN`

The app fetches 5-day daily chart data, computes latest value, previous close change, and change percentage.

This data is only broad market context. The prompt explicitly says it must not be treated as fund-specific news.

### Legal And Marketing Pages

Relevant files:

- `frontend/src/components/LegalPages.jsx`
- `frontend/src/auth/Login.jsx`

Routes:

- `/login`
- `/about`
- `/privacy`
- `/terms`

The login page presents:

- Google sign-in.
- Dashboard preview.
- Privacy/read-only positioning.
- Product benefits.

## Backend API Reference

### Auth

`GET /auth/google`

Starts Google OAuth.

`GET /auth/google/callback`

Completes Google OAuth, validates state, issues JWT cookie, redirects to frontend.

`GET /auth/failure`

Returns authentication failure JSON.

`GET /auth/me`

Returns current authenticated user if the `mf_auth` cookie is valid.

Example response:

```json
{
  "authenticated": true,
  "user": {
    "id": "google-id",
    "name": "User Name",
    "email": "user@example.com",
    "photo": "https://..."
  }
}
```

`GET /auth/csrf`

Requires auth. Returns a CSRF token.

`POST /auth/logout`

Requires auth and CSRF. Clears the auth cookie.

### Holdings

`GET /user/holdings`

Requires auth. Returns the current user holdings.

```json
{
  "holdings": [
    {
      "scheme_code": 123456,
      "principal": 100000,
      "unit": 500.123,
      "addedAt": "2026-01-01T00:00:00.000Z"
    }
  ]
}
```

`POST /user/holdings`

Requires auth and CSRF. Adds or merges one or more holdings.

Accepted body:

```json
{
  "holdings": [
    {
      "scheme_code": 123456,
      "principal": 100000,
      "unit": 500.123
    }
  ]
}
```

If a scheme already exists, it updates principal and unit. If not, it pushes a new holding.

`PUT /user/holdings/:scheme_code`

Requires auth and CSRF. Updates one holding by scheme code. If the holding does not exist, it creates one, subject to user limits.

`DELETE /user/holdings/:scheme_code`

Requires auth and CSRF. Removes one holding by scheme code.

### Schemes

`GET /schemes`

Returns up to 500 DB-backed schemes.

`GET /schemes?q=<query>`

Searches scheme metadata by scheme name or scheme code. Falls back to mfapi search if DB returns no matches.

### NAV

`GET /api/mf/:schemeCode`

Fetches NAV history for one scheme through mfapi.

`GET /api/mf/:schemeCode?hybrid=true`

Fetches NAV history with hybrid mode.

`GET /api/mf?schemeCodes=123,456`

Fetches multiple schemes.

`GET /api/mf/hybrid/:schemeCode`

Legacy hybrid alias.

Single response shape:

```json
{
  "schemeCode": "123456",
  "source": "mfapi",
  "data": {
    "entries": [
      {
        "date": "01-01-2026",
        "nav": "123.45"
      }
    ],
    "meta": {
      "scheme_name": "Fund Name"
    },
    "source": "mfapi"
  }
}
```

Batch response shape:

```json
[
  {
    "schemeCode": "123456",
    "source": "mfapi",
    "data": {}
  }
]
```

### AI Insights

`POST /api/portfolioInsight`

Requires auth.

Accepted body:

```json
{
  "portfolio": {
    "portfolio": {
      "currentValue": 100000,
      "investedAmount": 90000,
      "totalProfitLoss": 10000,
      "oneDayChange": 500,
      "oneDayChangePct": 0.5,
      "latestDate": "01-01-2026"
    },
    "schemes": [
      {
        "scheme_code": 123456,
        "scheme_name": "Fund Name",
        "principal": 90000,
        "unit": 500,
        "currentNav": 200,
        "marketValue": 100000,
        "profit": 10000,
        "oneDayChange": 500,
        "oneDayChangePct": 0.5,
        "latestDate": "01-01-2026"
      }
    ]
  },
  "refresh": false
}
```

Response:

```json
{
  "summary": "Plain-English portfolio summary.",
  "cards": [],
  "provider": "github",
  "model": "openai/gpt-4.1",
  "portfolioHash": "abc123",
  "context": {
    "factsIncluded": true,
    "marketContextIncluded": true,
    "marketSources": ["Yahoo Finance chart API"],
    "marketFetchedAt": "2026-01-01T00:00:00.000Z",
    "categoryInference": true
  }
}
```

### Health

`GET /health`

Returns backend health metadata.

`GET /`

Returns a simple backend text response.

## Data Models

### User

File:

- `backend/models/User.js`

Fields:

```js
{
  googleId: String,
  email: String,
  name: String,
  photo: String,
  holdings: [
    {
      scheme_code: Number,
      principal: Number,
      unit: Number,
      addedAt: Date
    }
  ],
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

- `googleId`
- `holdings.scheme_code`

### Scheme

File:

- `backend/models/Scheme.js`

Fields:

```js
{
  scheme_code: Number,
  scheme_name: String,
  meta: Mixed,
  createdAt: Date,
  updatedAt: Date
}
```

Indexes:

- `scheme_code`

## Frontend Routes

Defined in:

- `frontend/src/App.jsx`

Routes:

- `/login`: Login and product preview.
- `/`: Protected dashboard.
- `/holdings`: Protected holdings management.
- `/about`: Legal/product information.
- `/privacy`: Privacy page.
- `/terms`: Terms page.

Navigation:

- Desktop users see `Snapshot` and `Funds` buttons.
- Mobile users see an icon button that toggles between dashboard and fund management.
- Authenticated users have an avatar/profile menu with logout.

## Configuration

### Root Scripts

File:

- `package.json`

Scripts:

```json
{
  "install:all": "npm --prefix backend install && npm --prefix frontend install",
  "start:backend": "npm --prefix backend start",
  "dev:backend": "npm --prefix backend run dev",
  "start:frontend": "npm --prefix frontend start",
  "build:frontend": "npm --prefix frontend run build",
  "test:frontend": "npm --prefix frontend run test:ci"
}
```

### Backend Environment

Required:

- `MONGO_URI`
- `JWT_SECRET`
- `JWT_ISSUER`
- `JWT_AUDIENCE`
- `JWT_CSRF_AUDIENCE`
- `FRONTEND_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

Optional:

- `GOOGLE_CALLBACK`
- `RAPIDAPI_KEY`
- `RAPIDAPI_HOST`
- `GITHUB_TOKEN`
- `GITHUB_MODEL`
- `PORT`
- `NODE_ENV`

### Frontend Environment

Required:

- `VITE_BACKEND_URL`

Optional:

- `VITE_DATA_ADAPTER`

Frontend env resolver:

- `frontend/src/config/env.js`

Defaults:

- `BACKEND_URL = ''`
- `DATA_ADAPTER = 'mfapi'`

## Security And Operational Behavior

### CORS

Configured in:

- `backend/server.js`

Allowed origins:

- `FRONTEND_URL`
- `http://localhost:3000`
- `https://localhost:3000`
- Any localhost/127.0.0.1/::1 origin in non-production.

Credentialed requests are enabled.

### Cookies

Auth cookie:

- Name: `mf_auth`
- HttpOnly.
- Secure in production.
- SameSite `none` in production, `lax` otherwise.
- One-hour lifetime.

OAuth state cookie:

- Name: `mf_oauth_state`
- HttpOnly.
- Ten-minute lifetime.

### Rate Limits

Configured in:

- `backend/middleware/rateLimits.js`

Limits:

- General: 300 requests per 15 minutes.
- Auth: 80 requests per 15 minutes.
- Data: 80 requests per minute.
- AI: 20 requests per 15 minutes.

### Helmet

Backend uses Helmet with `crossOriginResourcePolicy: false`.

### Payload Limits

Backend JSON payload limit is `200kb`.

## Testing

Frontend tests use Vitest and Testing Library.

Relevant files:

- `frontend/src/components/__tests__/MFTracker.test.jsx`
- `frontend/src/setupTests.js`

Main covered behavior:

- Dashboard shows loading state.
- Holdings and NAV data are mocked.
- Summary and user portfolio render.
- Refresh button smoke test.
- AI insight response is mocked.

Run:

```powershell
npm --prefix frontend run test:ci
```

Build:

```powershell
npm --prefix frontend run build
```

Backend currently has no dedicated automated test suite.

## Deployment

Frontend:

- Intended for Netlify.
- Base directory: `frontend`.
- `frontend/netlify.toml` pins Node and configures frontend behavior.

Backend:

- Intended for Render or another Node host.
- Root directory: `backend`.
- Must have MongoDB and OAuth environment variables configured.

Production reminders:

- Set `NODE_ENV=production`.
- Set `FRONTEND_URL` to the deployed frontend URL.
- Keep backend secrets backend-only.

## Important Implementation Details

### Date Format

The app standardizes NAV dates as:

```text
DD-MM-YYYY
```

The backend adapter normalizes several source formats into this format.

### Currency And Number Formatting

Frontend formatting lives in:

- `frontend/src/utils/formatters.js`

Currency uses `Intl.NumberFormat('en-IN', { currency: 'INR' })`.

### Lazy Loading

The dashboard lazy-loads:

- `SummaryCard`
- `SchemeAccordion`

This helps reduce initial work.

### Progressive Rendering

The dashboard initially renders eight fund accordions, then allows the user to show more.

### Empty State

If the user has no holdings, `/` shows a guided empty state that links to `/holdings`.

### Error Handling

Important user-facing error behavior:

- Dashboard load errors show retry.
- Holdings mutation failures show snackbars.
- AI failures show safe messages.
- Missing AI configuration returns a friendly unavailable state.

## Critical Data Boundaries

### Authentication Boundary

- Browser authentication is represented by the `mf_auth` HttpOnly cookie.
- `frontend/src/auth/useAuth.js` determines session state only through `GET /auth/me`.
- `frontend/src/auth/csrf.js` lazily fetches and caches the CSRF token. `fetchWithCsrf` should be used for authenticated persisted mutations.

### Persistence Boundary

- MongoDB stores users, user holdings, and scheme metadata.
- Fetched NAV histories are not persisted by this application.
- AI insight cache is process memory only.

### Provider Boundary

- `backend/adapters/mfAdapter.js` is the backend normalization layer for NAV providers.
- `frontend/src/adapters/mfAdapters.js` is only a client API wrapper and request deduper; it should not learn provider-specific response shapes.
- `backend/services/portfolioContextService.js` may fetch broad market index context, but that context is explicitly not fund-specific news.

### Presentation Boundary

- Material UI components and `sx` props carry most of the layout.
- Shared formatting lives in `frontend/src/utils/formatters.js`.
- The app already has responsive/mobile-specific behavior in the app bar, holdings page, summary card, and fund accordions, so layout changes should be checked on mobile widths.

## Known Caveats And Things To Watch

These are not necessarily bugs, but they matter during future work.

1. The README says the frontend is built with Create React App, but the current frontend is Vite.
2. Some rendered source text contains mojibake for the rupee symbol in a few files, likely encoding-related.
3. The AI insight endpoint is authenticated but does not require CSRF because it is a data-generation POST rather than a persisted mutation.
4. AI insight cache is in-memory only and resets when the backend restarts.
5. Portfolio health scoring is heuristic and frontend-only.
6. Category inference is based on fund names, not official fund metadata.
7. Historical portfolio value is estimated using current units and past NAV, not transaction history.
8. The backend exits immediately if `MONGO_URI` is missing.
9. The app depends on external APIs: mfapi, optional RapidAPI, optional Yahoo Finance chart API, optional GitHub Models.
10. The backend has no automated test coverage in the current repo.
11. `MFTracker.jsx` duplicates some portfolio derivation for AI payload construction and render-time display. Keep these aligned.
12. `HoldingForm.jsx` has some redundant local parsing variables in the edit branch; backend validation is still the source of truth.
13. NAV request deduplication caches promises in memory on both frontend and backend. Failed mfapi requests are evicted, but successful entries live for the current process/session.
14. Backend request logging in `backend/server.js` logs every request path. That is useful for hosted debugging but can be noisy.

## Where To Change Common Things

### Add Or Change Holdings Validation

Start here:

- `backend/routes/userHoldings.js`
- `frontend/src/components/HoldingForm.jsx`
- `frontend/src/components/HoldingsPage.jsx`

### Change Dashboard Calculations

Start here:

- `frontend/src/components/MFTracker.jsx`
- `frontend/src/components/SummaryCard.jsx`
- `frontend/src/components/SchemeAccordion.jsx`
- `frontend/src/utils/formatters.js`
- `frontend/src/components/__tests__/MFTracker.test.jsx`

### Change NAV Provider Behavior

Start here:

- `backend/adapters/mfAdapter.js`
- `backend/routes/mf.js`
- `frontend/src/adapters/mfAdapters.js`

### Change AI Prompt Or Schema

Start here:

- `backend/services/llmService.js`
- `backend/routes/portfolioInsight.js`
- `backend/services/portfolioContextService.js`
- `frontend/src/components/ui/InsightCard.jsx`

### Change Auth Behavior

Start here:

- `backend/routes/auth.js`
- `backend/auth/passport.js`
- `backend/middleware/authMiddleware.js`
- `backend/middleware/csrf.js`
- `frontend/src/auth/useAuth.js`
- `frontend/src/auth/csrf.js`

### Change Look And Feel

Start here:

- `frontend/src/theme.js`
- `frontend/src/index.css`
- `frontend/src/components/styles/common.css`
- `frontend/src/components/styles/header.css`
- Component-level MUI `sx` props.

### Add A New Page

Start here:

- `frontend/src/App.jsx`

### Add Legal Copy

Start here:

- `frontend/src/components/LegalPages.jsx`

## What This One File Saves During Review

Without this document, a reviewer has to reconstruct the app by reading:

- Package manifests.
- Backend server setup.
- Every route.
- Auth and CSRF middleware.
- Mongoose models.
- NAV adapters.
- AI services.
- Frontend routing.
- Auth hooks.
- Dashboard component logic.
- Holdings management UI.
- Formatter utilities.
- Test files.

This document saves time by giving the reviewer:

- The product purpose.
- The full capability list.
- The API map.
- Data shapes.
- Critical constraints.
- Calculation rules.
- External dependencies.
- Environment requirements.
- Security model.
- The right file to open for each kind of change.

## Quick Reviewer Checklist

When reviewing future changes, check:

- Does the change affect authenticated data?
- Does it require CSRF?
- Does it change portfolio calculations?
- Does it affect NAV canonical shape?
- Does it depend on an external provider?
- Does it alter AI prompts, schema, or safety boundaries?
- Does it cross the frontend/backend responsibility boundary?
- Does it change the shape of `rows`, holdings, NAV payloads, or the AI portfolio snapshot?
- Does it preserve mobile layout?
- Does it handle empty, loading, and error states?
- Does it keep financial language explanatory rather than advisory?
- Does it need frontend tests, backend tests, or both?

## Fast Mental Model

The app is:

```text
Google login
  -> user owns holdings in MongoDB
  -> holdings contain scheme code, invested amount, units
  -> backend fetches NAV history by scheme code
  -> frontend computes value, return, movement, allocation
  -> backend optionally enriches the portfolio with facts and market context
  -> GitHub Models returns plain-English insight cards
  -> frontend displays a private dashboard
```

That is the core story.
