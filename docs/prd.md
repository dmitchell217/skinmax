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