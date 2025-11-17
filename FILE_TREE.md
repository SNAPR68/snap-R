# snap-R Project File Tree

```
.
├── app/
│   ├── (marketing)/
│   │   └── page.tsx
│   ├── api/
│   │   ├── job-status/
│   │   │   └── route.ts
│   │   └── upload/
│   │       └── route.ts
│   ├── billing/
│   │   └── page.tsx
│   ├── dashboard/
│   │   └── page.tsx
│   ├── fonts/
│   │   ├── GeistMonoVF.woff
│   │   └── GeistVF.woff
│   ├── jobs/
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── listings/
│   │   ├── [id]/
│   │   │   └── page.tsx
│   │   └── page.tsx
│   ├── settings/
│   │   └── page.tsx
│   ├── upload/
│   │   └── page.tsx
│   ├── favicon.ico
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
│
├── backend/
│   ├── workers/
│   │   ├── billing_webhook.ts
│   │   ├── description_worker.ts
│   │   ├── floorplan_worker.ts
│   │   ├── process_worker.ts
│   │   ├── types.ts
│   │   └── upload_worker.ts
│   └── job_status_worker.ts
│
├── components/
│   ├── layout/
│   │   ├── landing-page.tsx
│   │   └── page-shell.tsx
│   ├── ui/
│   │   ├── avatar.tsx
│   │   ├── badge.tsx
│   │   ├── before-after-slider.tsx
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dashboard-action-card.tsx
│   │   ├── dialog.tsx
│   │   ├── dropdown-menu.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── navbar.tsx
│   │   ├── progress.tsx
│   │   ├── separator.tsx
│   │   ├── skeleton.tsx
│   │   ├── tabs.tsx
│   │   ├── textarea.tsx
│   │   ├── tooltip.tsx
│   │   └── upload-box.tsx
│   └── listing-card.tsx
│
├── database/
│   ├── migrations/
│   └── schema.sql
│
├── job-status-worker/
│   ├── src/
│   │   └── index.ts
│   ├── node_modules/
│   ├── worker-configuration.d.ts
│   └── wrangler.toml
│
├── lib/
│   ├── api.ts
│   ├── cloudflare.ts
│   ├── supabase.ts
│   └── utils.ts
│
├── pipelines/
│   ├── declutter.ts
│   ├── enhancement.ts
│   ├── metadata.ts
│   ├── object-remove.ts
│   ├── sky.ts
│   └── twilight.ts
│
├── upload-worker/
│   ├── src/
│   │   └── index.ts
│   ├── node_modules/
│   ├── worker-configuration.d.ts
│   └── wrangler.toml
│
├── supabase/
│
├── node_modules/
│
├── .eslintrc.json
├── components.json
├── env.template
├── next-env.d.ts
├── next.config.mjs
├── package-lock.json
├── package.json
├── postcss.config.mjs
├── PROJECT_STATUS_REPORT.md
├── README.md
├── tailwind.config.ts
└── tsconfig.json
```

