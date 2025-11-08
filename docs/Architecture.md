## 2) Product Architecture Document

### 2.1 Stack

* **Frontend/Server**: Next.js 15 (App Router) on Vercel (Edge where possible).
* **KV**: Vercel KV (Redis) — store routines, slugs, adherence, short‑lived selfie results.
* **Blob Storage**: Vercel Blob for temporary selfie storage (24h TTL delete job).
* **LLM**: OpenAI (text + vision) via server routes.
* **Analytics**: Vercel Analytics (PostHog in v0.2).

### 2.2 High‑Level Data Flow

```
[Browser]
  ↕ HTTPS
[Next.js (Vercel)]
  ├─ /api/generate-routine  ──> [LLM Text] ──> [Zod validator] ─> [KV:routines]
  ├─ /api/chat              ──> [Context builder (routine+catalog)] ─> [LLM Text]
  ├─ /api/upload-selfie     ──> [Blob signed URL] → client PUT
  ├─ /api/analyze-selfie    ──> [Blob get] ─> [LLM Vision] ─> [KV:analysis]
  ├─ /r/[slug] (SSR)        ──> [KV:routines]
  └─ /api/og/routine        ──> [@vercel/og]
```

### 2.3 Repository Skeleton

```
skinmax/
  src/app/
    page.tsx                    # Landing
    quiz/page.tsx               # Quiz
    r/[slug]/page.tsx           # Routine view (SSR)
    api/generate-routine/route.ts
    api/chat/route.ts
    api/upload-selfie/route.ts  # returns signed URL & object key
    api/analyze-selfie/route.ts # LLM vision + JSON result
    api/og/routine/route.ts
  src/components/
    QuizForm.tsx
    RoutineScreen.tsx
    ChatDrawer.tsx
    SelfieCheckin.tsx
    AdherenceChip.tsx
  src/lib/
    schema.ts        # Zod schemas
    prompts.ts       # system prompts
    llm.ts           # provider wrappers
    kv.ts            # KV helpers
    blob.ts          # Blob helpers
    catalog.ts       # filtering
    device.ts        # device_id util (crypto + localStorage)
  public/seed_products.json
```

### 2.4 Environment Variables

```
OPENAI_API_KEY=
KV_REST_API_URL=
KV_REST_API_TOKEN=
BLOB_READ_WRITE_TOKEN=
NEXT_PUBLIC_SITE_URL=
```

### 2.5 KV Keys (examples)

* `routine:{slug}` → routine JSON
* `adherence:{device_id}:{slug}` → `{am_done:boolean, pm_done:boolean, streak:number, updated_at}`
* `selfie:result:{slug}:{analysis_id}` → JSON result (expires 24h)

### 2.6 Catalog (seed)

* `public/seed_products.json` ≤ 40 SKUs; fields: `{id, brand, name, step, actives[], strength?, skin_types[], price_cents, url}`.
* Filter by step + compatible skin_types + budget band.

### 2.7 AI Contracts

#### 2.7.1 System Prompts

**Routine Generator** (system):

> You are a dermatology‑informed skincare coach. Output **strict JSON** per the schema. Respect max steps and budget. Choose products **only** from the provided catalog (by `product_id`). Include a shallow `conflicts` and `cautions` list. If no suitable product exists for a step, omit the step and explain why in `cautions`.

**Chat Coach** (system):

> Use the user’s routine and catalog as the only product sources. Give educational, non‑diagnostic guidance. For severe/persistent issues, recommend consulting a board‑certified dermatologist. Keep answers concise (≤ 180 words) unless asked otherwise.

**Selfie Analyzer (light)** (system):

> You are a non‑diagnostic skincare assistant. Given 1–2 face photos, return a compact JSON with coarse scales for **redness, dryness, acne** (0–3), a few `notes[]`, a 1–2 sentence `advice` grounded in the user’s routine, and a `confidence` 0–1. Do not speculate about diseases or medications. Always remind about sunscreen.

#### 2.7.2 Zod Schemas (TypeScript)

```ts
export const ProductOption = z.object({
  product_id: z.number(),
  brand: z.string(),
  name: z.string(),
  url: z.string().url(),
  price_cents: z.number(),
});

export const Step = z.object({
  step_id: z.string(),
  title: z.string(),
  actives: z.array(z.string()),
  why: z.string().max(180),
  options: z.array(ProductOption).min(1).max(3),
});

export const RoutineSchema = z.object({
  version: z.string(),
  profile: z.object({
    age_range: z.string(),
    skin_type: z.enum(["oily","combination","dry","sensitive"]),
    fitzpatrick: z.string().optional(),
    goal: z.string(),
    budget_per_month_cents: z.number(),
    fragrance_ok: z.boolean(),
    max_steps_am: z.number().int().min(2).max(6),
    max_steps_pm: z.number().int().min(2).max(6),
    actives_in_use: z.array(z.string()).optional(),
  }),
  morning: z.array(Step),
  evening: z.array(Step),
  conflicts: z.array(z.string()),
  cautions: z.array(z.string()),
});

export const SelfieResult = z.object({
  redness: z.number().min(0).max(3),
  dryness: z.number().min(0).max(3),
  acne: z.number().min(0).max(3),
  notes: z.array(z.string()).max(6),
  advice: z.string().max(240),
  confidence: z.number().min(0).max(1),
});
```

### 2.8 API Contracts

**POST `/api/generate-routine`**
Req: `{ inputs: {...} }` → Res `200 { slug, routine }`

**POST `/api/chat`**
Req: `{ slug, message }` → Res `200 { reply }`

**POST `/api/upload-selfie`**
Req: `{ slug, mime, bytes_estimate }` → Res `200 { signedUrl, blobKey }`

**POST `/api/analyze-selfie`**
Req: `{ slug, keys: [blobKey1, blobKey2] }` → Res `200 { analysis_id, result: SelfieResult }`

**GET `/r/[slug]`**
SSR routine by slug. OG at `/api/og/routine?slug=`

### 2.9 Ratelimits (KV)

* Generate routine: 20/day/IP.
* Chat: 60/day/IP.
* Selfie: 5/day/IP.

### 2.10 Safety & Moderation

* Reject non‑face or explicit images (basic pixel‑heuristics + model flag).
* Never store selfies longer than 24h in v0.1f; delete on analyze or cron.

### 2.11 Observability

* Structured logs (route, latency, tokens, key ids).
* Error sampling to console; v0.2 → PostHog + alerts.

---