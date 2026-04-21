# Snap-R.com Audit Export

Use this file as a single source document containing five sheet-ready CSV blocks for Snap-R.com.

## Scored Audit Table

```csv
Category,Score,Status,What’s Working,Main Problems,Priority
Positioning & Messaging,7,Solid,"Clear core offer: AI real estate photo enhancement and marketing support","Too many promises on one page; pricing and plan naming conflict across pages",High
Homepage Conversion,6,Solid,"Strong visuals, before/after treatment, visible CTA","CTA competes with chat widget; proof is weaker than claims; long page diffuses focus",High
Pricing Clarity,4,Underperforming,"Pricing page exists and plans are visible","Homepage, FAQ, and pricing language do not match; enterprise pricing presentation is muddy",Critical
Trust & Credibility,5,Underperforming,"Legal pages exist; polished design helps","Major claims need evidence; limited human/team credibility; thin social proof detail",High
SEO On-Page,5,Underperforming,"Canonical, robots, OG tags, and base metadata exist","/pricing and /contact reuse homepage metadata; some titles are redundant; stale indexed messaging risk",High
Technical SEO,6,Solid,"robots.txt, sitemap.xml, canonical tags, indexable main pages","Sitemap includes low-value auth URLs; broken legacy path /privacy-policy; possible stale crawl signals",High
Content Architecture,6,Solid,"Good spread of supporting pages: FAQ, Academy, Guide, Partners, Developers","Information hierarchy is broad but not tightly sequenced toward one buyer journey",Medium
Accessibility,6,Solid,"Skip link, menu labeling, baseline semantic structure","Needs manual checks for keyboard flow, sliders, floating chat, and contrast in key states",Medium
Performance,5,Underperforming,"Modern deployment and caching via Vercel","Heavy homepage markup, many scripts, third-party tracking/chat likely add overhead",Medium
Security & Privacy Signals,7,Solid,"Good headers: HSTS, CSP, DENY, nosniff, permissions policy","Security promises are not backed by a dedicated trust/security explainer",Medium
Contact & Support,5,Underperforming,"Contact page exists","Contact page appears underdeveloped and lacks strong reassurance or direct human trust cues",Medium
Overall,5.8,Underperforming,"Strong product idea and strong visual execution","Revenue leakage is mostly from inconsistency, trust gaps, and weak lower-funnel polish",High
```

## Issues Log

```csv
ID,Category,Issue,Impact,Effort,Priority,Page,Recommendation
1,Pricing Clarity,"Homepage, FAQ, and pricing page show conflicting plans and pricing",High,Medium,Critical,"/ /faq /pricing","Standardize plan names, prices, and feature comparisons across all pages"
2,SEO On-Page,"Pricing page uses homepage title and meta description",High,Low,High,"/pricing","Write unique title tag and meta description focused on pricing and plans"
3,SEO On-Page,"Contact page uses homepage title and meta description",Medium,Low,High,"/contact","Write unique title tag and meta description focused on contact and support"
4,Technical SEO,"Legacy privacy URL returns 404",Medium,Low,High,"/privacy-policy","301 redirect /privacy-policy to /privacy"
5,Technical SEO,"Sitemap includes low-value auth URLs",Medium,Low,High,"/sitemap.xml","Remove /auth/login and /auth/signup from sitemap"
6,Trust & Credibility,"Strong claims like 500+ professionals, 4.9/5, 46x cheaper, 2880x faster lack visible substantiation",High,Medium,High,"/","Add citations, case studies, proof blocks, or footnotes near claims"
7,Homepage Conversion,"Too many product promises on homepage dilute the main buyer journey",High,Medium,High,"/","Restructure page around upload, enhance, publish flow"
8,Homepage Conversion,"Floating chatbot competes with main CTA",Medium,Low,High,"/","Delay, shrink, or suppress chat until user scroll or exit intent"
9,Trust & Credibility,"Contact page lacks strong human trust cues",Medium,Low,Medium,"/contact","Add named contact, support email, expected response time, and customer reassurance copy"
10,Content Architecture,"Broad site architecture but weak sequencing for first-time buyers",Medium,Medium,Medium,"/","Clarify primary path from homepage to pricing to signup"
11,SEO On-Page,"Redundant title formatting on FAQ and Academy pages",Low,Low,Medium,"/faq /academy","Simplify titles to avoid duplication and improve CTR"
12,Performance,"Homepage ships many scripts and third-party tooling",Medium,Medium,Medium,"/","Audit analytics, chat, and third-party embeds; defer nonessential scripts"
13,Accessibility,"Interactive components may have keyboard and focus issues",Medium,Medium,Medium,"/","Manually test sliders, mobile nav, and floating chat for keyboard accessibility"
14,Security & Privacy Signals,"Security messaging is present but not explained in a trust center",Medium,Medium,Medium,"/ /privacy","Create a trust/security page with data handling, storage, and compliance details"
15,SEO On-Page,"Stale indexed messaging may still reflect old pricing or plan structure",High,Medium,High,"/faq /pricing /","Update copy, submit pages in Search Console, and request reindexing"
16,Content Architecture,"Commercial pages do not clearly segment by persona",Medium,Medium,Medium,"/pricing /partners /developers","Clarify paths for agents, teams, brokerages, and partners"
17,Trust & Credibility,"Testimonials and proof are present but not specific enough",Medium,Medium,Medium,"/","Add company names, use cases, measurable outcomes, and optional headshots"
18,Technical SEO,"Some linked or legacy paths may not be consistently redirected",Low,Low,Medium,"/features /privacy-policy","Review internal links and add redirects for retired URLs"
19,Performance,"Large homepage HTML and media-heavy layout may hurt mobile speed",Medium,Medium,Medium,"/","Compress above-the-fold media and reduce client-side payload"
20,Conversion,"Enterprise offer is visible but value proposition is not sharply differentiated",Medium,Medium,Medium,"/pricing /contact","Clarify enterprise-specific benefits, onboarding, SLAs, and support"
```

