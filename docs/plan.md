# SkinMax — Product Requirements, Architecture, and Cursor Plan

Version: 2025‑11‑06 • Scope: **MVP v0.1 (ship fast)** → v0.2 (auth/payments) → v1.0 (robust vision, creator tools)
Owner: David Mitchell

---

## 0) TL;DR (De‑socialized MVP)

**Core loop:** **Quiz → Tailored Suggestions → Routine/Regimen → Chat** (+ optional **Selfie Check‑In** that does lightweight visual analysis). Social sharing exists but is not a hero feature. The day‑2 value is **daily adherence + quick chat help**, not likes.

* **MVP v0.1f (Fast)**: No auth, no payments, KV persistence, ~40‑item catalog, free. **Includes minimal selfie analysis** (2 photos → simple classifier + friendly guidance).
* **v0.2**: Supabase + Stripe + gated Conflict Checker + Budget Swaps + PostHog.
* **v1.0**: Stronger vision pipeline (trend line, skin zones), creator tools, referral credits.

**Habit hook:** Daily “AM/PM done?” tap with streak + optional local reminder. Zero friction.

---

## 1) Product Requirements Document (PRD)

### 1.1 Goals (MVP v0.1f)

* **Speed:** live prototype for 5–10 testers today.
* **Utility:** produce a clean AM/PM routine **in < 30s** from first click.
* **Adherence:** lightweight daily check‑in with streaks (device‑local or KV by device_id).
* **Coaching:** chatbot answers grounded **only** on the routine + catalog.
* **Selfie Check‑In (light):** accept 2 photos; return non‑diagnostic tags (e.g., redness↑, dryness↔, acne↘) and “what to tweak tonight/tomorrow”.

### 1.2 Non‑Goals (v0.1f)

* No payments/subscriptions (defer to v0.2).
* No deep social graph, feeds, or viral mechanics (share is secondary utility only).
* No medical diagnosis or prescriptions — **educational/coaching only**.

### 1.3 Success Metrics (prototype cohort)

* **TTR (time‑to‑routine)**: < 30s median.
* **First‑session completion:** ≥ 80% reach routine screen.
* **D1 return:** ≥ 30% of testers use check‑in or chat again.
* **Chat helpfulness:** CSAT ≥ 4.3/5.

### 1.4 Personas

* **Primary (14–40)**: wants a routine that fits their skin and budget; minimal steps.
* **Supporters (parents/partners)**: help configure but don’t own the habit.

> Age **14+** only. Tone safe for minors. Default to gentle/fragrance‑free unless opted out.

### 1.5 Key User Stories & Acceptance

1. **Quiz → routine in under a minute.**
   *Given valid inputs, when user submits, then a structured routine appears with AM/PM steps, each with a short “why” and 1–3 matching products by budget/skin type.*

2. **Adherence tap + streak.**
   *From routine screen, user can mark AM or PM done and see streak. Data persists across refresh on the same device.*

3. **Ask AI about the routine.**
   *User opens chat, asks e.g., “Can I use glycolic with tret?” → grounded answer referencing the current plan (no invented products), latency ≤ 6s P95 (256 tok).*

4. **Selfie check‑in** *(optional in v0.1f)*.
   *User uploads 2 selfies (front, 3/4). System returns a compact readout (redness/dryness/acne rough scale; friendly tip), with clear **not medical** disclaimer.*

5. **(Optional) share link** to their routine slug; no social counts.

### 1.6 UX & Flows

**Funnel:** Landing → Quiz → Routine Screen → (Selfie Check‑In) → Chat → (Optional Share)

**Pages/Components**

* **Landing**: hero + single CTA “Start 60‑sec quiz”.
* **Quiz** (8–10 fields) → posts to `/api/generate-routine`.
* **Routine Screen**: AM/PM columns; step tiles with short “why”; 1–3 product options.

  * Top bar: **Mark AM/PM done**, streak chip, **Selfie Check‑In** button, **Ask AI**.
* **Selfie Modal**: upload 2 images → spinner → result tags + 1‑2 actionable suggestions.
* **Chat Drawer**: grounded chat (10 free messages/session cap in v0.1f).
* **Share Page** (secondary): public view of routine by slug; OG image.

### 1.7 Functional Requirements

**Quiz Inputs** (required unless noted):

* Age Range, Skin Type (oily/combination/dry/sensitive), Fitzpatrick (optional), Primary Goal (acne/hyperpigmentation/anti‑aging/barrier), Budget ($/month), Existing Actives (tret, AHA/BHA, vit C, niacinamide, BPO, azelaic), Prescription use (optional), Fragrance tolerance, Max steps AM/PM.

**Routine Generation**

* LLM outputs **strict JSON** (schema in §2.7.2). Steps obey max counts; choices pulled **only** from catalog; include a shallow “Conflicts & Cautions” array (full detail deferred to v0.2).

**Routine Screen**

* Responsive; AM/PM columns; “why” ≤ 140 chars/step; product list (1–3 with price).
* **Adherence:** Mark AM/PM done; show **streak**; data keyed by `{device_id}:{slug}`.
* **Export shopping list** (simple text/CSV) — optional after ship.

**Chat Coach**

* Context = routine JSON + filtered catalog + guardrail system prompt. 10 free messages per session.
* Must **not hallucinate** products; must reference steps/actives present.

**Selfie Check‑In (light)**

* Accept JPG/PNG; 2 images; max 5 MB each.
* Pipeline: upload → store (temporary) → vision call → JSON summary: `{redness:0–3, dryness:0–3, acne:0–3, notes:[], advice:string, confidence:0–1}`.
* Results are **coaching only**, not diagnosis.

