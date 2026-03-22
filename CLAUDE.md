# CLAUDE.md

This file is read by Claude Code at the start of every session. Global version: ~/.claude/CLAUDE.md — applies across all projects. Project version: ./CLAUDE.md — overrides or extends the global.

## How We Work

We follow a structured sprint process. Every feature goes through these stages in order:

**Think → Plan → Build → Review → Test → Ship → Document**

Don't skip stages. Don't start building before the plan is solid. Don't ship without tests. This is how you go fast without going reckless.

### Sprint Stages

| Stage    | What happens |
|----------|-------------|
| Think    | Reframe the problem. Challenge premises. What are we actually building? |
| Plan     | Architecture, data flow, edge cases, error paths, test matrix. Write it down. |
| Build    | Implement against the plan. Atomic commits. One thing at a time. |
| Review   | Find the bugs that will hit production. Auto-fix the obvious. Flag the rest. |
| Test     | Real browser clicks, real data, regression tests for every bug found. |
| Ship     | Sync main, run tests, verify coverage, open PR. Never force-push. |
| Document | Update README, ARCHITECTURE, CHANGELOG. Don't let docs drift. |

## Architecture Rules

- All new features go under existing navigation structure — don't add top-level sections without explicit approval.
- Prefer composition over inheritance — small, single-responsibility modules.
- Colocate related code — tests live next to the code they test, not in a separate /tests tree.
- No circular dependencies — if you're tempted, the abstraction is wrong.
- Feature flags for anything risky — never hard-launch to all users without an off switch.
- Fail loudly in dev, fail gracefully in prod — use strict error handling in development, user-friendly fallbacks in production.
- Before making architectural changes, write down: (1) what you're changing, (2) why, (3) what breaks. Show me before touching it.

## Code Quality Rules

### TypeScript

- Strict mode always — `"strict": true` in tsconfig.json. No exceptions.
- No `any` — if you're reaching for `any`, the type is `unknown` or you need a proper interface.
- Explicit return types on all exported functions — type inference is fine internally, but exports need explicit types.
- Run `npx tsc --noEmit` before every commit — zero type errors, zero warnings.
- Prefer `type` over `interface` for unions and intersections; use `interface` for objects that will be extended.

### General

- No commented-out code in commits — if it's dead, delete it. Git has history.
- No `console.log` in production code — use a proper logger with log levels.
- No hardcoded secrets or API keys — use environment variables. Check `.env.example` is always up to date.
- Functions do one thing — if you need an "and" in the function name, split it.
- Error messages must be actionable — "Something went wrong" is not an error message.
- Magic numbers get named constants — `const MAX_RETRY_ATTEMPTS = 3`, not `if (attempts > 3)`.
- Prefer `const` over `let`, never `var`.

### Naming

- Files: `kebab-case.ts`
- Components: `PascalCase.tsx`
- Functions/variables: `camelCase`
- Constants: `SCREAMING_SNAKE_CASE`
- Types/Interfaces: `PascalCase`
- Boolean variables: prefix with `is`, `has`, `can`, `should` — e.g. `isLoading`, `hasError`.

## Style Rules

- Tailwind for styling — no inline styles except for truly dynamic values (e.g. calculated pixel positions).
- No magic CSS — if you're writing more than 2 lines of raw CSS, there's probably a Tailwind class or component.
- Design tokens first — use the design system's spacing, color, and typography scales. Don't invent new values.
- Mobile-first responsive design — start from the smallest breakpoint, expand up.
- Accessibility is not optional — every interactive element needs a keyboard handler and appropriate ARIA where needed.

## Testing Rules

Tests are not optional. Tests make vibe coding safe instead of yolo coding.

- Write tests before marking any task complete.
- Every bug fixed gets a regression test — if a bug bit us once, make sure it can never bite us again.
- Unit tests for pure functions — if it has no side effects, it's trivial to test.
- Integration tests for API routes and database operations.
- E2E tests for critical user flows — login, checkout, key actions. Use Playwright.
- Test file naming: `*.test.ts` for unit/integration, `*.e2e.ts` for end-to-end.
- Coverage target: 80% minimum, 90%+ for business logic. Run coverage report on every ship.
- No skipped tests in main — `it.skip` and `test.todo` are development tools, not a shipping strategy.