## 30-Day Plan

```csv
Week,Focus,Task,Owner,Impact,Effort
Week 1,Messaging,"Unify plan names, pricing, and feature language across homepage, FAQ, and pricing",Marketing + Product,High,Medium
Week 1,SEO,"Write unique title tags and meta descriptions for pricing, contact, FAQ, academy, privacy, and terms",SEO,High,Low
Week 1,Technical SEO,"301 redirect /privacy-policy to /privacy and review old retired URLs",Engineering,Medium,Low
Week 1,Trust,"Add proof notes or evidence for major numerical claims",Marketing,High,Medium
Week 2,Homepage Conversion,"Restructure homepage around a clearer 3-step buyer journey",Marketing + Design,High,Medium
Week 2,Conversion,"Reduce chatbot interference with CTA by delaying or minimizing widget visibility",Growth,Medium,Low
Week 2,Trust,"Improve contact page with named support, response time, and human reassurance copy",Marketing,Medium,Low
Week 2,SEO,"Remove low-value auth URLs from sitemap and resubmit sitemap",Engineering + SEO,Medium,Low
Week 3,Trust,"Create a trust/security page covering privacy, storage, AI usage, and compliance posture",Marketing + Engineering,Medium,Medium
Week 3,Proof,"Expand testimonials with company names, roles, and measurable outcomes",Marketing,Medium,Medium
Week 3,Performance,"Audit third-party scripts and defer or remove nonessential tools",Engineering,Medium,Medium
Week 4,Accessibility,"Run keyboard and focus tests across nav, sliders, forms, and chat",QA + Engineering,Medium,Medium
Week 4,SEO,"Request reindexing for updated homepage, pricing, and FAQ pages in Search Console",SEO,Medium,Low
Week 4,Conversion,"Refine enterprise offer with clearer differentiation and stronger CTA path",Marketing + Sales,Medium,Medium
Week 4,Measurement,"Set baseline KPIs for CTR, signup conversion, bounce rate, and pricing page exits",Growth,High,Low
```

## SEO Fixes

