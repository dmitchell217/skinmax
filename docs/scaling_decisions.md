# SkinMax Scaling Decisions

This document tracks scaling-related decisions and capacity planning.

## Routine Storage TTL

**Decision:** Routines stored in Redis with 30-day TTL (2,592,000 seconds)  
**Date:** 2025-01-XX  
**Reason:** Prevent unbounded growth in Redis storage while maintaining shareability

### Storage Math
- **Per routine:** ~3 KB (key + JSON value)
- **At 30MB total:** ~10,400 routines
- **Growth rate:** ~3 KB per routine generation
- **30-day TTL:** Routines auto-expire after 30 days, preventing accumulation

### Future Consideration
Once we find product-market fit (PMF), we can increase the TTL to:
- **90 days** (7,776,000 seconds) - Better for long-term sharing
- **1 year** (31,536,000 seconds) - Maximum shareability
- **Permanent** (no TTL) - Only if we have clear retention metrics and storage budget

### Rationale
- **Current:** 30 days balances storage costs with user needs
- **Post-PMF:** Longer TTL makes sense when we have:
  - Proven user retention
  - Clear storage budget
  - Metrics showing users return to old routines

## Rate Limit Keys

**Decision:** Rate limit keys expire after 24 hours  
**Status:** ✅ Already implemented  
**Storage:** ~50 bytes per entry, auto-expires

## Chat Conversation History

**Decision:** Maintain last 5 messages in conversation history  
**Date:** 2025-01-XX  
**Reason:** Balance context quality with token costs

### Current Implementation
- **History window:** Last 5 messages (user + assistant pairs)
- **Storage:** Client-side only (no Redis storage)
- **Token impact:** ~100-200 tokens per message in history
- **Total context:** System prompt + routine summary + 5 messages + current message

### Cost Analysis
- **Per message:** ~300-500 tokens (system + routine + history + response)
- **With 5-message history:** ~800-1200 tokens per request
- **Cost:** ~$0.002-0.004 per chat message (gpt-4o pricing)

### Future Scaling Options (Post-PMF)
Once we have product-market fit and user engagement metrics:

1. **Increase history window to 10 messages**
   - **Impact:** Better context for complex conversations
   - **Cost increase:** ~40% more tokens per request
   - **When:** User retention shows multi-turn conversations are valuable

2. **Persist history in Redis**
   - **Key:** `chat:history:{slug}:{session_id}`
   - **Size:** ~2-5 KB per conversation session
   - **TTL:** 7 days (168 hours)
   - **When:** Users frequently return to continue conversations
   - **Storage cost:** Minimal (~$0.01 per 1000 sessions/month)

3. **Unlimited history (with smart summarization)**
   - **Impact:** Best user experience, full conversation context
   - **Cost:** Highest token usage
   - **When:** Clear ROI on user engagement and retention

### Rationale
- **Current (5 messages):** Good balance for most questions, keeps costs low
- **Post-PMF:** Can increase based on:
  - User engagement metrics (avg messages per session)
  - Retention data (users returning to chat)
  - Revenue/cost ratio
  - User feedback on context quality

## Chat Rate Limiting

**Decision:** Rate limiting implemented with three-tier system  
**Date:** 2025-11-07  
**Status:** ✅ Implemented

### Implemented Limits

1. **Per-session limit:** 20 messages per 1-hour window ✅
   - **Key:** `ratelimit:chat:session:{session_id}`
   - **TTL:** 1 hour (3600 seconds)
   - **Implementation:** Client generates session ID (UUID) on chat drawer mount
   - **Rationale:** Prevents abuse while allowing natural conversations

2. **Daily limit:** 100 messages per IP ✅
   - **Key:** `ratelimit:chat:daily:{hashed_ip_ua}`
   - **TTL:** 24 hours (86400 seconds)
   - **Implementation:** Uses IP + User Agent hash for identification
   - **Rationale:** Prevents excessive usage from single users

3. **Per-routine limit:** 50 messages per slug per day ✅
   - **Key:** `ratelimit:chat:routine:{slug}`
   - **TTL:** 24 hours (86400 seconds)
   - **Implementation:** Tracks messages per routine slug
   - **Rationale:** Prevents abuse of shared routine links

### Cost Protection
- **Estimated cost per message:** ~$0.002-0.004
- **20 messages/session:** ~$0.04-0.08 per session
- **100 messages/day:** ~$0.20-0.40 per day per user
- **Rate limits protect against:** Abuse, runaway costs, API quota exhaustion

### Implementation Details
- **Error handling:** Returns 429 status with `Retry-After` header
- **UI feedback:** ChatDrawer shows user-friendly error message with retry time
- **Fail-open:** Rate limit errors are caught and handled gracefully
- **Session ID:** Generated client-side using `crypto.randomUUID()` on component mount

### Future Considerations
- **Premium tier:** Higher limits for paid users
- **Dynamic limits:** Adjust based on user behavior and engagement
- **Rate limit display:** Show remaining messages in UI
- **Different limits for looksMAXX mode:** Could have separate limits if needed

## Other Storage Considerations

### Adherence Data (Future)
- Key: `adherence:{device_id}:{slug}`
- Size: ~200 bytes per entry
- TTL: TBD (likely 90 days or tied to routine TTL)

### Selfie Results (Future)
- Key: `selfie:result:{slug}:{analysis_id}`
- Size: ~500 bytes per entry
- TTL: 24 hours (as per architecture)

## Monitoring

Track these metrics to inform TTL decisions:
- Routine access patterns (how often are old routines viewed?)
- Storage growth rate
- Redis memory usage
- User retention to old routines

## Last Updated
2025-01-XX - Added chat conversation history and rate limiting decisions