```bash
# Run before every commit
npx tsc --noEmit    # type check
npm test            # run full test suite
npm run lint        # lint check
```

## Git Rules

- Never push to main directly — always work in a feature branch.
- Branch naming: `feat/description`, `fix/description`, `chore/description`, `docs/description`.
- Atomic commits — one logical change per commit. If you're writing "and" in the commit message, it's two commits.
- Commit message format:

```
type(scope): short description

- What changed
- Why it changed
- Any breaking changes or side effects

Fixes #123
```

Types: `feat`, `fix`, `chore`, `docs`, `test`, `refactor`, `perf`.

- PRs must pass CI before merge — no merging red builds.
- PRs should be small — under 400 lines changed is the goal. If it's bigger, break it down.
- No force-pushing to shared branches — only force-push to your own feature branches, and only when you're sure no one else is on them.

## Safety Rules

Before executing any of these, stop and confirm with me:

- `rm -rf` or any recursive delete
- `DROP TABLE` or any destructive database migration
- `git reset --hard`
- Force-pushing to any branch
- Modifying `.env` files
- Changing authentication or authorization logic
- Deploying to production

If you're about to do something that can't be undone, tell me first. Show me the exact command. Wait for explicit confirmation.

## Environment & Dependencies

- Lock file always committed — `package-lock.json` or `bun.lockb` goes in git.
- Audit dependencies before adding — `npm audit` or check for known vulnerabilities. Don't add dependencies that haven't been updated in 2+ years.
- Prefer fewer, well-maintained dependencies — every dependency is a liability.
- Version pin production dependencies — use exact versions (`"lodash": "4.17.21"`) not ranges in production `package.json`.
- Environment variables documented in `.env.example` — every variable that's needed, with a comment explaining what it does and where to get the value.

## Code Review Checklist

Before flagging a PR as ready, verify:

- [ ] `npx tsc --noEmit` passes with zero errors
- [ ] All tests pass (`npm test`)
- [ ] Linting passes (`npm run lint`)
- [ ] New code has test coverage
- [ ] Every bug fix has a regression test
- [ ] No `console.log` left in
- [ ] No commented-out code
- [ ] No hardcoded secrets
- [ ] `.env.example` updated if new env vars added
- [ ] CHANGELOG updated
- [ ] README updated if user-facing behaviour changed

## Documentation Rules

- **CHANGELOG.md** — update on every ship. Format: date, version, what changed, what broke.
- **README.md** — must reflect the current state of the project. Run a diff against the codebase after every significant feature.
- **ARCHITECTURE.md** — document every non-obvious decision with a "why". Future you will thank present you.
- Inline comments for the "why", not the "what" — the code shows what; comments explain why this approach was chosen over the alternatives.
- JSDoc for all exported public APIs — parameters, return types, example usage.

## When You're Stuck

Debugging protocol — don't just try random fixes:

1. Reproduce the issue consistently before touching anything.
2. Form a hypothesis about root cause.
3. Test the hypothesis with the minimal change possible.
4. If wrong, form a new hypothesis. Don't stack guesses.
5. After 3 failed hypotheses, stop and describe the problem to me clearly.
6. Once root cause is confirmed, fix it. Then write a test that would have caught it.

**The Iron Law: No fixes without investigation.**

## Shipping Checklist

Before opening a PR to merge to main:

1. `git pull origin main` — sync latest
2. Run the full test suite — zero failures
3. Check test coverage — no regression from baseline
4. `npx tsc --noEmit` — zero type errors
5. `npm run lint` — clean
6. Review your own diff — read every line you changed
7. Update CHANGELOG
8. Open PR with: what changed, why, how to test it, any risks

## Project-Specific Overrides

(Add project-specific rules below this line in your project's CLAUDE.md)

```
## Project: [Name]
Stack: [e.g. Next.js 15, TypeScript, Tailwind, Prisma, PostgreSQL]
Deploy: [e.g. Vercel + Railway]
Branch strategy: [e.g. main → production, dev → staging]

### Build rules
- [e.g. Always run `npm run build` before committing — catches SSR issues tsc misses]

### Style rules
- [e.g. Use brand color tokens from /tokens/colors.ts, never raw hex]

### Architecture rules
- [e.g. All DB queries go through /lib/db — never query Prisma directly in components]
```

Last updated: March 2026