```csv
Page,Current Issue,Recommended Title,Recommended Meta Description,Recommended Primary Keyword,Recommended Secondary Keywords,Technical Fixes,Priority
/,"Homepage is strong visually but broad in focus; claims need support","SnapR | AI Real Estate Photo Enhancement for Listings","Enhance real estate listing photos in seconds with AI sky replacement, virtual staging, twilight edits, and marketing-ready assets built for agents and brokerages.","AI real estate photo enhancement","real estate photo editing, virtual staging, sky replacement, listing photos","Add claim substantiation near hero and proof sections; keep canonical self-referencing; consider Organization schema alongside SoftwareApplication schema",High
/pricing,"Uses homepage metadata instead of pricing-focused metadata","SnapR Pricing | AI Real Estate Photo Editing Plans","Compare SnapR pricing for AI real estate photo editing, virtual staging, twilight conversion, and marketing tools. Choose the plan that fits your listing volume.","real estate photo editing pricing","AI photo editing pricing, virtual staging pricing, real estate marketing software pricing","Add unique title/meta; ensure H1 clearly matches pricing intent; add FAQ schema if pricing questions appear on-page",High
/faq,"Title is redundant; copy appears stale relative to current pricing","SnapR FAQ | Real Estate Photo Editing Questions","Get answers about SnapR pricing, turnaround time, virtual staging, sky replacement, listing limits, and AI real estate photo enhancement workflows.","SnapR FAQ","real estate photo editing FAQ, virtual staging FAQ, AI listing photo questions","Update outdated pricing references; simplify title; add FAQ schema markup",High
/academy,"Title is redundant and page may be under-optimized for educational search","SnapR Academy | Real Estate Photo Marketing Guides","Learn real estate photo editing and listing marketing best practices with tutorials, guides, and AI workflow tips from SnapR Academy.","real estate photo marketing","real estate photography tips, listing marketing guide, AI real estate content","Use article/course schema where applicable; create stronger internal links to product pages",Medium
/guide,"Likely good lead magnet page but can better target downloadable guide intent","Free Real Estate Marketing Guide | SnapR","Download SnapR’s free real estate marketing guide with practical strategies to improve listing photos, attract more buyers, and market properties faster.","real estate marketing guide","listing photo marketing guide, real estate lead magnet, property marketing tips","Add lead-gen specific schema if appropriate; ensure form/indexing strategy matches business goal",Medium
/contact,"Uses homepage metadata instead of contact intent metadata","Contact SnapR | Sales, Support, and Partnerships","Contact SnapR for sales, support, partnerships, or enterprise questions about AI real estate photo enhancement and marketing tools.","contact SnapR","SnapR support, real estate software contact, enterprise demo","Add LocalBusiness or Organization contact markup if relevant; improve page copy for trust and response expectations",High
/privacy,"Live page exists but legacy privacy path is broken","Privacy Policy | SnapR","Read SnapR’s privacy policy to learn how we collect, use, store, and protect data across our AI real estate photo enhancement platform.","SnapR privacy policy","data privacy, AI software privacy, real estate SaaS privacy","301 redirect /privacy-policy to /privacy; keep sitemap and internal links consistent",High
/terms,"Reasonably complete but could be tuned for consistency","Terms of Service | SnapR","Review SnapR’s terms of service, including account use, billing, subscriptions, acceptable use, and platform policies.","SnapR terms of service","software terms, SaaS terms, billing policy","Ensure self-referencing canonical and consistent metadata formatting",Low
/partners,"Opportunity to rank for partner/referral intent","SnapR Partners | Recurring Revenue for Real Estate Referrals","Join the SnapR partner program and earn recurring revenue by referring AI real estate photo enhancement tools to agents, teams, and brokerages.","real estate partner program","referral program for agents, SaaS partner program, brokerage partnerships","Add unique metadata if missing; clarify partner benefits in H1/H2 structure",Medium
/developers,"Opportunity to rank for API and integration intent","SnapR API | Developer Docs and Webhooks","Explore the SnapR API, webhook events, and developer tools for integrating AI-powered real estate photo enhancement into your workflow.","real estate photo editing API","SnapR API, webhooks, developer docs","Add Product/API documentation schema where valid; improve internal links from main nav/footer if strategic",Medium
/sitemap.xml,"Includes low-value auth pages","N/A","N/A","N/A","N/A","Remove /auth/login and /auth/signup from sitemap; keep only pages you want indexed",High
/robots.txt,"Basic crawl rules are present","N/A","N/A","N/A","N/A","Keep current disallows; verify they align with actual private areas and that no important sections are blocked",Low
/privacy-policy,"Returns 404 while /privacy is live","N/A","N/A","N/A","N/A","Add 301 redirect to /privacy to recover legacy links and avoid trust leakage",High
/features,"Returns 404 if linked or referenced anywhere","N/A","N/A","N/A","N/A","Either restore page, remove references, or 301 redirect to the most relevant live page",Medium
```

## Content Rewrite Recommendations

