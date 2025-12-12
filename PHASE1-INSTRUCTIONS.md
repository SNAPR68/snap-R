# 🛡️ CONTENT STUDIO PHASE 1 - CURSOR AGENT INSTRUCTIONS

## ⚠️ CRITICAL SAFETY RULES FOR CURSOR AGENT
```
╔════════════════════════════════════════════════════════════════════╗
║                     🚨 DO NOT MODIFY 🚨                            ║
║                                                                    ║
║  • app/dashboard/content-studio/page.tsx                          ║
║  • components/content-studio/unified-creator.tsx                   ║
║  • components/content-studio/template-renderer.tsx                 ║
║  • lib/content/templates.ts                                        ║
║  • Any existing API routes                                         ║
║  • Any existing database tables                                    ║
║                                                                    ║
║  Phase 1 is ADDITIVE ONLY.                                        ║
║  We created NEW files in NEW directories.                         ║
╚════════════════════════════════════════════════════════════════════╝
```

---

## ✅ PHASE 1 INSTALLED FILES (DO NOT MODIFY)
```
components/content-studio/phase1/
├── post-type-selector.tsx       ✅ INSTALLED
├── smart-hashtag-generator.tsx  ✅ INSTALLED
├── agent-brand-kit.tsx          ✅ INSTALLED
└── ai-caption-generator.tsx     ✅ INSTALLED

app/api/ai/generate-caption/
└── route.ts                     ✅ INSTALLED
```

---

## 🗄️ DATABASE TABLES CREATED

- `agent_brand_kits` ✅
- `content_generation_logs` ✅
- `saved_content_templates` ✅

---

## 📦 STORAGE BUCKET

- `brand-assets` ✅ Created in Supabase Storage

---

## 🚨 CURSOR AGENT PROTOCOL

When working on Content Studio Phase 1 integration:

1. **ALWAYS** create a backup before modifying any existing file
2. **NEVER** delete or overwrite existing functionality
3. **ONLY** add new imports and new UI sections
4. **VERIFY** git status shows expected changes before committing
5. **TEST** that existing features still work after changes

---

## 📋 INTEGRATION CHECKLIST (FUTURE)

When integrating Phase 1 into the UI:

- [ ] Backup unified-creator.tsx first
- [ ] Add imports from phase1/ directory
- [ ] Add PostType and Tone state variables
- [ ] Insert PostTypeSelector component
- [ ] Insert ToneSelector component
- [ ] Wire up SmartHashtagGenerator
- [ ] Test existing functionality still works
- [ ] Test new functionality works

---

## 🔄 ROLLBACK PROCEDURE

If anything breaks:
```bash
# Remove Phase 1 components (safe - they're isolated)
rm -rf components/content-studio/phase1/
rm -rf app/api/ai/generate-caption/

# Restore any modified files from git
git checkout -- <filename>
```

---

## 📅 INSTALLATION DATE

Phase 1 installed: December 12, 2025

