# AI Workflow

This project was built AI-first with Claude Code. This document describes the harness,
the decisions behind it and an honest log of where the AI needed correction.

## Tooling
- Claude Code (CLI agent), Claude Pro plan
- Models: Sonnet for implementation, Opus for planning and hard problems

## Harness

### CLAUDE.md
Project memory loaded in every session. Deliberately short: only what the agent
can't infer from code (stack, architecture rules) and known pitfalls (Weatherstack).

### Plugins (project scope, see .claude/settings.json)
| Plugin | Why |
|---|---|
| context7 | Up-to-date library docs; avoids code written against outdated APIs. |
| typescript-lsp | Real type errors and code navigation instead of guessing. |
| frontend-design | Anthropic's skill for distinctive, non-generic UI. |
| playwright | Lets the agent open the running app and verify UI flows itself. |
| pr-review-toolkit | Independent review agents before delivery. |

Considered and rejected: superpowers. Powerful but heavy and subagent-intensive;
a lighter custom workflow fits this project size and plan limits better.

## Decision log
- **Apollo Server → GraphQL Yoga.** Initially chose Apollo Server. After review with a
  backend engineer switched to Yoga: lighter, Fetch API based, frequent Apollo major-version
  churn (v4 EOL Jan 2026), and Yoga shares a maintainer (The Guild) with GraphQL Code Generator.
  Apollo Client stays on the frontend (independent library).

## Session log
<!-- per phase: goal, key prompts, what worked, what I corrected -->

## Where the AI was wrong (and how I caught it)
<!-- concrete examples -->