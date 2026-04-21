# SnapR Revenue & Cost Model
*Generated 2026-04-06 | 5-Year Projection*

---

## 1. Pricing Structure (Current)

| Tier | Monthly | Annual (per mo) | Per-Listing | Listings/mo |
|------|---------|-----------------|-------------|-------------|
| **Free** | $0 | $0 | — | 3 |
| **Starter** | $29 | $24 | — | 10 |
| **Pro (Gold)** | $20–28/listing | $11–16/listing | $28 paygo | 5–300 |
| **Agency (Platinum)** | $22–30/listing | $12–18/listing | $30 paygo | 5–300 |
| **Enterprise** | $299 | $249 | — | 9,999 |

### Blended ARPU Assumptions

| Tier | Blended Monthly ARPU | Rationale |
|------|---------------------|-----------|
| Free | $0 | Freemium funnel |
| Starter | $29 | Fixed price |
| Pro | $300 | ~15 listings × $20/listing avg |
| Agency | $660 | ~30 listings × $22/listing avg |
| Enterprise | $299 | Fixed (mostly monthly at launch) |

### Add-on Revenue

| Add-on | Price | Est. Attach Rate |
|--------|-------|-----------------|
| Virtual Renovation (basic) | $15 | 8% of Pro+ users |
| Virtual Renovation (standard) | $25 | 5% of Pro+ users |
| Virtual Renovation (premium) | $50 | 2% of Pro+ users |
| Human Editing (standard) | $5/photo | 15% of Pro+ users, ~3 photos avg |
| Human Editing (rush) | $15/photo | 5% of Pro+ users, ~2 photos avg |
| Extra User Seat | $25/mo | 20% of Agency+ users |

**Blended add-on ARPU**: ~$12/mo across paid user base

---

## 2. Cost Structure

### 2a. Fixed Infrastructure (Monthly)

| Service | Cost/mo | Notes |
|---------|---------|-------|
| **Vercel Pro** | $20 | Hosting, serverless, edge |
| **Supabase Pro** | $25 | PostgreSQL, Auth, Storage, RLS |
| **Cloudflare Workers** | $5 | Paid plan, R2 storage included |
| **Cloudinary** | $89 | Plus plan (CDN, transforms) |
| **Sentry** | $26 | Team plan (error monitoring) |
| **Upstash Redis** | $10 | Rate limiting |
| **Resend** | $20 | Email (Pro plan) |
| **ElevenLabs** | $22 | Voiceover TTS (Starter) |
| **Remotion Lambda** | $0 | Pay-per-render (see variable) |
| **RevenueCat** | $0 | Free until $2,500 MTR |
| **Domain + DNS** | $15 | snap-r.com + Cloudflare DNS |
| **GitHub** | $4 | Team plan (1 seat) |
| **PagerDuty** | $0 | Free tier (5 users) |
| **Total Fixed** | **~$236/mo** | |

### 2b. Variable Costs (Per-User/Per-Action)

| Cost Driver | Unit Cost | Trigger |
|-------------|-----------|---------|
| **OpenAI GPT-4o** (descriptions) | ~$0.15 | Per listing prepared |
| **OpenAI GPT-4o-mini** (captions) | ~$0.03/platform | Per listing, 4 platforms = $0.12 |
| **Replicate** (AI enhancement) | ~$0.05–0.15 | Per photo enhanced |
| **Runware** (sky replacement) | ~$0.02 | Per sky swap |
| **AutoEnhance** (HDR) | ~$0.10 | Per photo |
| **Remotion Lambda** | ~$0.08 | Per video render (3GB, 15min max) |
| **AWS S3** (video storage) | ~$0.023/GB | Video output (~35MB each) |
| **ElevenLabs** (voiceover) | ~$0.18 | Per voiceover (OpenAI TTS fallback: $0.015/1k chars) |
| **Stripe** | 2.9% + $0.30 | Per transaction |
| **RevenueCat** | 1% of MTR >$2,500 | On gross revenue above threshold |
| **Twilio** (SMS/WhatsApp) | ~$0.0079/SMS | Per notification sent |

### 2c. Per-Listing Blended AI Cost

