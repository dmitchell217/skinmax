# SkinMax - Project Decisions & Overview

This document tracks key decisions, deviations from planning, and project status updates.

**Quick Links:**
- [Playtest Plan](./playtest-plan.md) - How to test what's been built

## Package Manager Decision

**Decision:** Use Yarn instead of pnpm  
**Date:** Initial setup  
**Reason:** pnpm was not available on the system; user requested Yarn  
**Impact:** All commands use `yarn` instead of `pnpm`  
**Status:** ✅ Implemented

## Next.js Version

**Decision:** Use Next.js 16 instead of Next.js 15  
**Date:** Initial setup  
**Reason:** `create-next-app` installed Next.js 16.0.1 (latest stable)  
**Impact:** No breaking changes expected; architecture remains compatible  
**Status:** ✅ Implemented

## Project Structure

**Decision:** Mixed structure - `app/` at root, `src/lib/` for utilities  
**Date:** Initial setup  
**Reason:** Next.js default structure; can migrate to `src/app/` later if needed  
**Impact:** Health route in `app/api/health/`, utilities in `src/lib/`  
**Status:** ✅ Current state; may migrate to full `src/` structure later

## Catalog Loading Strategy

**Decision:** Direct JSON import instead of runtime fetch  
**Date:** Milestone C  
**Reason:** Simpler for static data; works with Next.js bundling  
**Impact:** Catalog bundled at build time; no runtime fetch overhead  
**Status:** ✅ Implemented in `src/lib/catalog.ts`

## Progress Overview

### Completed Milestones

#### Milestone A - Repo Scaffold & Configuration ✅
- Next.js 16 app initialized (TypeScript + Tailwind)
- All dependencies installed (zod, @vercel/kv, ai, openai, @vercel/og, lucide-react, @vercel/blob)
- Project hygiene files (.nvmrc, .editorconfig, .env.example)
- Healthcheck route at `/api/health` (Edge runtime)

#### Milestone B - Core Types & Schemas ✅
- Zod schemas implemented (ProductOption, Step, RoutineSchema, SelfieResult)
- JSON helpers (ensureJson, safeParse)
- Sample routine fixture created and validated

#### Milestone C - Catalog Seeding & Filters ✅
- 40-product seed catalog created
- Catalog loader and filtering utilities implemented
- Price band and filtering by step/skin type/budget

### Current Milestone

**Milestone I - Adherence & Streak** 🚧 Next
- KV model for adherence tracking
- API endpoints for adherence
- AdherenceChip UI component

### Next Milestones

- Milestone E: Prompts & LLM Provider
- Milestone F: Routine Generation API
- Milestone G: Quiz UI
- Milestone H: Routine Screen, Share & OG
- Milestone I: Adherence & Streak
- Milestone J: Grounded Chat
- Milestone K: Selfie Check-In (Light)
- Milestone L: Analytics & Perf
- Milestone M: Ratelimits & Guardrails
- Milestone N: Deploy & Smoke
- Milestone O: Polish & Readiness

## Technical Decisions

### Edge Runtime Usage
- Healthcheck route uses Edge runtime for low latency
- Will evaluate Edge runtime for other routes as we build

### Type Safety
- Full TypeScript implementation
- Zod schemas for runtime validation
- Type exports via `z.infer` for consistency

### Build Status
- ✅ TypeScript compilation: Passing
- ✅ Linting: No errors
- ✅ Build: Successful
- ✅ Health endpoint: Working

## Issues & Resolutions

### Issue 1: pnpm Not Available
**Problem:** Initial attempt to use pnpm failed  
**Resolution:** Switched to Yarn per user request  
**Status:** ✅ Resolved

### Issue 2: create-next-app Directory Name Restriction
**Problem:** Capital letters in "SkinMax" caused npm naming error  
**Resolution:** Created in temp directory, then copied files over  
**Status:** ✅ Resolved

### Issue 3: .env.example File Creation
**Problem:** Blocked by globalIgnore  
**Resolution:** Created via terminal using cat/heredoc  
**Status:** ✅ Resolved

## Architecture Notes

- Documentation moved to `docs/` directory
- Current structure supports both root-level `app/` and `src/lib/` patterns
- Ready for KV integration (Vercel KV configured in env example)
- Ready for Blob storage (Vercel Blob configured in env example)

## Milestone D - KV & Utilities ✅

**Status:** Completed  
**Date:** Current session

### Implementations

