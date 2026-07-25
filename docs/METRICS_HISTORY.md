# METRICS_HISTORY.md
_Append-only project metrics log — one entry per session end, never edit or delete past entries_
_Current snapshot: docs/STATUS.md | Claude-maintained — append immediately at session end_
_For leadership: read the most recent entry for current numbers, skim the whole file for trend_

## Entry format
### YYYY-MM-DD
| Metric | Value | Change since last entry |
|---|---|---|
| Test count | [N] | [+/-N] |
| Coverage | [N]% | [+/-N pts] |
| Open bugs | [N] | [+/-N] |
| Blocking bugs | [N] | [+/-N] |
| Milestones complete | [N]/[M] | — |

---

### 2026-07-25
| Metric | Value | Change since last entry |
|---|---|---|
| Test count | 97 (68 backend + 29 frontend) | — (first entry) |
| Coverage | 51.0% backend, 21.13% stmts frontend | — (first entry) |
| Open bugs | 2 (BUG-1, BUG-2) | — (first entry; BUG-3 found and fixed same session) |
| Blocking bugs | 0 | — (first entry) |
| Milestones complete | 1/2 (Foundation done, Domain features not started) | — (first entry) |

### 2026-07-25 (later same day — continued session)
| Metric | Value | Change since last entry |
|---|---|---|
| Test count | 101 (72 backend + 29 frontend) | +4 |
| Coverage | 51.0% backend, 21.13% stmts frontend | — (routes/ and CI config aren't in coverage scope) |
| Open bugs | 0 | -2 (BUG-1, BUG-2 both fixed and tested) |
| Blocking bugs | 0 | — |
| Milestones complete | 1/2 (Foundation done, Domain features not started) | — |
