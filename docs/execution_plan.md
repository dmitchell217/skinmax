Cursor Execution Plan — Granular, Incremental Tasks

Format: Each task has Deliverable · Context · Validation so Cursor can execute step‑by‑step and we can stop at any time with a working build.

Milestone A — Repo Scaffold & Configuration

A1. Initialize Next.js app
Deliverable: New repo skinmax using Next.js 15 (App Router) + TypeScript + Tailwind.
Context: No example code; clean starter; package manager = pnpm.
Validation: pnpm dev boots at http://localhost:3000 with Tailwind styles applied.

A2. Add dependencies
Deliverable: Install zod @vercel/kv ai openai @vercel/og lucide-react @vercel/blob and dev @types/node if missing.
Context: Use stable versions; avoid canary unless Next 15 requires.
Validation: pnpm i completes; pnpm build succeeds (no type errors).

A3. Project hygiene
Deliverable: .nvmrc, .editorconfig, .env.example with keys: OPENAI_API_KEY, KV_REST_API_URL, KV_REST_API_TOKEN, BLOB_READ_WRITE_TOKEN, NEXT_PUBLIC_SITE_URL.
Context: Do not commit .env.local.
Validation: Repo shows files; environment variables load (see A4 health route).

A4. Healthcheck route
Deliverable: src/app/api/health/route.ts returns {ok:true, ts}.
Context: Use Edge runtime where trivial.
Validation: curl localhost:3000/api/health → 200 JSON with current timestamp.

Milestone B — Core Types & Schemas

B1. Zod schemas
Deliverable: src/lib/schema.ts with ProductOption, Step, RoutineSchema, SelfieResult exactly as defined in §2.7.2.
Context: Add export type aliases via z.infer.
Validation: TypeScript compiles; importing in a test file works.

B2. JSON helpers
Deliverable: ensureJson(input:string) utility that throws on trailing text / invalid JSON; safeParse<T>(zod, data).
Context: Used after LLM returns.
Validation: Unit test feeds malformed JSON → throws; valid JSON → returns object.

B3. Sample routine fixture
Deliverable: src/lib/fixtures/sampleRoutine.json matching RoutineSchema.
Context: Keep within 4 AM / 4 PM steps; include 1–3 product options per step.
Validation: RoutineSchema.parse(sample) passes.

Milestone C — Catalog Seeding & Filters

C1. Seed catalog
Deliverable: public/seed_products.json (~40 SKUs) with fields {id, brand, name, step, actives[], strength?, skin_types[], price_cents, url}.
Context: Prefer gentle/fragrance‑free defaults.
Validation: JSON loads; length ≥ 30.

C2. Catalog types & loader
Deliverable: src/lib/catalog.ts exports type CatalogItem and loadCatalog(): Promise<CatalogItem[]>.
Context: Read from public/seed_products.json at runtime; in prod use static import.
Validation: await loadCatalog() returns array with required fields.

C3. Filtering helpers
Deliverable: filterBy(step, skinType, budgetCents) and priceBand(budgetCents) utilities.
Context: priceBand returns a per‑step target (e.g., $ / $$ / $$$) given monthly budget.
Validation: Unit tests: for oily, cleanser, $20/mo returns at least one CeraVe/COSRX item.

Milestone D — KV & Utilities

D1. KV client
Deliverable: src/lib/kv.ts exporting kvGet<T>(key), kvSet<T>(key, value, ttl?), kvIncr(key).
Context: Use @vercel/kv REST with tokens from env.
Validation: Temporary route api/kv-test sets & reads a value successfully.

D2. Slug & IDs
Deliverable: src/lib/slug.ts with randomSlug() (e.g., calm-sun-otter) and uuid() wrapper.
Context: Collision‑check against KV on write.
Validation: Generate 1000 slugs; no duplicates.

D3. Device ID
Deliverable: src/lib/device.ts → getOrCreateDeviceId() using crypto.randomUUID() stored in localStorage.
Context: Used for adherence and rate‑limits.
Validation: Refresh page retains same device ID.

D4. Rate limit util
Deliverable: rateLimit(key, limit, windowSec) using KV counters + TTL.
Context: Keys combine IP + UA; expose helper requireWithinLimitOrThrow.
Validation: Exceeding calls returns 429 from a sample API.

Milestone E — Prompts & LLM Provider

