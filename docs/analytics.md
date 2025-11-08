# SkinMax Analytics Events

This document tracks all analytics events implemented in the application.

## Current Implementation Status

### ✅ Implemented Events

#### Looks Playground (`/looks`)
1. **`looks_selfie_start`**
   - **Trigger**: When user uploads/takes a photo for face shape analysis
   - **Location**: `app/looks/page.tsx` - `handleImageReady()`
   - **Payload**:
     ```javascript
     {
       event_category: 'looks_playground'
     }
     ```

2. **`face_shape_done`**
   - **Trigger**: When face shape analysis completes successfully
   - **Location**: `app/looks/page.tsx` - `handleImageReady()` (after API response)
   - **Payload**:
     ```javascript
     {
       event_category: 'looks_playground',
       shape: 'oval' | 'round' | 'heart' | 'square',
       confidence: number (0-1, rounded to 2 decimals)
     }
     ```

3. **`looks_share_click`**
   - **Trigger**: When user clicks the "Share" button
   - **Location**: `app/looks/page.tsx` - `handleShare()`
   - **Payload**:
     ```javascript
     {
       event_category: 'looks_playground',
       shape: string (current face shape)
     }
     ```

4. **`affiliate_click`**
   - **Trigger**: When user clicks an affiliate link (glasses recommendations)
   - **Location**: `app/looks/page.tsx` - `handleAffiliateClick()`
   - **Payload**:
     ```javascript
     {
       event_category: 'looks_playground',
       event_label: string (product title),
       shape: string (current face shape)
     }
     ```

### ❌ Not Yet Implemented (from PRD/Plan)

#### Quiz Flow (`/quiz`)
- `quiz_start` - When user starts the quiz
- `quiz_complete` - When user completes and submits the quiz

#### Routine Generation (`/api/generate-routine`)
- `routine_generated` - When a routine is successfully generated

#### Routine Display (`/r/[slug]`)
- `share_click` - When user clicks share button on routine page
- `am_done` - When user marks AM routine as done
- `pm_done` - When user marks PM routine as done

#### Glow Score (`/glow`)
- `glow_selfie_start` - When user uploads photo for glow score
- `glow_score_done` - When glow score analysis completes
  - Should include: `{ glow_score, confidence, acne, redness, oil_dry, irritation }`
- `tonight_plan_requested` - When user clicks "Build My Tonight's Plan"
- `tonight_plan_rendered` - When plan is successfully generated

#### Chat (`/api/chat`)
- `chat_open` - When chat drawer is opened
- `chat_message_sent` - When user sends a message
- `chat_message_received` - When assistant responds

#### Adherence/Streaks (Future)
- `streak_continue` - When user continues their streak

## Implementation Details

### Current Setup
- **Analytics Provider**: Google Analytics (gtag) - checked via `window.gtag`
- **Implementation Pattern**: Conditional checks for `window.gtag` before firing events
- **Event Structure**: Uses `event_category` for grouping related events

### Example Usage
```typescript
if (typeof window !== 'undefined' && (window as any).gtag) {
  (window as any).gtag('event', 'event_name', {
    event_category: 'category_name',
    // additional properties
  });
}
```

## Recommendations

1. **Create Analytics Utility**: Extract analytics calls into a shared utility function to:
   - Ensure consistent event structure
   - Handle provider switching (gtag, PostHog, etc.)
   - Add error handling and fallbacks

2. **Add Missing Events**: Implement the events listed above for complete coverage

3. **Add Page View Tracking**: Track page views for key pages (quiz, glow, looks, routine)

4. **Add Error Tracking**: Track API errors and validation failures

5. **Add Performance Metrics**: Track API response times, page load times

## Next Steps

1. Create `src/lib/analytics.ts` utility
2. Implement missing events in quiz, glow, and routine flows
3. Add page view tracking
4. Consider adding PostHog or Vercel Analytics for better insights

