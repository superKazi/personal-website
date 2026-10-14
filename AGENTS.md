## Conventions

- When running fallow only run it via npx. Never install globally.
- Baseline newly available features are okay for progressive enhancements.
- Before checking the page in the Chrome DevTools MCP, or when the user hears or sees a problem your checks miss, read `docs/agents/browser-checks.md`.

## Branch workflow

- All dev work happens on `new-experience`.
- When a slice is complete, open a PR from `new-experience` into `develop` for user review.
- When everything is done, the user will merge `develop` into `main` to ship it to production, then delete `new-experience`.

## Agent skills

### Issue tracker

GitHub Issues in `superKazi/personal-website`, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Default labels: `needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`. See `docs/agents/triage-labels.md`.

### Domain docs

Single-context: one `GLOSSARY.md` and `docs/adr/` at the repo root. See `docs/agents/domain.md`.
