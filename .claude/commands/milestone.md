---
description: Implement one milestone from docs/SPEC.md §9 (plan → TDD → verify)
argument-hint: <milestone number> [extra instructions]
---
Implement milestone $ARGUMENTS from @docs/SPEC.md section 9. Stay strictly within this milestone.

1. Plan: list files to create/change and tests to write, mapped to AC ids. Wait for my approval.
2. Implement with TDD: failing test first for business logic, then code.
3. Verify: pnpm typecheck, pnpm lint, pnpm test must pass. Use context7 for any library API you are unsure about.
4. Finish with: what was built, any deviation from SPEC.md (update SPEC.md if justified),
   what I should check manually, and a conventional commit message. Do not commit.