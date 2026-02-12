# Bagula Cloud - Managed Service

Bagula Cloud is the managed, hosted version of the open source Bagula platform. Perfect for teams who want all the power of Bagula without managing infrastructure.

## Overview

**What You Get:**
- Fully managed Bagula platform (no Docker, no servers)
- Same features as self-hosted + cloud-exclusive features
- 99.9% uptime SLA
- Automatic updates and scaling
- Enterprise-grade security

**Architecture:**
Bagula Cloud uses the exact same open source container that powers self-hosted deployments, wrapped with additional services for multi-tenancy, authentication, and billing.

## Quickstart

### 1. Sign Up

Visit [bagula.ai](https://bagula.ai) and create an account.

1. Enter your email and password (or use GitHub/Google OAuth)
2. Verify your email
3. Create your organization
4. Choose a plan (free trial available)

### 2. Get Your API Key

After signing up:

1. Go to **Settings → API Keys**
2. Click **Generate New Key**
3. Name it (e.g., "Production")
4. Copy the key (starts with `bagula_prod_...`)

**⚠️ Important:** Store this key securely. It's only shown once.

### 3. Instrument Your Agents

Install the Bagula client SDK:

```bash
npm install @bagula/client
```

Use your Bagula Cloud API key:

```typescript
import { BagulaClient } from '@bagula/client';

const bagula = new BagulaClient({
  apiKey: process.env.BAGULA_API_KEY, // Your cloud API key
  endpoint: 'https://api.bagula.ai', // Cloud endpoint
});

// Use as normal
const tracker = bagula.getSessionTracker();
// ... track your agent sessions
```

### 4. View Dashboard

Login to [dashboard.bagula.ai](https://dashboard.bagula.ai) to view:
- All your agent sessions
- Detected opportunities
- Cost and performance metrics
- Team activity

## Plans & Pricing

### Starter - $29/month

Perfect for getting started and small teams.

**Included:**
- 10,000 sessions/month
- 50,000 LLM calls/month
- 1 organization
- 5 team members
- Email support
- 7-day data retention

**Overage:**
- Sessions: $0.003 each
- LLM calls: $0.0006 each

### Pro - $99/month (Recommended)

Best for growing teams and production use.

**Included:**
- 50,000 sessions/month
- 250,000 LLM calls/month
- Unlimited organizations
- Unlimited team members
- Priority support
- 90-day data retention
- Advanced analytics
- Slack integration

**Overage:**
- Sessions: $0.002 each
- LLM calls: $0.0005 each

### Enterprise - Custom Pricing

For large-scale deployments with specific requirements.

**Everything in Pro, plus:**
- Unlimited sessions and LLM calls
- SSO (SAML, OIDC)
- Custom SLA (99.95%+)
- Dedicated support engineer
- Custom data retention
- On-premise deployment option
- Custom contracts and invoicing
- Audit logs and compliance

**Contact sales:** sales@bagula.ai

## Cloud vs Self-Hosted

| Feature | Self-Hosted (Free) | Bagula Cloud |
|---------|-------------------|--------------|
| **Platform** |
| Session recording | ✅ | ✅ |
| Opportunity detection | ✅ | ✅ |
| Dashboard | ✅ | ✅ |
| API access | ✅ | ✅ |
| **Infrastructure** |
| Setup required | Docker Compose | None |
| Updates | Manual | Automatic |
| Scaling | Manual | Automatic |
| Uptime | Your responsibility | 99.9% SLA |
| Backups | Your responsibility | Daily automated |
| **Organization** |
| Organizations | Single | Unlimited (Pro+) |
| Team members | Unlimited | 5 (Starter), Unlimited (Pro+) |
| User authentication | API keys only | Email/OAuth + SSO (Enterprise) |
| Role-based access | ❌ | ✅ |
| **Support** |
| Community support | ✅ (GitHub, Discord) | ✅ |
| Email support | ❌ | ✅ |
| Priority support | ❌ | ✅ (Pro+) |
| Dedicated engineer | ❌ | ✅ (Enterprise) |
| **Advanced Features** |
| Custom retention | ❌ | ✅ |
| Slack integration | ❌ | ✅ (Pro+) |
| SSO | ❌ | ✅ (Enterprise) |
| Audit logs | ❌ | ✅ (Enterprise) |
| **Cost** |
| Base cost | $0 (+ infrastructure) | $29-99/month |
| Per-session cost | $0 | $0.002-0.003 |

## Cloud Features

### Multi-Tenancy

Bagula Cloud supports multiple organizations under one account:

1. **Create Organizations:**
   - Settings → Organizations → New Organization
   - Each organization has its own data, API keys, and team

2. **Invite Team Members:**
   - Settings → Team → Invite Member
   - Assign roles: Owner, Admin, Member
   - Members see only sessions from their organizations

3. **Switch Organizations:**
   - Use the organization dropdown in the dashboard
   - API keys are scoped to one organization

### Authentication

**Email/Password:**
- Standard email and password login
- Password reset via email

**OAuth (Social Login):**
- Sign in with GitHub
- Sign in with Google
- Sign in with Microsoft (Enterprise)

**SSO (Enterprise only):**
- SAML 2.0
- OIDC (OpenID Connect)
- Auto-provisioning

### Billing & Usage

**View Usage:**
- Dashboard → Settings → Billing
- See current period usage
- View breakdown by agent, date
- Export usage reports

**Payment Methods:**
- Credit/debit cards (via Stripe)
- ACH (Enterprise)
- Wire transfer (Enterprise)

**Invoicing:**
- Automatic monthly invoices
- Download PDF invoices
- Custom invoicing (Enterprise)

### Team Management

**Roles:**

1. **Owner:**
   - Full access to everything
   - Manage billing
   - Delete organization
   - Transfer ownership

2. **Admin:**
   - Manage team members
   - Create/delete API keys
   - Configure integrations
   - View all sessions

3. **Member:**
   - View sessions
   - Create API keys
   - Cannot manage team or billing

**Inviting Members:**
```
1. Settings → Team → Invite Member
2. Enter email address
3. Select role
4. Click Send Invitation

The member receives an email with a signup link.
```

### Integrations

**Slack (Pro+):**
- Get notified of high-severity opportunities
- Daily digest of cost savings
- Configure in Settings → Integrations

**Webhooks (Pro+):**
- POST events to your endpoint
- Events: session completed, opportunity detected, baseline changed
- Configure in Settings → Webhooks

**API:**
- Full REST API access
- Same endpoints as self-hosted
- Rate limiting: 1000 req/min (Starter), 5000 req/min (Pro), Unlimited (Enterprise)

## Architecture

Bagula Cloud uses a transparent architecture where we run the open source platform with an added multi-tenancy layer:

```
Your Agent (instrumented)
    │
    │ @bagula/client SDK
    │
    ▼
┌─────────────────────────────────────┐
│       Bagula Cloud (AWS)            │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Cloud Proxy (Private)        │ │
│  │  - Authentication (Clerk)     │ │
│  │  - Multi-tenancy              │ │
│  │  - Billing (Stripe)           │ │
│  │  - Usage tracking             │ │
│  └──────────┬────────────────────┘ │
│             │                       │
│  ┌──────────▼────────────────────┐ │
│  │  Bagula Platform (Open Source)│ │
│  │  ghcr.io/justcopyai/bagula    │ │
│  │                                │ │
│  │  - API                         │ │
│  │  - Workers                     │ │
│  │  - Dashboard                   │ │
│  └────────────────────────────────┘ │
│                                     │
│  Database: Aurora PostgreSQL        │
│  Queue: ElastiCache Redis           │
└─────────────────────────────────────┘
```

**Key Points:**
1. We use the exact same container you can run yourself
2. Cloud proxy layer adds multi-tenancy and billing
3. Your data is isolated per organization
4. Easy to migrate to/from self-hosted

## Security

**Data Isolation:**
- Every organization has its own logical database partition
- API keys are scoped to one organization
- No cross-organization data access

**Encryption:**
- All data encrypted at rest (AES-256)
- All data encrypted in transit (TLS 1.3)
- API keys hashed with bcrypt

**Infrastructure:**
- Hosted on AWS (us-east-1 by default)
- Multi-AZ deployment for high availability
- Daily automated backups (7-90 days retention)
- DDoS protection via CloudFlare

**Compliance:**
- SOC 2 Type II (in progress)
- GDPR compliant
- CCPA compliant
- HIPAA available (Enterprise)

**Access Control:**
- Role-based access control (RBAC)
- API key permissions
- SSO for enterprise
- Audit logs (Enterprise)

## Data Retention

**Starter:** 7 days
**Pro:** 90 days
**Enterprise:** Custom (up to 2 years)

After retention period:
- Sessions automatically deleted
- Aggregated metrics kept for analytics
- Can export data before deletion

**Export Data:**
```bash
# Via API
curl -H "Authorization: Bearer your-api-key" \
  https://api.bagula.ai/v1/export/sessions?from=2024-01-01&to=2024-01-31

# Or use dashboard
Dashboard → Export → Date Range → Download JSON/CSV
```

## Migrating to Bagula Cloud

Moving from self-hosted to Bagula Cloud is straightforward:

### 1. Export Your Data (Optional)

If you want to keep historical data:

```bash
# From your self-hosted database
pg_dump -U bagula -d bagula -t agent_sessions -t llm_calls -t tool_calls > export.sql

# Contact support to import into Bagula Cloud
```

### 2. Update Client Configuration

Change your endpoint:

```typescript
// Before (self-hosted)
const bagula = new BagulaClient({
  apiKey: 'your-self-hosted-key',
  endpoint: 'https://bagula.yourcompany.com'
});

// After (cloud)
const bagula = new BagulaClient({
  apiKey: 'bagula_prod_xxxxxxxxx', // Get from bagula.ai
  endpoint: 'https://api.bagula.ai'
});
```

### 3. Deploy

Deploy your updated application. Both endpoints can run simultaneously during migration.

### 4. Decommission Self-Hosted

Once all traffic is on Bagula Cloud, shut down your self-hosted infrastructure.

## Migrating from Bagula Cloud

Want to move back to self-hosted? No problem.

### 1. Export Your Data

```bash
curl -H "Authorization: Bearer your-api-key" \
  https://api.bagula.ai/v1/export/all > export.sql
```

### 2. Deploy Self-Hosted

```bash
git clone https://github.com/justcopyai/bagula.ai.git
cd bagula.ai/platform
docker-compose up -d
```

### 3. Import Data

```bash
psql -U bagula -d bagula < export.sql
```

### 4. Update Client

```typescript
const bagula = new BagulaClient({
  apiKey: 'your-new-self-hosted-key',
  endpoint: 'https://bagula.yourcompany.com'
});
```

## Support

### Free Plans & Starter

- **Community Support:**
  - GitHub Issues
  - Discord community
  - Documentation

- **Email Support:**
  - Response time: 48 hours
  - Business hours only

### Pro

- **Priority Email Support:**
  - Response time: 12 hours
  - 24/5 coverage

- **Slack Channel:**
  - Direct line to engineering team
  - Real-time assistance

### Enterprise

- **Dedicated Support Engineer:**
  - Named support contact
  - Response time: 2 hours (critical), 4 hours (high)
  - 24/7 coverage

- **Quarterly Business Reviews:**
  - Optimization recommendations
  - Feature planning
  - Technical roadmap

## FAQ

**Q: Can I try Bagula Cloud for free?**
A: Yes! We offer a 14-day free trial on all plans. No credit card required for trial.

**Q: What happens if I exceed my plan limits?**
A: You'll be charged overage fees based on your plan. We'll email you when you hit 80% and 100% of your limits.

**Q: Can I downgrade my plan?**
A: Yes, at any time. Changes take effect at the next billing cycle. If your usage exceeds the new plan's limits, you'll need to reduce usage first.

**Q: Is my data secure?**
A: Yes. All data is encrypted at rest and in transit. We're SOC 2 Type II certified and follow industry best practices.

**Q: Can I export my data?**
A: Yes, at any time via API or dashboard. You own your data.

**Q: Do you offer refunds?**
A: Yes, within 30 days of signup for annual plans. Monthly plans are non-refundable but you can cancel anytime.

**Q: Where is my data stored?**
A: US East (us-east-1) by default. Enterprise customers can choose EU (eu-west-1) or custom regions.

**Q: Can I run Bagula on-premise?**
A: Yes, for Enterprise customers. We provide the container, you run it in your infrastructure, and we provide support.

**Q: How do you handle support during my timezone?**
A: Starter/Pro: Business hours (9am-5pm ET). Enterprise: 24/7 coverage.

## Contact

- **Sales:** sales@bagula.ai
- **Support:** support@bagula.ai
- **General:** hello@bagula.ai

**Start your free trial:** [bagula.ai](https://bagula.ai)