E1. Prompts
Deliverable: src/lib/prompts.ts exporting three constants: ROUTINE_SYSTEM, CHAT_SYSTEM, SELFIE_SYSTEM from §2.7.1.
Context: Keep < 2KB each; no medical claims.
Validation: Import strings in provider; lengths asserted.

E2. OpenAI client
Deliverable: src/lib/llm.ts with generateRoutine(inputs, catalog) and chat(messages, context) and analyzeSelfie(imageUrls, routine) functions.
Context: Use JSON response mode for routine; one retry at temperature=0 on parse fail.
Validation: Mocked catalog + inputs produce an object that RoutineSchema.parse accepts.

Milestone F — Routine Generation API

F1. Input Zod
Deliverable: src/lib/inputSchema.ts describing quiz payload.
Context: Mirrors PRD fields; enforce step caps 2–6.
Validation: Invalid payload returns 400 with field errors.

F2. /api/generate-routine route
Deliverable: Validates input → filters catalog → calls generateRoutine → Zod‑parses → creates slug → kvSet('routine:'+slug, routine) → returns {slug, routine}.
Context: Edge runtime if OpenAI SDK supports; else Node.
Validation: curl -X POST /api/generate-routine -d '{"inputs":{...}}' → 200 with slug and routine; KV key exists.

F3. Error handling
Deliverable: Return 502 on LLM failure; 504 on timeout; body includes requestId.
Context: Log tokens, latency.
Validation: Force timeouts in dev → observe proper codes.

Milestone G — Quiz UI

G1. Page scaffold
Deliverable: src/app/quiz/page.tsx with hero, form, progress.
Context: React Hook Form + Zod resolver; 10 fields per PRD.
Validation: Invalid states block submit; accessibility labels present.

G2. Submit → navigate
Deliverable: On success, push to /r/[slug]. Persist inputs in sessionStorage for "Back".
Context: Handle loading state + retry.
Validation: Manual: submit sample → lands on routine view.

Milestone H — Routine Screen, Share & OG

H1. Routine screen component
Deliverable: src/components/RoutineScreen.tsx showing AM/PM columns, short "why", product options.
Context: Icons via lucide-react; mobile first.
Validation: Render with fixture; visually correct on mobile/desktop.

H2. SSR public page
Deliverable: src/app/r/[slug]/page.tsx fetches from KV server‑side.
Context: 404 if slug missing.
Validation: /r/test-slug returns SSR HTML (view source shows content).

H3. OG image endpoint
Deliverable: src/app/api/og/routine/route.ts using @vercel/og to render a nice card.
Context: Include goal badge and 2–3 steps.
Validation: Open Graph debugger shows preview; meta tags present on /r/[slug].

H4. Share controls
Deliverable: Copy link button + optional PNG export.
Context: Use navigator.clipboard; PNG export can be deferred.
Validation: Clipboard has URL; PNG (if implemented) downloads a file.

Milestone I — Adherence & Streak

I1. KV model
Deliverable: Key adherence:{device_id}:{slug} storing {am:boolean, pm:boolean, streak:number, updated_at}.
Context: Update rules: increment streak when both AM/PM completed for a day; reset if gap > 36h.
Validation: Manually toggle AM/PM; inspect key; streak increases as expected.

I2. API & UI
Deliverable: POST /api/adherence to upsert; GET /api/adherence?slug to read. AdherenceChip.tsx UI with AM/PM toggles + streak pill.
Context: Use device ID from device.ts.
Validation: Refresh persists; toggles debounce (no rapid writes).

Milestone Ja — Glow Score + Tonight’s Plan

