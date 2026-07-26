# COMMANDS.md
_Custom project commands — Claude-maintained, updated immediately when a command is added, changed, or removed (not append-only, unlike BUGS_ARCHIVE.md/ARCHITECTURE_HISTORY.md)_
_Distinct from AGENTS.md's Commands section (test/build/start) — this is the long tail of one-off and category-specific scripts_
_Last updated: YYYY-MM-DD_

_No custom one-off commands exist in this project. `app/Console/Commands/Utility/Test.php` (`utility:test`) — dead scaffolding boilerplate tied to the dead `CommandLoggerTrait`/`Logger` code — was deleted 2026-07-25 during the "full testing" cleanup pass, along with the rest of that dead code (`app/Utils/ApiResponse/*`, `app/Facades/Logger.php`, `app/Utils/Logger/*`, `app/Providers/LoggerServiceProvider.php`, `app/Console/Commands/CommandAbstract.php`, `app/Models/Traits/Activable.php`, `app/functions.php`); see docs/TESTING_COVERAGE.md and docs/ARCHITECTURE_HISTORY.md's 2026-07-25 entry. Add an entry here the first time an actual one-off/category-specific script is added; standard test/build/start commands stay in AGENTS.md's Commands section, not here._

---