**Analytics (v0.1f)**

* Events: `page_view`, `quiz_start|complete`, `routine_generated`, `am_done|pm_done`, `streak_continue`, `selfie_upload|analyzed`, `chat_open|message_sent|message_received`, `share_click`.

### 1.8 Non‑Functional

* **Perf:** non‑LLM TTFB < 500ms; routine P95 < 10s; chat P95 < 6s.
* **Reliability:** 99.9% uptime target for public pages (Vercel SLA).
* **Security/Privacy:** minimal PII (none required for v0.1f). Clear delete images after analysis (e.g., TTL 24h). Ratelimits per IP/UA.
* **Accessibility:** WCAG 2.1 AA essentials; focus management; ARIA for modals.

### 1.9 Legal & Safety

* Prominent **not medical advice** disclaimer on routine, chat, and selfie results.
* Age 14+; reject explicit imagery; blur/ignore backgrounds.

---

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

## 3) Cursor Implementation Plan — **5‑Hour Sprint** (v0.1f)

**Goal:** Ship **quiz → routine → chat** with **selfie check‑in (light)** and adherence streak. No auth/payments.

### Hour 0 — Scaffold & Deps

1. `pnpm dlx create-next-app@latest skinmax --ts --tailwind --app`
2. Install deps: `pnpm add zod @vercel/kv ai openai lucide-react @vercel/og`
   Optional for Blob: `pnpm add @vercel/blob`
3. Add `.env.local`: `OPENAI_API_KEY, KV_REST_API_* , BLOB_READ_WRITE_TOKEN, NEXT_PUBLIC_SITE_URL`.
4. **VERIFY:** `pnpm dev` boots; landing renders.

### Hour 1 — Schemas, Prompts, Catalog

1. Create `src/lib/schema.ts` with `RoutineSchema`, `SelfieResult`.
2. Create `src/lib/prompts.ts` with three system prompts (§2.7.1).
3. Seed `public/seed_products.json` (~40 SKUs) and `src/lib/catalog.ts` filter.
4. **VERIFY:** write a tiny unit test (node) that Zod‑parses a sample routine.

### Hour 2 — Quiz + Generate API

1. Build `QuizForm.tsx` (React Hook Form + Zod) with fields in §1.7.
2. API: `api/generate-routine/route.ts`

   * Validate inputs → filter catalog → call LLM (JSON mode) → Zod parse → slug → save to KV.
   * Return `{slug, routine}`.
3. Route `quiz/page.tsx` → on success: `router.push('/r/[slug]')`.
4. **VERIFY:** Submit sample; KV contains `routine:{slug}`; navigate renders.

### Hour 3 — Routine Screen + Adherence + OG

1. `RoutineScreen.tsx`: render AM/PM; product options; short "why".
2. `AdherenceChip.tsx`: uses `device_id` (generate once, localStorage) → POST to `/api/adherence` (inline in `api/generate-routine` or a simple KV helper). Stores `{am, pm, streak}`.
3. Share page `/r/[slug]/page.tsx` SSR from KV.
4. `api/og/routine/route.ts` → pretty card.
5. **VERIFY:** Mark AM/PM done → streak increments on refresh.

### Hour 4 — Chat

1. `api/chat/route.ts`: enforce message cap, build context (routine + catalog), call LLM.
2. `ChatDrawer.tsx`: local history; optimistic UI.
3. **VERIFY:** Ask “glycolic + tret?” → grounded warning, sunscreen reminder.

### Hour 4.5 — Selfie Check‑In (Light)

1. `SelfieCheckin.tsx`: file inputs (2), preview, send to `/api/upload-selfie` → signed URL → PUT.
2. `api/analyze-selfie/route.ts`: fetch blobs → call vision prompt → Zod parse to `SelfieResult` → store KV 24h.
3. Render chips (e.g., `Redness: 2/3`), 1–2 sentence advice, disclaimer.
4. **VERIFY:** Invalid file type/size rejected; result shows; blobs scheduled for deletion.

### Hour 5 — Polish + Analytics + Ratelimits

1. Add Vercel Analytics events listed in §1.7.
2. Add basic ratelimits (KV counters by IP/UA) per §2.9.
3. Footer disclaimer; tighten copy.
4. **VERIFY:** Lighthouse mobile ≥ 85; routine P95 < 10s; chat P95 < 6s.

### Post‑Sprint (Next Day) — v0.2 Checklist

* Migrate KV → Supabase (auth, RLS); Stripe Pro; Conflict Checker YAML; Budget Swaps; PostHog dashboard.
* Image retention: move selfies to Supabase Storage with signed URLs + user delete.
* Experiment flags for tone/paywall.

---

## 4) Copy Snippets

* **Hero:** “Your derm‑informed routine in 60 seconds. Stick with it daily.”
* **Sub:** “No fluff. Ingredients that work for your skin and budget.”
* **Selfie Disclaimer:** “Educational only, not medical advice. For persistent or severe issues, see a board‑certified dermatologist.”

---

## 5) Risks & Mitigations

* **Model JSON drift** → strict Zod parse + 1 retry at `temperature=0`.
* **Hallucinated products** → pass only filtered catalog; hard‑validate `product_id`s.
* **Vision overreach** → coarse scales only; avoid any diagnostic terms; always include sunscreen reminder.
* **Retention** → make AM/PM tap prominent; nudge after 24h (local reminder UI link; calendar ICS in backlog).

---

## 6) Acceptance (Global)

* All `VERIFY` items pass.
* No invented products in chat.
* Selfie results never display medical claims and are deleted within 24h.
* Median time from landing → routine screen ≤ 30s across testers.
