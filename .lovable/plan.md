# Plan: Automated Security Scan in CI

Lovable's in-platform scanner is not available as a CLI, so CI cannot call it directly. Instead, we will assemble a focused workflow that catches the same classes of issues the platform scanner has been flagging — PHI leaking into edge function logs, hardcoded secrets, and vulnerable dependencies — and runs on every commit and PR.

## What it will check

1. **PHI / sensitive data in edge function logs** — custom rules for `supabase/functions/**` that fail when patient identifiers (e.g. `chiefComplaint`, `patient_id`, `name`, `email`, `dob`) appear inside `console.log/info/warn/error` calls.
2. **Hardcoded secrets** — gitleaks scan across the repo (catches API keys, JWTs, Supabase service role keys, etc.).
3. **Dependency vulnerabilities** — `npm audit --omit=dev` at high+ severity, non-blocking warning.
4. **Edge function lint** — basic Deno check on `supabase/functions/**` to catch obvious mistakes.

The workflow runs on push to `main`/`master` and on every PR. Any failure in checks 1 or 2 fails the build; check 3 reports as warnings.

## Files to add / change

### New: `.github/workflows/security-scan.yml`
Runs four jobs in parallel:
- `phi-log-scan` — runs `scripts/security/check-phi-logs.mjs`
- `secret-scan` — runs `gitleaks/gitleaks-action@v2`
- `dep-audit` — runs `npm audit --omit=dev --audit-level=high` (continue-on-error)
- `edge-fn-check` — `deno check supabase/functions/**/index.ts`

### New: `scripts/security/check-phi-logs.mjs`
Node script that:
- Walks `supabase/functions/**/*.ts`
- Parses each `console.(log|info|warn|error|debug)(...)` call
- Fails (exit 1) if the argument list references any PHI identifier from a configurable allowlist (`chiefComplaint`, `patient`, `email`, `name`, `dob`, `phone`, `address`, `mrn`, `ssn`)
- Prints file:line for each violation

### New: `scripts/security/phi-keywords.json`
List of PHI keywords, easy to extend without touching the scanner.

### New: `.gitleaks.toml`
Minimal config extending the default ruleset, with an allowlist for `VITE_SUPABASE_PUBLISHABLE_KEY` (anon key is safe to commit) so it doesn't false-positive.

## Technical details

```text
.github/workflows/security-scan.yml
├── job: phi-log-scan       (node 20, runs script, fails on match)
├── job: secret-scan        (gitleaks-action, fails on leak)
├── job: dep-audit          (npm audit, warning only)
└── job: edge-fn-check      (deno check, fails on type errors)
```

PHI scanner heuristic (pseudocode):
```text
for file in supabase/functions/**/*.ts:
  for each console.* call:
    if any phi_keyword in call.argText (case-insensitive):
      report file:line
exit 1 if any reports
```

The Lovable in-platform scanner continues to run inside the editor and remains the authoritative check; this CI workflow is a lightweight backstop so regressions like the recent `chiefComplaint` log leak get caught before merge.

## Out of scope

- Running Lovable's hosted scanner from CI (not exposed as CLI).
- RLS policy validation — this lives in Supabase migrations and is reviewed by the platform scanner; adding it to CI would require a live database connection.

After approval I'll create the workflow, the scanner script, the keyword list, and the gitleaks config.
