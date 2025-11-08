# Quick Deploy Commands

## 1. Stage and Commit All Changes

```bash
# Add all files (except those in .gitignore)
git add .

# Commit with descriptive message
git commit -m "feat: SkinMax MVP - Ready for launch

- 60-second routine generation with AI
- Chat coach with routine context
- Glow Score & Tonight's Plan
- Looks Playground
- Rate limiting on all endpoints
- Structured LLM outputs with JSON schemas
- Mobile-responsive UI
- Share functionality with OG images"
```

## 2. Push to GitHub

```bash
# If you haven't added remote yet:
# git remote add origin https://github.com/YOUR_USERNAME/SkinMax.git

# Push to main branch
git push -u origin main
```

## 3. Deploy to Vercel

**Via Dashboard (Easiest):**
1. Go to https://vercel.com/new
2. Import your GitHub repository
3. Vercel auto-detects Next.js
4. Add environment variables:
   - `OPENAI_API_KEY` = your key
   - `REDIS_URL` = your Redis connection string
   - `NEXT_PUBLIC_SITE_URL` = https://your-app.vercel.app (or custom domain)
5. Click "Deploy"

**Via CLI:**
```bash
npm i -g vercel
vercel login
vercel --prod
```

## 4. Verify It Works

After deployment, test:
- `/api/health` → Should return `{ok: true}`
- `/quiz` → Complete quiz → Should generate routine
- `/glow` → Upload photo → Should analyze
- `/looks` → Upload photo → Should show face shape

## That's It! 🚀

Your app is live. Share the URL and start getting feedback!