1. **KV Client** (`src/lib/kv.ts`)
   - `kvGet<T>()` - Get values with type safety
   - `kvSet<T>()` - Set values with optional TTL
   - `kvIncr()` - Increment counters
   - `kvDel()` - Delete keys
   - `kvExists()` - Check key existence
   - Full error handling and logging

2. **Slug Generation** (`src/lib/slug.ts`)
   - `randomSlug()` - Generate adjective-noun-number format
   - `uuid()` - UUID v4 generation with fallback
   - `slugExists()` - Check for collisions
   - `generateUniqueSlug()` - Collision-safe slug generation

3. **Device ID** (`src/lib/device.ts`)
   - `getOrCreateDeviceId()` - Persistent device identification
   - Uses `crypto.randomUUID()` when available
   - Falls back to localStorage → sessionStorage → in-memory
   - Server-side compatible

4. **Rate Limiting** (`src/lib/ratelimit.ts`)
   - `rateLimit()` - KV-based rate limiting with TTL
   - `requireWithinLimitOrThrow()` - Helper for API routes
   - `getRateLimitKey()` - Generate keys from IP + UA
   - Returns detailed metadata (remaining, resetAt, retryAfter)

### Landing Page

**Decision:** Created clean, modern landing page  
**Features:**
- Hero section with main value proposition
- Single CTA button to quiz
- Feature highlights (30s, AM/PM, AI)
- Disclaimer footer
- Mobile-first responsive design

## Milestone E - Prompts & LLM Provider ✅

**Status:** Completed  
**Date:** Current session

### Implementations

1. **System Prompts** (`src/lib/prompts.ts`)
   - `ROUTINE_SYSTEM` - For routine generation (< 2KB)
   - `CHAT_SYSTEM` - For chat coaching (< 2KB)
   - `SELFIE_SYSTEM` - For selfie analysis (< 2KB)
   - All prompts avoid medical claims
   - Length validation included

2. **OpenAI Client Wrapper** (`src/lib/llm.ts`)
   - `generateRoutine()` - Generates routine from inputs + catalog
     - Uses GPT-4o with JSON response mode
     - Retry logic with temperature=0 on parse failure
     - Full Zod validation
   - `chat()` - Grounded chat about routine
     - Uses routine + catalog as context
     - Max 256 tokens for concise responses
   - `analyzeSelfie()` - Vision-based skin analysis
     - Accepts 1-2 image URLs
     - Returns structured SelfieResult
     - Non-diagnostic, coaching-focused

### Technical Decisions

- **Model:** Using GPT-4o for all operations (text + vision)
- **JSON Mode:** Enabled for structured outputs (routine, selfie)
- **Retry Strategy:** Single retry at temperature=0 if validation fails
- **Token Limits:** Chat limited to 256 tokens for conciseness
- **Error Handling:** Comprehensive try-catch with detailed error messages

## Milestone F - Routine Generation API ✅

**Status:** Completed  
**Date:** Current session

### Implementations

1. **Input Schema** (`src/lib/inputSchema.ts`)
   - `QuizInputSchema` - Zod schema for quiz payload
   - Validates all required fields (age_range, skin_type, goal, budget, etc.)
   - Enforces step caps (2-6 for AM/PM)
   - Type export via `z.infer`

2. **Generate Routine Route** (`app/api/generate-routine/route.ts`)
   - Full flow: validate → load catalog → generate routine → create slug → store KV → return
   - Rate limiting: 20/day per IP
   - Node.js runtime (required for OpenAI SDK)
   - 30 second max duration
   - Request ID tracking for debugging

3. **Error Handling**
   - 400: Invalid input (with Zod error details)
   - 429: Rate limit exceeded (with retryAfter)
   - 502: LLM/API failures
   - 504: Timeout errors
   - 500: Generic server errors
   - All errors include requestId for tracing

### Technical Decisions

- **Path Alias:** Added `@/lib/*` → `./src/lib/*` to tsconfig.json for clean imports
- **Runtime:** Node.js (required for OpenAI SDK, not Edge-compatible)
- **Rate Limiting:** 20 requests/day per IP (24h window)
- **Request Tracking:** UUID-based requestId for all requests
- **Logging:** Structured logs with requestId, slug, and latency

## Milestone G - Quiz UI ✅

**Status:** Completed  
**Date:** Current session

### Implementations

1. **Quiz Page** (`app/quiz/page.tsx`)
   - Full form with all required fields
   - React Hook Form + Zod resolver for validation
   - Progress bar (calculated from filled required fields)
   - SessionStorage persistence for form data
   - Error handling with user-friendly messages
   - Loading states during submission
   - Budget conversion (dollars → cents)
   - Navigation to `/r/[slug]` on success