| Step | Cost |
|------|------|
| Photo enhancement (avg 8 photos) | $0.80 |
| Marketing description | $0.15 |
| Social captions (4 platforms) | $0.12 |
| MLS package | $0.00 |
| Property site | $0.00 |
| Scheduled posts | $0.00 |
| Video generation (if Pro+) | $0.26 |
| **Total per listing** | **~$1.33** |

---

## 3. RevenueCat Cost Impact

| MTR Bracket | RC Fee | Effective Rate |
|-------------|--------|----------------|
| $0–$2,500 | $0 | 0% |
| $2,501–$10,000 | 1% of excess | 0.75% blended |
| $10,001–$50,000 | 1% of excess | 0.95% blended |
| $50,001–$100,000 | 1% of excess | 0.975% blended |

**Combined payment processing** (Stripe + RevenueCat):
- Under $2,500 MTR: Stripe only (2.9% + $0.30)
- Over $2,500 MTR: Stripe (2.9% + $0.30) + RC (1%) = **~3.9% + $0.30 effective**

---

## 4. Five-Year Revenue Projection

### Growth Assumptions

| Metric | Y1 | Y2 | Y3 | Y4 | Y5 |
|--------|-----|-----|-----|-----|-----|
| **New signups/mo** | 50 | 150 | 400 | 800 | 1,200 |
| **Free→Paid conversion** | 8% | 10% | 12% | 14% | 15% |
| **Monthly churn (paid)** | 8% | 6% | 5% | 4% | 3.5% |
| **Annual churn (paid)** | 15% | 12% | 10% | 8% | 7% |

### Paid User Tier Mix

| Tier | Y1 | Y2 | Y3 | Y4 | Y5 |
|------|-----|-----|-----|-----|-----|
| Starter | 55% | 45% | 35% | 30% | 25% |
| Pro | 30% | 35% | 38% | 38% | 38% |
| Agency | 12% | 15% | 20% | 22% | 25% |
| Enterprise | 3% | 5% | 7% | 10% | 12% |

### Revenue by Year

#### Year 1 (Launch Year)

| Quarter | Paid Users (end) | MRR | Notes |
|---------|-----------------|-----|-------|
| Q1 | 12 | $2,400 | Soft launch, founder-led sales |
| Q2 | 28 | $5,600 | Product-market fit |
| Q3 | 52 | $11,700 | Content marketing kicks in |
| Q4 | 80 | $19,200 | First enterprise deal |
| **Y1 Total** | | | **$117K ARR run rate** |

#### Year 2

| Quarter | Paid Users (end) | MRR | Notes |
|---------|-----------------|-----|-------|
| Q1 | 115 | $29,000 | |
| Q2 | 160 | $42,000 | |
| Q3 | 210 | $58,000 | |
| Q4 | 270 | $78,000 | |
| **Y2 Total** | | | **$624K ARR** |

#### Years 3–5 Summary

| Year | Paid Users (Dec) | MRR (Dec) | ARR (Dec) | Annual Revenue |
|------|-----------------|-----------|-----------|----------------|
| Y3 | 680 | $210K | $2.5M | $1.8M |
| Y4 | 1,400 | $460K | $5.5M | $4.0M |
| Y5 | 2,500 | $850K | $10.2M | $7.5M |

---

## 5. Five-Year Cost Projection

### Year 1

| Category | Monthly (avg) | Annual |
|----------|--------------|--------|
| Fixed infra | $236 | $2,832 |
| AI/processing (variable) | $800 | $9,600 |
| Stripe fees (2.9%+$0.30) | $350 | $4,200 |
| RevenueCat (1% > $2.5K) | $50 | $600 |
| **Total COGS** | **$1,436** | **$17,232** |
| **Gross Margin** | | **~85%** |

### Year 2

| Category | Monthly (avg) | Annual |
|----------|--------------|--------|
| Fixed infra | $450 | $5,400 |
| AI/processing | $4,500 | $54,000 |
| Stripe fees | $1,500 | $18,000 |
| RevenueCat | $400 | $4,800 |
| **Total COGS** | **$6,850** | **$82,200** |
| **Gross Margin** | | **~87%** |

### Years 3–5 Summary

| Year | Revenue | COGS | Gross Margin | GM% |
|------|---------|------|-------------|-----|
| Y1 | $117K | $17K | $100K | 85% |
| Y2 | $624K | $82K | $542K | 87% |
| Y3 | $1.8M | $198K | $1.6M | 89% |
| Y4 | $4.0M | $400K | $3.6M | 90% |
| Y5 | $7.5M | $675K | $6.8M | 91% |

