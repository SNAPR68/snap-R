# SnapR Rollback Playbook

## Vercel Instant Rollback
1. Go to https://vercel.com/tscllps-projects/snap-r/deployments
2. Find the last known good deployment
3. Click "..." → "Promote to Production"
4. Takes effect in ~30 seconds

## Git Rollback
```bash
git revert HEAD  # Revert last merge
git push origin main
vercel --prod --yes
```

## Database Rollback
- Supabase point-in-time recovery: Settings → Database → Backups
- Supabase project ref: asoiwonhqoesbvcilqwd
- Maximum recovery window: 7 days

## Cloudflare Worker Rollback
```bash
cd apps/processor
npx wrangler rollback  # Rolls back to previous deployment
```

## Emergency Contacts
- Vercel Dashboard: https://vercel.com/tscllps-projects/snap-r
- Supabase Dashboard: https://supabase.com/dashboard
- Cloudflare Dashboard: https://dash.cloudflare.com
