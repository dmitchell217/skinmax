# SkinMax Deployment Guide

## Quick Deploy to Vercel

### 1. Push to GitHub

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit: SkinMax MVP ready for launch"

# Add remote (replace with your repo URL)
git remote add origin https://github.com/YOUR_USERNAME/SkinMax.git

# Push to main
git push -u origin main
```

### 2. Deploy to Vercel

**Option A: Via Vercel Dashboard**
1. Go to [vercel.com](https://vercel.com)
2. Click "Add New Project"
3. Import your GitHub repository
4. Vercel will auto-detect Next.js settings
5. Add environment variables (see below)
6. Click "Deploy"

**Option B: Via Vercel CLI**
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel

# Follow prompts (production deployment)
vercel --prod
```

### 3. Environment Variables

Add these in Vercel Dashboard → Project Settings → Environment Variables:

**Required:**
```
OPENAI_API_KEY=sk-...
REDIS_URL=redis://default:...@redis-...:19696
NEXT_PUBLIC_SITE_URL=https://your-domain.vercel.app
```

**Optional (for OG images):**
```
BLOB_READ_WRITE_TOKEN=vercel_blob_...
```

### 4. Verify Deployment

1. Check health endpoint: `https://your-domain.vercel.app/api/health`
2. Test quiz flow: `/quiz` → submit → `/r/[slug]`
3. Test glow score: `/glow` → upload → analyze
4. Test looks: `/looks` → upload → see recommendations
5. Test chat: Open routine → click "Ask Questions"

### 5. Custom Domain (Optional)

1. Go to Project Settings → Domains
2. Add your custom domain
3. Follow DNS configuration instructions
4. Update `NEXT_PUBLIC_SITE_URL` to your custom domain

## Post-Deployment Checklist

- [ ] Health endpoint returns 200
- [ ] Quiz generates routine successfully
- [ ] Routine page displays correctly
- [ ] Share button works
- [ ] OG image generates
- [ ] Glow score analysis works
- [ ] Looks playground works
- [ ] Chat interface works
- [ ] Rate limiting works (test by hitting limits)
- [ ] Mobile responsive on real device
- [ ] Error handling shows friendly messages

## Monitoring

**Vercel Analytics:**
- Enable in Project Settings → Analytics
- View in Vercel Dashboard

**Logs:**
- View in Vercel Dashboard → Deployments → [Deployment] → Functions
- Check for errors, rate limit hits, API timeouts

**Performance:**
- Check Vercel Analytics for:
  - Page load times
  - API response times
  - Error rates

## Troubleshooting

**Build Fails:**
- Check environment variables are set
- Check Node.js version (should be 18+)
- Check build logs in Vercel dashboard

**API Errors:**
- Verify `OPENAI_API_KEY` is set
- Verify `REDIS_URL` is set and accessible
- Check function logs for specific errors

**Rate Limiting Issues:**
- Verify Redis connection
- Check rate limit keys in Redis
- Adjust limits in code if needed

**OG Images Not Generating:**
- Check `@vercel/og` is installed
- Verify Node.js runtime (not Edge) for OG route
- Check function logs for errors

## Cost Monitoring

**OpenAI API:**
- Monitor usage in OpenAI dashboard
- Set up billing alerts
- Current usage: ~$0.01-0.05 per routine generation

**Vercel:**
- Free tier: 100GB bandwidth, 100 serverless function executions/day
- Hobby tier: $20/mo for more resources

**Redis:**
- Monitor in Redis Cloud dashboard
- Current: 30MB storage, 30-day TTL on routines

## Next Steps After Launch

1. **Monitor Analytics:**
   - Track routine generation rate
   - Track chat usage
   - Track glow/looks usage

2. **Gather Feedback:**
   - Watch for user issues
   - Collect feature requests
   - Monitor error rates

3. **Iterate:**
   - Fix bugs as they appear
   - Add missing analytics events
   - Improve error messages
   - Add unit tests

4. **Scale:**
   - Monitor Redis usage
   - Adjust rate limits if needed
   - Consider caching strategies

