# Bagula Deployment Options

Bagula offers **two deployment options** - both using the same client SDK:

## 1. Open Source (Self-Hosted) 🆓

Deploy the entire Bagula platform on your own infrastructure.

### Advantages
- ✅ **100% Free** - No usage fees
- ✅ **Full Control** - Your data stays with you
- ✅ **All Features** - Complete platform included
- ✅ **Customizable** - Modify as needed
- ✅ **No Limits** - Unlimited agents, sessions, users

### Quick Start

```bash
# Clone repository
git clone https://github.com/bagula-ai/bagula.git
cd bagula/platform

# Start services
docker-compose up -d
```

**What's Included:**
- FastAPI ingestion server
- PostgreSQL (TimescaleDB) database
- Redis message queue
- 3 background workers (baseline, anomaly, metrics)
- React dashboard UI

**Access:**
- API: http://localhost:8000
- Dashboard: http://localhost:3000

### Infrastructure Requirements

**Minimum (Development):**
- 2 CPU cores
- 4 GB RAM
- 20 GB storage

**Recommended (Production):**
- 4+ CPU cores
- 16 GB RAM
- 100+ GB storage (grows with data)
- Load balancer (for HA)

### Deployment Options

#### Docker Compose (Single Server)
```bash
docker-compose -f docker-compose.prod.yml up -d
```

#### Kubernetes (Scalable)
```bash
kubectl apply -f k8s/
```

#### AWS/GCP/Azure
Use provided Terraform configs:
```bash
cd terraform/aws
terraform apply
```

---

## 2. Bagula Cloud (Managed) ☁️

Use Bagula's managed cloud service - no infrastructure needed.

### Advantages
- ✅ **Zero Ops** - We manage everything
- ✅ **Auto-Scaling** - Handles any load
- ✅ **Always Updated** - Latest features automatically
- ✅ **99.9% Uptime** - SLA guaranteed
- ✅ **Enterprise Features** - Advanced analytics, teams, SSO
- ✅ **Support** - Dedicated support team

### Quick Start

```bash
# 1. Sign up at bagula.ai
# 2. Get your API key
# 3. Install client
npm install @bagula/client

# 4. Use it
const bagula = new BagulaClient({
  apiKey: 'your-cloud-api-key',
  endpoint: 'https://api.bagula.ai'  // Cloud endpoint
});
```

That's it! Your data automatically flows to the cloud.

### Pricing (Coming Soon)

#### Free Tier
- 1,000 sessions/month
- 3 team members
- 30 days data retention
- Community support

#### Team ($99/month)
- 10,000 sessions/month
- 10 team members
- 90 days retention
- Email support

#### Business ($499/month)
- 100,000 sessions/month
- Unlimited team members
- 1 year retention
- Priority support
- Advanced analytics

#### Enterprise (Custom)
- Unlimited sessions
- SSO & advanced security
- Custom retention
- SLA guarantees
- Dedicated support
- On-premise option

---

## Comparison

| Feature | Open Source | Cloud |
|---------|-------------|-------|
| **Core Platform** | ✅ | ✅ |
| Session tracking | ✅ | ✅ |
| Baseline comparison | ✅ | ✅ |
| Anomaly detection | ✅ | ✅ |
| Cost/latency monitoring | ✅ | ✅ |
| Dashboard UI | ✅ | ✅ |
| **Infrastructure** | | |
| Self-managed | ✅ | ❌ |
| Managed service | ❌ | ✅ |
| Auto-scaling | Manual | ✅ |
| **Enterprise Features** | | |
| Teams & permissions | Basic | ✅ |
| SSO (SAML, OAuth) | DIY | ✅ |
| Advanced analytics | Basic | ✅ |
| Autonomous root cause | Coming soon | ✅ |
| Auto-remediation | Coming soon | ✅ |
| Custom integrations | DIY | ✅ |
| **Support** | | |
| Community | ✅ | ✅ |
| Email support | ❌ | ✅ |
| Priority support | ❌ | Business+ |
| Dedicated channel | ❌ | Enterprise |
| **Cost** | | |
| Software | Free | Free tier available |
| Infrastructure | You pay | We pay |
| Operations | Your time | $0 |

---

## Client SDK Works with Both

The **same code** works for both deployments:

```typescript
import { BagulaClient } from '@bagula/client';

// Self-hosted
const bagula = new BagulaClient({
  apiKey: 'your-key',
  endpoint: 'http://localhost:8000'
});

// OR Cloud
const bagula = new BagulaClient({
  apiKey: 'your-cloud-key',
  endpoint: 'https://api.bagula.ai'
});

// Everything else is identical!
const tracker = bagula.getSessionTracker();
// ... same code ...
```

---

## Migration Path

Start self-hosted, move to cloud anytime:

### 1. Start Self-Hosted (Open Source)
```bash
docker-compose up -d
```

### 2. Grow and Scale
Add more resources as needed

### 3. Switch to Cloud (Optional)
```typescript
// Just change endpoint!
endpoint: 'https://api.bagula.ai'
```

### 4. Hybrid (Advanced)
```typescript
// Use cloud for production monitoring
const prodBagula = new BagulaClient({
  endpoint: 'https://api.bagula.ai'
});

// Keep self-hosted for dev/staging
const devBagula = new BagulaClient({
  endpoint: 'http://localhost:8000'
});
```

---

## Which Should You Choose?

### Choose Self-Hosted If:
- ✅ You have ops team/expertise
- ✅ Data must stay on-premise
- ✅ Want 100% control
- ✅ Building internal tools
- ✅ Cost-sensitive at scale

### Choose Cloud If:
- ✅ Want zero operations
- ✅ Need to move fast
- ✅ Prefer managed services
- ✅ Want enterprise features
- ✅ Need support & SLAs

### Start Self-Hosted, Switch Later If:
- ✅ Want to try first
- ✅ Not sure about commitment
- ✅ Have technical team
- ✅ May want cloud later

---

## Open Source → Cloud Feature Parity

**Today (v0.1.0):**
Both have identical core features. Cloud adds managed infrastructure.

**Future (v1.0+):**
Cloud will get advanced features first:
- Autonomous root cause analysis
- Auto-remediation suggestions
- Advanced team collaboration
- Custom ML models for your agents
- White-glove support

But open source will always have:
- Complete observability platform
- Baseline & anomaly detection
- Full dashboard UI
- Self-hosted control

---

## Getting Started

### Self-Hosted
See [platform/README.md](../platform/README.md)

### Cloud
Visit [bagula.ai](https://bagula.ai) (coming soon)

### Questions?
- Self-hosted issues: GitHub Issues
- Cloud support: hello@bagula.ai
- General questions: Discord community

---

**TL;DR:** Same client SDK, same features, your choice of infrastructure. Start open source, switch to cloud anytime.