P1. Selfie Uploader (UI + preflight)
Deliverable: SelfieUploader modal/component with capture/upload, client-side downscale to ≤1280px longest edge, and basic lighting check.
Context: Accept image/*; use <canvas> to downscale; compute average luminance and prompt “Move to better light” if too low/high; show disclaimer (“educational, not medical; photo not stored”).
Validation: On iPhone/Android + desktop, select or capture a photo → preview renders <150ms; dark/overexposed photo triggers retake prompt.

P2. Vision Scoring API
Deliverable: POST /api/vision-score (Edge if possible).
Context: Accept multipart/form-data {file, fitzpatrick?}. Call vision-capable LLM with a strict JSON instruction and return:

{ "summary": {
  "glow_score": 0-100,
  "subscores": {"acne":0-5,"redness":0-5,"oil_dry":0-5,"irritation":0-5},
  "issues": ["≤3 strings"], "badges":["≤3 strings"],
  "confidence": 0-1, "needs_better_photo": false
}}


One retry at temp=0.0 if JSON fails. DO NOT persist image; discard buffer after call.
Validation: Upload three sample selfies → 200 JSON within 8s P95; bad lighting returns needs_better_photo:true.

P3. Readout Card
Deliverable: ReadoutCard showing Glow Score (radial gauge), issue chips, and badges.
Context: If confidence < 0.5 show “Low confidence—try again in brighter light”. CTA: Build my fix.
Validation: Rendering under 50ms; score/badges visible above the fold on 390×844 viewport.

P4. Tonight’s Plan API
Deliverable: POST /api/tonight-plan → returns a 3-step plan.
Context: Input = {vision_summary, budget_cents?, fragrance_ok?, skin_type?}.
Server filters your catalog then calls an LLM with strict schema to produce:

{ "version":"v0.1",
  "plan":[
    {"step":"cleanse","actives":["..."],"why":"...","product_options":[{id,brand,name,url,price_cents}]},
    {"step":"treat",   ...},
    {"step":"protect","actives":["SPF"], ...}
  ]
}


Guardrails: if oil_dry>=4 avoid harsh acids; if irritation>=3 bias to barrier repair; always include SPF in “protect”.
Validation: For oily+acne case, plan includes SA/BPO option; for sensitive case, plan avoids strong acids; Zod parse passes 100%.

P5. Readout → Plan Flow
Deliverable: Button on ReadoutCard that calls /api/tonight-plan, renders TonightPlan component with 3 tiles and “Why this” snippets.
Context: Keep under the readout; add Copy Plan (plain text) and Open Product Links.
Validation: Round-trip < 6s P95; links open in new tabs; copy places formatted steps on clipboard.

P6. Shareable Slug Update
Deliverable: Extend your existing share page /r/[slug] to include Glow Score + top issue + Tonight’s Plan (titles only) + “Try yours” CTA.
Context: Store {vision_summary, plan} under slug in KV/DB; OG endpoint shows score + chips.
Validation: Visiting slug on a new device shows full card; OG debugger shows score and chips.

P7. Analytics Events
Deliverable: Fire selfie_start, selfie_scored, plan_requested, plan_rendered, share_click.
Context: Include {confidence, glow_score, oil_dry, acne} in props (rounded).
Validation: Events appear in your analytics console with the right payloads.

P8. Safety & Limits
Deliverable: Rate-limit vision-score (e.g., 5/day/IP) and tonight-plan (20/day/IP); block non-face images by simple heuristic (width/height + face presence flag from model if available).
Context: Always show disclaimer on readout + plan.
Validation: Exceeding limits returns 429 with retry_after; non-image or no-face → 400 with friendly message.

Milestone Jb — Looks Playground v0 (no heavy gen)

Q1. Face-Shape Classifier API
Deliverable: POST /api/face-shape returning {shape: "oval|round|heart|square", confidence:0–1, notes:[...]}.
Context: Use the same uploaded selfie buffer; call vision LLM with strict JSON. One retry at temp=0.0.
Validation: Three selfies produce stable shapes with confidence >0.6; low-angle photos return confidence <0.5.

Q2. Static Style Boards (data)
Deliverable: data/style_boards.json mapping shape → haircuts[] & beards[] and glasses[]:

{
  "square": {
    "haircuts":[
      {"title":"Textured crop","rationale":"softens angular jaw/temples","image_urls":["...","...","..."]},
      {"title":"Medium quiff", "rationale":"adds verticality","image_urls":["...","..."]}
    ],
    "beards":[
      {"title":"Short boxed","rationale":"keeps jaw clean, avoids bulk","image_urls":["..."]}
    ],
    "glasses":[
      {"title":"Round acetate","rationale":"softens corners","affiliate_url":"https://..."}
    ]
  }
}


Context: Use royalty-free or placeholder images for now; include 2–3 items per list.
Validation: JSON parses; at least 8 total haircut tiles across shapes.

Q3. Advisors (server helpers)
Deliverable: getStyleBoard(shape) and getGlasses(shape) utilities.
Context: Pure data lookup with simple fallbacks (if confidence <0.5 → return two shapes’ boards merged with a “low confidence” note).
Validation: Unit tests: unknown shape → throws; low confidence → merged list.

Q4. Looks Playground UI
Deliverable: /looks page with:

Upload/Capture (reuse SelfieUploader) → Face-shape result chip,

Haircut & Beard Advisor (Style tiles; carousel),

Glasses Advisor (tile grid with affiliate links).
Context: Use same disclaimer; tone = “roast-lite, kind”. Add Copy/Share buttons.
Validation: End-to-end on mobile: selfie → shape chip → tiles render in <1s; external links open.

Q5. Composite Share Card
Deliverable: OG/share image update that can show both Glow Score (if present) and Face Shape + 1–2 top tiles (titles only).
Context: If only Looks is used, hide Glow; if only Glow, hide Face Shape.
Validation: Two scenarios render correctly in OG debugger.

Q6. Affiliate Wiring (placeholder)
Deliverable: For glasses tiles support affiliate_url; add ?ref=skinroute query param via helper.
Context: Open in new tab; track affiliate_click with {shape, title}.
Validation: Clicks fire event and navigate with query param.

Q7. Analytics Events
Deliverable: looks_selfie_start, face_shape_done, looks_share_click, affiliate_click.
Context: Include {shape, confidence} on face_shape_done.
Validation: Verify payloads in analytics.

Q8. Copy & Guardrails
Deliverable: Microcopy that sets tone and scope:

“This is cosmetic coaching, not medical advice.”

“Low confidence—photo angle/lighting may affect shape.”
Context: Place above tiles and in share footer.
Validation: Copy visible on all Looks states; a11y labels present.

Milestone K — Grounded Chat

J1. /api/chat route
Deliverable: Accept {slug, message}; load routine; build context (routine + step/actives + filtered catalog); enforce 10 free messages/session (KV counter).
Context: Prepend CHAT_SYSTEM.
Validation: curl returns concise, grounded answer ≤ 180 words.

J2. Chat UI
Deliverable: src/components/ChatDrawer.tsx with toggle, list, input; persists history in localStorage.
Context: Show token/thinking spinner; handle 429 gracefully.
Validation: Ask "glycolic + tret?" → warns about alternating nights + SPF reminder.

Milestone L — Analytics & Perf

L1. Instrument events
Deliverable: Vercel Analytics + custom event helpers track(name, payload).
Context: Fire events: quiz_start|complete, routine_generated, am_done|pm_done, streak_continue, selfie_*, chat_*, share_click.
Validation: Dev console/network shows beacons with correct payloads.

L2. Perf budgets
Deliverable: Add timing logs around LLM calls; measure P95 in console.
Context: Aim: routine < 10s P95; chat < 6s P95.
Validation: Local runs show timings; adjust model params if needed.

Milestone M — Ratelimits & Guardrails

M1. Limits
Deliverable: Apply rateLimit to generate (20/day/IP), chat (60/day/IP), selfie (5/day/IP).
Context: Return 429 with retry_after seconds.
Validation: Script triggers > limits → receives 429 consistently.

M2. Safety
Deliverable: Vision/content guard: reject non‑face/explicit using basic heuristics; LLM prompt prohibits diagnosis.
Context: Always show disclaimer on routine, chat, selfie.
Validation: Upload non‑image file → 400; prompt tries to diagnose → model reply deflects.

Milestone N — Deploy & Smoke

N1. Vercel project
Deliverable: Connected Git repo; preview deployments enabled.
Context: Add env vars in Vercel; protect prod branch.
Validation: Preview URL loads; /api/health ok.

N2. Smoke tests
Deliverable: Manual path: Landing → Quiz → Routine → Chat → (Selfie) → Share.
Context: Log request IDs; verify KV keys created.
Validation: End‑to‑end completes with no console errors.

Milestone O — Polish & Readiness

O1. Accessibility & copy
Deliverable: Labels, focus order, ARIA for modals; final copy from §4.
Context: Teens‑safe tone; no medical claims.
Validation: Keyboard nav works; Lighthouse a11y ≥ 90.

O2. Error/empty states
Deliverable: Friendly errors for network/timeout; empty product list suggests "skip or generic".
Context: Keep messages < 2 sentences.
Validation: Simulate API 502 → UI shows retry + guidance.

O3. Styles
Deliverable: Simple, clean Tailwind; cards with soft shadows; badges for actives.
Context: Mobile first; no blocking external fonts needed.
Validation: Visual pass on iPhone 13/Chrome responsive.

How to run this as an incremental script

Complete Milestone A, commit.

After each task, run its Validation and commit with feat(A1): ... style messages.

Keep the app runnable after every commit; no dead states.

Timebox LLM tuning; if JSON parse fails twice, lower temperature and trim prompt.