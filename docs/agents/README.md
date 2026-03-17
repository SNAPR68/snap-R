# SnapR Autonomous Agent System

Complete documentation for running SnapR as an AI-operated company.

## Documents

| # | Document | Purpose |
|---|----------|---------|
| [00](00-OVERVIEW.md) | **Overview** | Vision, 7 agents summary, success criteria |
| [01](01-SYSTEM-ARCHITECTURE.md) | **System Architecture** | High-level architecture, data flows, file structure |
| [02](02-API-SPECIFICATION.md) | **API Specification** | All internal + external API endpoints |
| [03](03-ACCOUNTS-AND-SETUP.md) | **Accounts & Setup** | New accounts to create, env vars, monthly costs |
| [04](04-AGENT-SPECIFICATIONS.md) | **Agent Specifications** | Detailed spec for each of the 7 agents |
| [05](05-USER-FLOWS.md) | **User Flows** | How agents interact with users end-to-end |
| [06](06-DATABASE-SCHEMA.md) | **Database Schema** | All new tables with column definitions |
| [07](07-IMPLEMENTATION-ROADMAP.md) | **Implementation Roadmap** | 8-phase build plan with task breakdown |
| [08](08-SECURITY-AND-COMPLIANCE.md) | **Security & Compliance** | CAN-SPAM, data privacy, access control, monitoring |
| [09](09-TESTING-AND-VALIDATION.md) | **Testing & Validation** | Unit tests, validation checklists, dry run protocol |

## Quick Reference

**Branch:** `feature/autonomous-agents`
**Database migration:** `supabase/migrations/20260317_autonomous_agents.sql`
**Agent code:** `lib/agents/`
**Agent APIs:** `app/api/agents/` + `app/api/cron/agents/`
**Agent dashboard:** `app/dashboard/agents/`
**Monthly cost (Phase 1):** ~$210-255
**Build estimate:** ~85-95 hours across 4-5 weeks
**Human time after launch:** < 15 min/day
