# Bagula Dashboard

Web dashboard for monitoring AI agent sessions and performance.

Works in two modes:
- **Cloud Mode**: Full-featured with authentication, billing, and multi-tenancy
- **Self-Hosted Mode**: Core monitoring features without authentication

## Running Modes

### Cloud Mode (with Clerk authentication)

For the managed Bagula Cloud service at [bagula.ai](https://bagula.ai).

**Environment Variables:**
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
NEXT_PUBLIC_API_URL=https://api.bagula.ai
```

**Features:**
- ✅ Clerk authentication
- ✅ Organization switching
- ✅ Billing and subscriptions
- ✅ API key management
- ✅ Team settings

### Self-Hosted Mode (no authentication)

For open source self-hosted deployments.

**Environment Variables:**
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
# No Clerk keys = runs without authentication
```

**Features:**
- ✅ Session monitoring
- ✅ Performance metrics
- ❌ Authentication (disabled)
- ❌ Billing (disabled)
- ❌ Multi-tenancy (disabled)

## Setup

### Cloud Mode Setup

1. Create a Clerk account at [clerk.com](https://clerk.com)
   - Enable Organizations feature
   - Copy publishable and secret keys

2. Create `.env.local`:
   ```bash
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   NEXT_PUBLIC_API_URL=http://localhost:8001
   ```

3. Install and run:
   ```bash
   npm install
   npm run dev
   ```

4. Open [http://localhost:3000](http://localhost:3000)

### Self-Hosted Mode Setup

1. Create `.env.local`:
   ```bash
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

2. Install and run:
   ```bash
   npm install
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000)

## Environment Variables

**Cloud Mode (Required):**
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `NEXT_PUBLIC_API_URL` - Cloud API endpoint

**Self-Hosted Mode (Required):**
- `NEXT_PUBLIC_API_URL` - Platform API endpoint (e.g., http://localhost:8000)

**Optional:**
- `NEXT_PUBLIC_STRIPE_PRICE_ID_STARTER` - Stripe price ID for Starter plan (cloud only)
- `NEXT_PUBLIC_STRIPE_PRICE_ID_PRO` - Stripe price ID for Pro plan (cloud only)

## Features

### Core Features (All Modes)
- **Session Monitoring** - View all agent sessions with detailed timelines
- **Performance Metrics** - Track costs, duration, and success rates
- **Session Details** - Inspect individual sessions with full context

### Cloud-Only Features
- **Authentication** - Clerk-based auth with organizations
- **Billing** - Subscription management with Stripe
- **API Keys** - Generate and manage API keys per organization
- **Settings** - Team member management and preferences

## Development

```bash
npm run dev      # Start development server
npm run build    # Build for production
npm run start    # Start production server
npm run lint     # Run ESLint
```

## Deployment

The dashboard can be deployed to:
- Vercel (recommended for MVP)
- AWS ECS Fargate (for production)
- Any Node.js hosting platform

See main project README for deployment instructions.