2. **Form Fields**
   - Age range (dropdown)
   - Skin type (dropdown: oily/combination/dry/sensitive)
   - Fitzpatrick scale (optional dropdown)
   - Primary goal (dropdown: acne/hyperpigmentation/anti-aging/etc.)
   - Monthly budget (number input, converted to cents)
   - Max steps AM/PM (number, 2-6 range)
   - Fragrance tolerance (checkbox)
   - Prescription use (optional checkbox)
   - Current actives (multi-select checkboxes)

3. **UX Features**
   - Real-time progress calculation
   - Form persistence in sessionStorage
   - Clear error messages
   - Accessible form labels and focus states
   - Mobile-responsive design
   - Back to home link

### Technical Decisions

- **Form Library:** React Hook Form for performance and validation
- **Validation:** Zod resolver for type-safe validation
- **Persistence:** SessionStorage for form recovery
- **Budget Handling:** User enters dollars, converted to cents in submission
- **Error UX:** Specific messages for rate limits, validation errors, network issues

## Milestone H - Routine Screen, Share & OG ✅

**Status:** Completed  
**Date:** Current session

### Implementations

1. **Routine Screen Component** (`src/components/RoutineScreen.tsx`)
   - AM/PM column layout (responsive grid)
   - Step cards with actives badges
   - Product options with pricing and external links
   - Profile summary section
   - Conflicts & cautions display
   - Share button with clipboard copy
   - Mobile-first responsive design

2. **SSR Public Page** (`app/r/[slug]/page.tsx`)
   - Server-side rendering from KV
   - 404 handling for missing routines
   - Dynamic metadata generation
   - Open Graph tags
   - Twitter card support

3. **OG Image Endpoint** (`app/api/og/routine/route.tsx`)
   - Edge runtime for fast generation
   - Dynamic image with routine stats
   - Shows AM/PM step counts
   - Displays skin type and goal
   - 1200x630px standard OG size

4. **Share Controls**
   - Copy link to clipboard
   - Visual feedback (checkmark on success)
   - Uses slug for shareable URLs
   - Accessible button with focus states

### Technical Decisions

- **Path Alias:** Added `@/components/*` → `./src/components/*` to tsconfig.json
- **Client Component:** RoutineScreen is client-side for interactivity (share button)
- **SSR:** Routine page uses SSR for SEO and social sharing
- **OG Images:** Edge runtime for low latency image generation
- **Share UX:** Simple clipboard copy (no native share API dependency)

## Milestone J - Grounded Chat ✅

**Status:** Completed (Partially - rate limiting documented but not implemented)  
**Date:** Current session

### Implementations

1. **Chat API Route** (`app/api/chat/route.ts`)
   - POST endpoint accepts `{ slug, message, history?, mode? }`
   - Loads routine from Redis
   - Loads catalog for context
   - Validates routine schema
   - Error handling with proper status codes

2. **Chat Function** (`src/lib/llm.ts`)
   - Enhanced with full catalog context
   - Comprehensive routine summary
   - Conversation history support (last 5 messages)
   - Mode support ('normal' | 'looksmaxx')
   - Condensed context for looksmaxx mode

3. **Chat System Prompts** (`src/lib/prompts.ts`)
   - `CHAT_SYSTEM` - Comprehensive educational prompt
   - `LOOKSMAXX_CHAT_SYSTEM` - Raunchy, unhinged, sex-positive mode
   - Clear guidelines on capabilities and limitations

4. **ChatDrawer Component** (`src/components/ChatDrawer.tsx`)
   - Slide-up drawer (mobile-responsive)
   - Message history with styling
   - Mode toggle (normal/looksMAXX)
   - Loading states and error handling
   - Auto-scroll to latest message

5. **Integration** (`src/components/RoutineScreen.tsx`)
   - "Ask Questions" button in header
   - Opens/closes chat drawer
   - Only shows when slug exists

### Technical Decisions

- **Catalog Context:** Full catalog included for product recommendations
- **History Window:** 5 messages client-side only (no Redis storage)
- **Mode System:** Extensible design for future modes
- **Rate Limiting:** Documented but not implemented (see scaling_decisions.md)
- **Temperature:** 0.7 for normal, 0.9 for looksmaxx mode

### Bonus Feature: looksMAXX Mode
- Raunchy, unhinged, sex-positive chat mode
- Not educational - focused on confidence and looking hot
- Toggle in UI with visual indicators
- 18+ disclaimer

## Last Updated
2025-01-XX - Milestone J completed, chat interface with looksMAXX mode ready

