# SnapR Architecture Gate

These rules must NEVER be violated without explicit changelog entry:

1. Billing must occur in API layer, not Worker.
2. Worker must not control subscription limits.
3. Queue-based processing is mandatory.
4. No hybrid HTTP-processing logic.
5. No environment secrets hardcoded.
6. No silent schema changes.

Violation requires:
- Explicit changelog entry
- Risk level High
- Blueprint deviation explanation
