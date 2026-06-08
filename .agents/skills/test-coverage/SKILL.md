---
name: test-coverage
description: >
  Run the FinSight test suite with coverage reporting and summarize the results.
  Triggers when asked to "run tests with coverage", "check test coverage", "show coverage report",
  or "how many tests pass". Can be scoped to api, web, or types.
---

Run the FinSight test suite with coverage and summarize the results.

## Scope

| Argument | Command |
|----------|---------|
| (none) | `npm run test:coverage` (all packages) |
| `api` | `npx turbo test:coverage --filter=@finsight/api` |
| `web` | `npx turbo test:coverage --filter=@finsight/web` |
| `types` or `shared-types` | `npx turbo test:coverage --filter=@finsight/shared-types` |

Note: API tests use mongodb-memory-server with a 30-second startup. Do not reduce the timeout.

## Steps

1. Run the appropriate coverage command
2. Parse the output and report:

```
Package               Tests    Pass    Fail    Stmts    Branch    Funcs    Lines
@finsight/api       138      138      0       XX%      XX%       XX%      XX%
@finsight/web        41       41      0       XX%      XX%       XX%      XX%
@finsight/shared-types 151   151     0       XX%      XX%       XX%      XX%
─────────────────────────────────────────────────────────────────────────────
Total                 330      330      0
```

3. Flag any file with **< 80% branch coverage** as needing attention.
4. If tests fail, show the full error for each failing test (file path, test name, error message).
5. Do NOT attempt to fix failing tests unless explicitly asked.

## Baseline

The expected passing count is **330 tests** (138 + 41 + 151). If the total differs, note it.