```csv
Page,Section,Current Problem,Recommended Rewrite,Goal,Priority
/,Hero headline,"Offer is broad and slightly generic","Enhance Real Estate Listing Photos in Seconds","Make the value proposition immediate and concrete",High
/,Hero subheadline,"Too many promises compete at once","SnapR helps agents and brokerages turn ordinary property photos into polished, market-ready listings with AI sky replacement, virtual staging, twilight edits, and fast marketing assets.","Clarify what the product does and who it is for",High
/,Hero CTA,"CTA is solid but could be more outcome-led","Start Free","Keep primary CTA simple and low friction",Medium
/,Hero secondary CTA,"Demo framing can be clearer","See Before and After Demo","Drive users into product proof quickly",Medium
/,Proof bar,"Claims are strong but unsupported nearby","Trusted by real estate professionals to enhance listing photos faster and launch marketing campaigns with less manual work.","Reduce risk from unsubstantiated hard numbers if evidence is limited",High
/,How it works,"Page is too feature-dense before the buyer journey is fully clear","1. Upload your property photos 2. Choose enhancements like sky replacement, virtual staging, or twilight 3. Download polished listing assets and marketing content in minutes","Create a clean conversion narrative",High
/,Feature section,"Too many features read as a product dump","From empty rooms to standout listings: edit photos, stage rooms, improve skies, create social posts, and launch polished marketing materials from one workflow.","Bundle features around outcomes instead of listing tools",Medium
/,Social proof,"Testimonials likely need more specificity","Add testimonials in this format: Name, role, company, and one measurable outcome such as faster listing prep or lower editing cost.","Increase credibility and conversion confidence",High
/,Claim footnotes,"Large performance claims may feel unbelievable","Based on internal benchmarks and customer-reported workflows. Contact us for methodology.","Protect trust while preserving strong positioning",High
/pricing,Pricing intro,"Current plan structure appears inconsistent across site","Choose the SnapR plan that matches your listing volume and marketing workflow. Every plan includes AI photo enhancement tools, with higher tiers unlocking more output and support.","Make pricing page match the rest of the site and reduce confusion",High
/pricing,Plan descriptions,"Plan naming and value differentiation are unclear","Gold: Best for individual agents managing active listings. Platinum: Best for teams and brokerages that need more listings, faster workflows, and deeper support. Enterprise: For high-volume organizations that need custom onboarding, controls, and service.","Clarify segmentation and value by audience",High
/pricing,Enterprise CTA,"Enterprise offer is vague","Talk to Sales About Enterprise","Create a stronger enterprise path",Medium
/faq,Intro,"FAQ may still reflect outdated plans and pricing","Find answers about SnapR pricing, listing limits, virtual staging, turnaround time, billing, and platform features.","Refresh stale search-facing copy",High
/faq,Pricing question,"Old pricing language creates trust risk","How much does SnapR cost? SnapR offers multiple plans based on listing volume and workflow needs. Visit our pricing page for the latest plan details and included features.","Prevent stale FAQ pricing from drifting again",High
/faq,Turnaround question,"Likely needs stronger confidence framing","How fast are edits completed? Most enhancements are generated in seconds, so you can prepare listings and marketing assets much faster than with traditional editing workflows.","Support speed promise without overcommitting",Medium
/academy,Page intro,"Educational value is present but can better connect to product","Learn how to improve listing photos, market properties faster, and use AI tools more effectively with practical guides from SnapR Academy.","Strengthen informational search intent",Medium
/guide,Lead magnet intro,"May need a clearer benefit-led framing","Download the free real estate photo marketing guide to learn how better visuals and faster marketing workflows can help your listings stand out.","Improve conversion on downloadable guide page",Medium
/contact,Headline,"Contact page appears thin and generic","Talk to the SnapR Team","Make the page feel more human and credible",High
/contact,Support copy,"Lacks reassurance and response expectations","Questions about pricing, partnerships, support, or enterprise use? Send us a message and our team will get back to you as quickly as possible.","Reduce uncertainty before inquiry",High
/contact,Enterprise block,"Enterprise buyers need tailored reassurance","Need rollout help for a team or brokerage? We can walk you through onboarding, workflow fit, and account setup.","Improve enterprise lead conversion",Medium
/privacy,Intro copy,"Policy exists but trust value could be clearer","This policy explains what data SnapR collects, how it is used, and the choices available to customers using our platform.","Make policy page easier to understand at a glance",Low
/partners,Hero copy,"Partner page is promising but can be tighter","Refer SnapR to agents, teams, and brokerages and earn recurring revenue from a platform built for modern real estate marketing.","Improve partner conversion and keyword alignment",Medium
/developers,Hero copy,"Developer page can better explain practical value","Use the SnapR API and webhooks to connect AI real estate photo enhancement to your existing tools and workflows.","Improve clarity for technical visitors",Medium
```
