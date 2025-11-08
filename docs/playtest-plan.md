# SkinMax Playtest Plan

Quick guide to test what's been built so far.

## Prerequisites

### 1. Environment Variables
Create `.env.local` file with:

```bash
# Required for LLM
OPENAI_API_KEY=sk-...

# Required for KV (routines, adherence)
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...

# Optional for now (needed for selfie feature later)
BLOB_READ_WRITE_TOKEN=...

# Site URL for OG images
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

### 2. Start Dev Server
```bash
yarn dev
```

Server should start at `http://localhost:3000`

## Testing Flow

### ✅ Test 1: Landing Page
**URL:** `http://localhost:3000`

**What to check:**
- [ ] Page loads without errors
- [ ] Hero text displays correctly
- [ ] "Start 60-sec quiz" button is visible
- [ ] Button links to `/quiz`
- [ ] Mobile responsive (resize browser)

**Expected:** Clean landing page with CTA

---

### ✅ Test 2: Quiz Form
**URL:** `http://localhost:3000/quiz`

**What to check:**
- [ ] All form fields render
- [ ] Progress bar updates as you fill fields
- [ ] Form validation works (try submitting empty)
- [ ] Dropdowns have options
- [ ] Checkboxes work
- [ ] Form data persists in sessionStorage (check DevTools → Application → Session Storage)

**Fill out form:**
- Age Range: 25-35
- Skin Type: combination
- Goal: acne
- Budget: 50 (dollars)
- Max Steps AM: 4
- Max Steps PM: 4
- Fragrance OK: unchecked
- Submit form

**Expected:** Form validates, shows loading state, then navigates

---

### ✅ Test 3: Routine Generation
**What happens:**
- [ ] Loading state shows "Generating your routine..."
- [ ] API call to `/api/generate-routine`
- [ ] On success: redirects to `/r/[slug]`
- [ ] On error: shows error message (rate limit, network, etc.)

**Check Network Tab:**
- POST to `/api/generate-routine`
- Response should have `{ slug, routine }`
- Status should be 200

**Expected:** Routine generated and stored in KV, redirect to routine page

---

### ✅ Test 4: Routine View
**URL:** `http://localhost:3000/r/[slug]` (from previous step)

**What to check:**
- [ ] Page loads with routine data
- [ ] AM and PM columns display
- [ ] Each step shows:
  - [ ] Title
  - [ ] Actives badges
  - [ ] "Why" explanation
  - [ ] Product options with prices
  - [ ] External link icons
- [ ] Profile summary shows correct info
- [ ] Conflicts/cautions display if present
- [ ] Share button works (copies URL to clipboard)
- [ ] Share button shows "Copied!" feedback
- [ ] Mobile responsive layout

**Expected:** Full routine display with all steps and products

---

### ✅ Test 5: Share & OG Image
**What to check:**
- [ ] Click Share button
- [ ] URL copied to clipboard
- [ ] Paste URL in new tab - should load same routine
- [ ] View page source - check for OG meta tags
- [ ] OG image URL: `/api/og/routine?slug=[slug]`
- [ ] Open OG image URL directly - should show image

**Expected:** Shareable link works, OG tags present, OG image generates

---

### ✅ Test 6: Error Handling

**Test Rate Limiting:**
- Submit quiz 21 times quickly (limit is 20/day)
- Should see rate limit error message

**Test Invalid Input:**
- Try submitting quiz with missing required fields
- Should see validation errors

**Test Missing Routine:**
- Navigate to `/r/invalid-slug-12345`
- Should see 404 page

**Expected:** Appropriate error messages for each case

---

### ✅ Test 7: Health Check
**URL:** `http://localhost:3000/api/health`

**What to check:**
- [ ] Returns `{ ok: true, ts: "..." }`
- [ ] Status 200

**Expected:** Health endpoint working

---

## What's NOT Built Yet (Expected)

These features are planned but not implemented:
- ❌ Adherence tracking (AM/PM check-ins, streaks)
- ❌ Chat coach interface
- ❌ Selfie check-in feature
- ❌ Analytics events
- ❌ Production deployment

## Quick Test Checklist

```
[ ] Landing page loads
[ ] Quiz form works
[ ] Form validation works
[ ] Routine generates successfully
[ ] Routine page displays correctly
[ ] Share button works
[ ] OG image generates
[ ] Error handling works
[ ] Mobile responsive
```

## Troubleshooting

**"Failed to generate routine"**
- Check OpenAI API key is set
- Check KV credentials are set
- Check network tab for error details
- Check console for logs

**"Rate limit exceeded"**
- Wait 24 hours, or
- Clear KV store, or
- Use different IP/device

**"Routine not found"**
- Slug might be invalid
- Check KV store has the routine
- Verify slug matches what was generated

**Build errors**
- Run `yarn build` to see full errors
- Check TypeScript compilation
- Verify all dependencies installed

## Success Criteria

✅ **Core flow works:**
1. Land on homepage
2. Fill out quiz
3. Generate routine
4. View routine
5. Share routine

If all 5 steps work, the MVP core is functional! 🎉

