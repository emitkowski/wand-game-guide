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

### 2026-07-25 (later same day — AI reply integration)
| Metric | Value | Change since last entry |
|---|---|---|
| Test count | 113 (84 backend + 29 frontend) | +12 (backend only — no frontend code changed) |
| Coverage | 57.9% backend, 21.13% stmts frontend | +6.9 pts backend (new AI reply pipeline fully covered) |
| Open bugs | 0 | — |
| Blocking bugs | 0 | — |
| Milestones complete | 1/2 (Foundation done, Domain features not started) | — |

### 2026-07-25 (later same day — persona fix + thinking indicator)
| Metric | Value | Change since last entry |
|---|---|---|
| Test count | 118 (84 backend + 34 frontend) | +5 (frontend only) |
| Coverage | 57.9% backend, 23.69% stmts frontend | +2.56 pts frontend (thinking-indicator tests) |
| Open bugs | 0 | — |
| Blocking bugs | 0 | — |
| Milestones complete | 1/2 (Foundation done, Domain features not started) | — |

### 2026-07-25 (later same day — full testing pass)
| Metric | Value | Change since last entry |
|---|---|---|
| Test count | 304 (85 backend + 219 frontend) | +186 (+1 backend, +185 frontend) |
| Coverage | 100.0% backend, 90.83% stmts frontend | +42.1 pts backend (deleted ~10 files of dead scaffolding, closed the one real gap); +67.14 pts frontend (43 new test files) — both now above the 80% threshold for the first time |
| Open bugs | 0 | — |
| Blocking bugs | 0 | — |
| Milestones complete | 1/2 (Foundation done, Domain features not started) | — |