---

## 6. Unit Economics

### Customer Acquisition Cost (CAC) Targets

| Channel | CAC Target | LTV:CAC |
|---------|-----------|---------|
| Organic/SEO | $0–$20 | 50:1+ |
| Content marketing | $50–$100 | 12:1 |
| Google Ads (real estate SaaS) | $150–$300 | 4:1 |
| Facebook/Instagram Ads | $80–$200 | 6:1 |
| Partner referrals | $100 (commission) | 8:1 |

### LTV by Tier

| Tier | Monthly ARPU | Avg Lifetime | LTV | LTV (with add-ons) |
|------|-------------|-------------|-----|---------------------|
| Starter | $29 | 8 months | $232 | $260 |
| Pro | $300 | 14 months | $4,200 | $4,700 |
| Agency | $660 | 18 months | $11,880 | $13,500 |
| Enterprise | $299 | 24 months | $7,176 | $8,200 |

### Blended LTV: ~$3,200

### Break-Even Analysis

| Scenario | Break-Even Point |
|----------|-----------------|
| Solo founder (no salary) | ~$236 MRR (1 Starter + 1 Pro) |
| With $5K/mo living costs | ~$5,236 MRR (~18 paid users) |
| With 1 engineer ($12K/mo) | ~$17,236 MRR (~58 paid users) |
| With small team (3 people, $30K/mo) | ~$30,236 MRR (~100 paid users) |

---

## 7. RevenueCat-Specific ROI

### What RevenueCat Replaces/Adds

| Capability | Before (DIY) | After (RevenueCat) |
|------------|-------------|-------------------|
| Subscription state machine | Custom Stripe webhook code | RC manages state |
| Entitlement checking | `getPlanLimits()` reads DB | RC SDK checks entitlements |
| Cross-platform billing | Web-only (Stripe) | Web + iOS + Android |
| Trial management | Manual 7/14-day logic | RC trial periods |
| Churn analytics | None | RC Charts dashboard |
| Paywall A/B testing | None | RC Experiments |
| Price testing | Manual Stripe price changes | RC Offerings |
| Refund handling | Manual Stripe portal | Automated per-platform |

### RevenueCat Cost vs. Value

| MTR | RC Cost | Analytics/Experiments Value | Net |
|-----|---------|---------------------------|-----|
| $5K | $25/mo | Saves ~$200/mo eng time | +$175 |
| $20K | $175/mo | Saves ~$500/mo eng time + churn insights | +$325 |
| $50K | $475/mo | A/B pricing could lift 5-15% revenue | +$2K-$7K |
| $100K | $975/mo | Enterprise analytics + cross-platform | +$5K-$15K |

**Verdict**: RevenueCat pays for itself at any scale via reduced engineering burden and churn analytics. The 1% fee is negligible compared to Stripe's 2.9%.

---

## 8. Key Metrics to Track

| Metric | Target Y1 | Target Y3 |
|--------|----------|----------|
| MRR | $19K | $210K |
| Paid users | 80 | 680 |
| Monthly churn | <8% | <5% |
| LTV:CAC | >4:1 | >6:1 |
| Gross margin | >85% | >89% |
| Net revenue retention | >95% | >110% |
| AI cost per listing | <$1.50 | <$1.00 |
| Free→Paid conversion | >8% | >12% |

---

## 9. Risk Factors

| Risk | Impact | Mitigation |
|------|--------|------------|
| AI API price increases | +20-50% COGS | Multi-provider fallback (Replicate, Runware, AutoEnhance) |
| Real estate market downturn | -30% new signups | Agency/Enterprise focus (less cyclical) |
| Stripe rate changes | +0.5% per txn | RevenueCat enables App Store billing (15-30% cut but different market) |
| RevenueCat rate increase | +0.5-1% | Manageable at scale; could switch to custom billing |
| Single-market concentration | Revenue ceiling | i18n (Spanish skeleton ready), international expansion |
| Competitor entry | Price pressure | Moat: full automation loop (prepare→market→distribute→measure) |

---

*Sources: [RevenueCat Pricing](https://www.revenuecat.com/pricing/), Stripe published rates, OpenAI API pricing, internal cost tracking*
