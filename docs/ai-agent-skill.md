# Central Parts Finder - AI Agent Skill

## Overview

Central Parts Finder is an Arabic-first inventory discovery platform that connects customers with local stores selling spare parts, tools, industrial supplies, automotive parts, electronics, and machinery components.

**Core Mission:** Help users find any part from participating stores in seconds.

**Location:** `E:\my apps\Central Stores System`
**Tech Stack:** Next.js 16, TypeScript, Tailwind CSS, tRPC, Drizzle ORM, Cloudflare D1

---

## API Authentication

All API calls require an API key in the request body:

```json
{
  "apiKey": "cpa_xxx..."
}
```

API keys are generated from `/admin/agents` panel. Each key has specific permissions.

---

## Permission Scopes

| Scope | Description |
|-------|-------------|
| `read` | Search parts, view stores, view inventory |
| `write` | Create/update inventory, ads |
| `admin` | Full access to all endpoints |
| `store_management` | Verify/reject stores |
| `ads_control` | Create/update/delete ads |
| `ai_control` | View AI providers, models, usage |

---

## Available Endpoints

### Search & Discovery

**Search Parts**
```
POST /api/trpc/agent.agentSearch
{
  "apiKey": "cpa_xxx",
  "query": "بكرة دينمو",
  "filters": {
    "city": "البصرة",
    "categoryId": "optional",
    "manufacturerId": "optional",
    "minPrice": 0,
    "maxPrice": 100000,
    "inStockOnly": true
  }
}
```

**Get Store Details**
```
POST /api/trpc/agent.agentGetStore
{
  "apiKey": "cpa_xxx",
  "storeId": "store-uuid"
}
```

**List Stores**
```
POST /api/trpc/agent.agentListStores
{
  "apiKey": "cpa_xxx",
  "city": "optional",
  "verified": "verified"
}
```

**Get Inventory**
```
POST /api/trpc/agent.agentGetInventory
{
  "apiKey": "cpa_xxx",
  "storeId": "optional"
}
```

**List Categories**
```
POST /api/trpc/agent.agentListCategories
{
  "apiKey": "cpa_xxx"
}
```

**List Manufacturers**
```
POST /api/trpc/agent.agentListManufacturers
{
  "apiKey": "cpa_xxx"
}
```

### Store Management

**Verify Store**
```
POST /api/trpc/agent.agentVerifyStore
{
  "apiKey": "cpa_xxx",
  "storeId": "store-uuid"
}
```

**Reject Store**
```
POST /api/trpc/agent.agentRejectStore
{
  "apiKey": "cpa_xxx",
  "storeId": "store-uuid",
  "reason": "Missing required documents"
}
```

### Ads Management

**Create Ad**
```
POST /api/trpc/agent.agentCreateAd
{
  "apiKey": "cpa_xxx",
  "storeId": "store-uuid",
  "title": "Special Offer",
  "titleAr": "عرض خاص",
  "budget": 50000,
  "startDate": "2026-07-01T00:00:00Z",
  "endDate": "2026-07-31T23:59:59Z",
  "targetQuery": "optional",
  "targetCategory": "optional"
}
```

**List Ads**
```
POST /api/trpc/agent.agentListAds
{
  "apiKey": "cpa_xxx"
}
```

**Update Ad**
```
POST /api/trpc/agent.agentUpdateAd
{
  "apiKey": "cpa_xxx",
  "adId": "ad-uuid",
  "status": "active",
  "budget": 100000
}
```

### AI Control

**Control AI**
```
POST /api/trpc/agent.agentControlAI
{
  "apiKey": "cpa_xxx",
  "action": "list_providers"
}
```

Actions: `list_providers`, `list_models`, `get_usage`

### Dashboard

**Get Stats**
```
POST /api/trpc/agent.agentGetStats
{
  "apiKey": "cpa_xxx"
}
```

---

## Iraqi Cities

Baghdad, Basra, Nineveh, Erbil, Kirkuk, Al-Anbar, Babil, Karbala, Najaf, Diyala, Dhi Qar, Sulaymaniyah, Duhok, Wasit, Muthanna, Al-Qadisiyah, Saladin, Maysan

---

## Part Conditions

- `new` - جديد (New)
- `used` - مستعمل (Used)
- `refurbished` - مُجدد (Refurbished)
- `salvage` - تشليح (Salvage)

---

## Store Status

- `pending` - قيد الانتظار (Pending)
- `verified` - موثق (Verified)
- `rejected` - مرفوض (Rejected)

---

## Iraqi Automotive Terminology

| Iraqi Term | English | Arabic |
|------------|---------|--------|
| لايت | Light | إضاءة |
| بولي | Pulley | بكرة |
| قايش | Belt | حزام |
| كشن | Seat cushion | مقعد |
| كير | Transmission | ناقل حركة |
| سلف | Starter | محرك بدء |
| راديتر | Radiator | المبرد |
| فلتر | Filter | مرشح |
| اكسل | Differential | التفاضلي |
| سايق | Driver | السائق |
| دينمو | Alternator | الدينمو |
| شن | Shock absorber | ممتص صدمات |

---

## Error Codes

| Code | Description |
|------|-------------|
| UNAUTHORIZED | Invalid or missing API key |
| FORBIDDEN | Insufficient permissions |
| NOT_FOUND | Resource not found |
| TOO_MANY_REQUESTS | Rate limit exceeded |
| VALIDATION_ERROR | Invalid input data |

---

## Rate Limits

- Default: 100 requests per minute per API key
- Configurable per agent in admin panel

---

## Example Workflows

### 1. Search and Verify Store
```bash
# Search for parts
curl -X POST http://localhost:3000/api/trpc/agent.agentSearch \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "cpa_xxx", "query": "بكرة دينمو"}'

# Verify a store
curl -X POST http://localhost:3000/api/trpc/agent.agentVerifyStore \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "cpa_xxx", "storeId": "store-uuid"}'
```

### 2. Create Ad Campaign
```bash
curl -X POST http://localhost:3000/api/trpc/agent.agentCreateAd \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "cpa_xxx",
    "storeId": "store-uuid",
    "title": "Summer Sale",
    "titleAr": "تخفيضات الصيف",
    "budget": 100000,
    "startDate": "2026-07-01T00:00:00Z",
    "endDate": "2026-07-31T23:59:59Z"
  }'
```

### 3. Monitor AI Usage
```bash
curl -X POST http://localhost:3000/api/trpc/agent.agentControlAI \
  -H "Content-Type: application/json" \
  -d '{"apiKey": "cpa_xxx", "action": "get_usage"}'
```