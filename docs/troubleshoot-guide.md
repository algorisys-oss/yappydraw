# Troubleshooting & Investigation Guide

> How to think like an AI when exploring, debugging, and optimizing a codebase.
> Every command here was used during real sessions on this project, plus additional
> techniques from deep systems knowledge.

---

## Table of Contents

1. [Shell Syntax Primer](#1-shell-syntax-primer)
2. [Codebase Exploration](#2-codebase-exploration)
3. [Code Search & Pattern Matching](#3-code-search--pattern-matching)
4. [Git Investigation](#4-git-investigation)
5. [TypeScript & Build Verification](#5-typescript--build-verification)
6. [Testing](#6-testing)
7. [Dev Server & HTTP Probing](#7-dev-server--http-probing)
8. [Performance & Metrics](#8-performance--metrics)
9. [File Operations & Bulk Analysis](#9-file-operations--bulk-analysis)
10. [JSON & Data Inspection](#10-json--data-inspection)
11. [Process Management](#11-process-management)
12. [npm & Dependency Management](#12-npm--dependency-management)
13. [Environment Debugging](#13-environment-debugging)
14. [Browser DevTools from the CLI](#14-browser-devtools-from-the-cli)
15. [Canvas & Rendering Debugging](#15-canvas--rendering-debugging)
16. [Regex Patterns for Code Analysis](#16-regex-patterns-for-code-analysis)
17. [Reactive Store & Data Flow Debugging](#17-reactive-store--data-flow-debugging)
18. [Investigation Patterns (Thinking Framework)](#18-investigation-patterns)
19. [Quick Reference Cheat Sheet](#19-quick-reference-cheat-sheet)

---

## 1. Shell Syntax Primer

Before diving into commands, understand the building blocks. Every complex command is just simple pieces connected with these operators.

### Redirection: `>`, `>>`, `<`

```bash
# >  Redirect stdout to a file (overwrites)
npm run build > build.log

# >> Redirect stdout to a file (appends)
echo "another line" >> build.log

# <  Feed a file into a command's stdin
wc -l < src/utils/canvas-renderer.ts
```

**How it works**: Every process has three I/O channels:
- **stdin** (0) = input (keyboard by default)
- **stdout** (1) = normal output (terminal by default)
- **stderr** (2) = error output (terminal by default)

`>` redirects channel 1 (stdout) to a file. `<` feeds a file into channel 0 (stdin).

### Stderr redirection: `2>`, `2>&1`

```bash
# 2>          Redirect stderr only to a file
npm run build 2> errors.log

# 2>&1        Redirect stderr INTO stdout (merge them)
npm run build 2>&1

# > file 2>&1 Redirect BOTH stdout and stderr to a file
npm run build > build.log 2>&1

# &>          Shorthand for the above (bash 4+)
npm run build &> build.log
```

**Why `2>&1` matters**: Many commands print results to stdout and errors to stderr. When you pipe (`|`) or redirect (`>`), only stdout is captured by default. Errors silently go to the terminal. `2>&1` merges them so you capture everything.

**Reading the syntax**: `2>&1` means "redirect file descriptor 2 (stderr) to wherever file descriptor 1 (stdout) currently points." The `&` before `1` means "file descriptor 1", not "the file literally named 1".

```bash
# Common real use: capture all output (success + errors) in a pipe
npx tsc --noEmit 2>&1 | grep "error"
#                ^^^^   without this, errors bypass the grep

# Common real use: suppress all output
npm run build > /dev/null 2>&1
#                         ^^^^  errors also go to /dev/null
```

### Pipe: `|`

```bash
# Send stdout of one command into stdin of the next
find src -name '*.ts' | wc -l
#                      ^ output of find becomes input of wc
```

**How it works**: Creates a byte stream between two processes. The left side writes, the right side reads. They run simultaneously (not sequentially).

```bash
# Chain multiple pipes
grep -rn "render" src/ | sort | uniq -c | sort -rn | head -10
#   find matches      -> sort -> deduplicate+count -> sort by count -> top 10
```

### Command chaining: `&&`, `||`, `;`

```bash
# && Run next command ONLY if the previous succeeded (exit code 0)
npm run build && echo "Build passed!"
#                      ^ only runs if build exits with 0

# || Run next command ONLY if the previous failed (exit code non-0)
npm run build || echo "Build FAILED!"
#                      ^ only runs if build exits with non-0

# ;  Run next command regardless of success or failure
npm run build ; echo "Done (whether it worked or not)"
```

**Exit codes**: Every command returns a number (0 = success, anything else = failure). `$?` holds the last exit code:
```bash
npm run build
echo $?       # 0 if build succeeded, non-0 if it failed
```

**Combining them**:
```bash
# Classic "do A, then B, then C, bail on first failure"
git add . && git commit -m "msg" && git push

# "Try A, if it fails do B"
cat config.local.json 2>/dev/null || cat config.default.json
```

### Background execution: `&`

```bash
# Run a command in the background
npm run dev &

# $! = PID of the last background process
npm run dev &
echo $!         # e.g., 12345
```

**What happens**: The shell immediately returns the prompt. The process runs in parallel. Output still goes to the terminal (can be noisy). Combine with redirection to silence it:
```bash
npm run dev > /tmp/dev.log 2>&1 &
```

### Command substitution: `$()` and backticks

```bash
# $() runs a command and substitutes its output inline
kill $(lsof -t -i:5173)
#    ^^^^^^^^^^^^^^^^^^^  this runs first, returns a PID like "12345"
#    then the outer command becomes: kill 12345

# Backticks do the same thing (older syntax, harder to nest)
kill `lsof -t -i:5173`
```

**Nesting** (only works cleanly with `$()`):
```bash
echo "Lines: $(wc -l < $(find src -name 'canvas-renderer.ts'))"
#                       ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ inner: finds file path
#            ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^ outer: counts its lines
```

### Quoting: single `'`, double `"`, none

```bash
# No quotes: words split on spaces, globs expand
echo *.ts               # expands to matching filenames

# Double quotes: variables expand, globs don't
echo "$HOME/*.ts"       # prints /home/user/*.ts (literal asterisk)

# Single quotes: NOTHING expands, everything is literal
echo '$HOME/*.ts'       # prints $HOME/*.ts (literal dollar sign)
```

**Rule of thumb**: Use double quotes around variables (`"$var"`), single quotes for fixed strings, no quotes when you want glob expansion.

### `/dev/null` — the black hole

```bash
# Discard stdout
command > /dev/null

# Discard everything
command > /dev/null 2>&1

# Check if a command succeeds without caring about output
if grep -q "pattern" file.txt; then echo "found"; fi
#       ^^ -q is another way: quiet mode, no output, just exit code
```

**What it is**: A special file that discards everything written to it and returns EOF when read. Useful for "I only care about the exit code, not the output."

### Subshell: `()`

```bash
# Run commands in a subshell (doesn't affect parent shell's state)
(cd /tmp && npm init -y)
# After this, you're still in your original directory

# vs. without subshell:
cd /tmp && npm init -y
# Now you're stuck in /tmp
```

### Here document: `<<EOF`

```bash
# Feed multi-line text into a command
git commit -m "$(cat <<'EOF'
feat: add new rendering pipeline

Multi-line commit message here.

Co-Authored-By: Claude <noreply@anthropic.com>
EOF
)"
```

**Why `<<'EOF'` with quotes**: Single-quoting the delimiter (`'EOF'`) prevents variable expansion inside the block. Without quotes, `$variables` would be expanded.

### Glob patterns

```bash
*          # Match any characters (file.ts, file.tsx, etc.)
?          # Match exactly one character (file?.ts matches file1.ts)
**         # Match directories recursively (src/**/*.ts)
{a,b}      # Match either a or b (*.{ts,tsx})
[abc]      # Match one of a, b, or c
[!abc]     # Match any character EXCEPT a, b, or c
```

```bash
# Examples in practice
ls src/**/*.ts           # All .ts files recursively
ls src/*.{ts,tsx}        # .ts and .tsx in src/ (not recursive)
ls src/shapes/[a-m]*.ts  # Shape files starting with a-m
```

### xargs — convert stdin to arguments

```bash
# Without xargs: find outputs filenames, one per line
find src -name '*.ts'
# output:
# src/api.ts
# src/types.ts
# ...

# With xargs: those filenames become arguments to wc
find src -name '*.ts' | xargs wc -l
# equivalent to: wc -l src/api.ts src/types.ts ...
```

**Why not just pipe?** Most commands (wc, grep, rm) expect filenames as *arguments*, not stdin. `xargs` bridges the gap.

```bash
# Handle filenames with spaces safely
find src -name '*.ts' -print0 | xargs -0 wc -l
#                     ^^^^^^^          ^^
#                     null-separated   reads null-separated
```

### tee — write to file AND stdout

```bash
npm run build 2>&1 | tee build.log
#                    ^^^ writes to build.log AND shows on terminal
```

**Purpose**: When you want to see output in real time AND save it for later.

---

## 2. Codebase Exploration

### Count lines of code in the project
```bash
find src -name '*.ts' -o -name '*.tsx' | xargs wc -l | tail -1
```
**Purpose**: Quick project scale check. Useful for man-day estimation and tracking growth.

**Breakdown**: `find` locates files, `|` pipes the list to `xargs`, which passes them as arguments to `wc -l` (line count). `tail -1` grabs only the total line.

### List all files matching a pattern
```bash
find src -name '*.test.ts' -o -name '*.spec.ts'
```
**Purpose**: Discover all test files, config files, or files of a specific type. `-o` = OR.

### List directory structure (tree-like)
```bash
ls -la src/shapes/
ls -la src/utils/
```
**Purpose**: Understand module organization without reading every file. `-l` = long format, `-a` = show hidden files.

### Deep tree view (if `tree` is installed)
```bash
tree src/ -I 'node_modules' --dirsfirst -L 2
```
**Purpose**: Visual directory tree. `-I` excludes patterns, `-L 2` limits depth to 2 levels, `--dirsfirst` puts directories before files.

### Find all TypeScript files in a directory, sorted by size
```bash
find src -name '*.ts' -exec wc -l {} + | sort -n
```
**Purpose**: Identify the largest files (often where complexity lives). `-exec wc -l {} +` runs wc on all found files in batches. `sort -n` sorts numerically (smallest first).

### Find empty files (potential stubs or mistakes)
```bash
find src -name '*.ts' -empty
```
**Purpose**: Catch files that were created but never written to.

### Check what a folder contains before creating files in it
```bash
ls /path/to/target/directory
```
**Purpose**: Always verify a directory exists before writing into it. Prevents accidental file creation in wrong locations.

---

## 3. Code Search & Pattern Matching

### Search for a function/class definition
```bash
grep -rn "function renderElement" src/
grep -rn "class RenderPipeline" src/
```
**Purpose**: Find where something is defined. `-r` = recursive (search all files in directory), `-n` = show line numbers.

### Search for all usages of an import/function
```bash
grep -rn "import.*from.*rough-cache" src/
grep -rn "beginElement\|endElement" src/
```
**Purpose**: Trace all call sites. Essential before refactoring to understand impact radius. `\|` = OR in basic regex.

### Search with context (lines before/after the match)
```bash
grep -rn -A 5 -B 2 "renderElement(rc" src/
```
**Purpose**: See the surrounding code. `-A 5` = 5 lines after, `-B 2` = 2 lines before. Critical for understanding how a function is called.

### Search only in specific file types
```bash
grep -rn --include="*.ts" --include="*.tsx" "RoughCanvas" src/
```
**Purpose**: Exclude noise from `.json`, `.css`, `.md` files. `--include` restricts the file glob.

### Exclude directories from search
```bash
grep -rn --exclude-dir="node_modules" --exclude-dir=".git" "pattern" .
```
**Purpose**: `--exclude-dir` prevents searching in heavy directories. Critical in project root searches.

### Search for a pattern in node_modules (library API investigation)
```bash
grep -rn "draw(" node_modules/roughjs/bin/
cat node_modules/roughjs/bin/canvas.d.ts
```
**Purpose**: Understand the exact API surface of a dependency. Type definitions (`.d.ts`) are the fastest way to learn a library's interface.

### Find files that DON'T contain a pattern
```bash
grep -rL "import.*React" src/components/
```
**Purpose**: `-L` (capital L) lists files that DON'T match. Useful for finding files missing a required import. (Lowercase `-l` lists files that DO match.)

### Count occurrences of a pattern
```bash
grep -rc "rc\." src/shapes/ | grep -v ":0$"
```
**Purpose**: Quantify usage. `-c` = print count per file. `grep -v ":0$"` filters out files with zero matches (`:0` at end of line).

### Multi-pattern search (OR logic)
```bash
grep -rn -E "(beginElement|endElement|computeElementHash)" src/
```
**Purpose**: `-E` enables extended regex (no need to escape `|` and `()`). Search for multiple related symbols at once.

### Search for exact word (avoid partial matches)
```bash
grep -rn -w "draw" src/utils/
```
**Purpose**: `-w` matches whole words only. Prevents "drawable" from matching when searching for "draw".

### Case-insensitive search
```bash
grep -rni "canvas" src/
```
**Purpose**: `-i` = case insensitive. Finds "Canvas", "canvas", "CANVAS", etc.

### ripgrep (rg) — faster grep alternative
```bash
# If installed, rg is 5-10x faster than grep on large codebases
rg "renderElement" src/ --type ts
rg "renderElement" src/ -t ts -C 3    # with 3 lines context
rg "TODO|FIXME|HACK" src/             # find all code debt markers
```
**Purpose**: `rg` respects `.gitignore` by default, uses parallel I/O, and is significantly faster. `--type ts` limits to TypeScript files.

---

## 4. Git Investigation

### See what changed (before committing)
```bash
git status          # Overview of all changes
git diff            # Exact line-by-line changes (unstaged)
git diff --staged   # Changes already staged for commit
```
**Purpose**: Always review before committing. Catches accidental changes.

### Recent commit history (understand project conventions)
```bash
git log --oneline -10
```
**Purpose**: See recent commit messages to follow the project's commit style (feat:, fix:, perf:, etc.). `--oneline` = condensed, `-10` = last 10.

### See what a specific commit changed
```bash
git show cf33355 --stat       # Files changed (summary)
git show cf33355              # Full diff
git show cf33355:src/file.ts  # Show file as it was at that commit
```
**Purpose**: Understand the scope of a past change. `--stat` shows insertions/deletions per file.

### Compare branches
```bash
git diff main...HEAD           # All changes since branching from main
git log main...HEAD --oneline  # All commits since branching
```
**Purpose**: Understand the full scope before creating a PR. The `...` (three dots) means "changes since the common ancestor."

### Check if branch is up to date with remote
```bash
git status -sb
```
**Purpose**: `-s` = short format, `-b` = show branch tracking info. Output like `## dev...origin/dev [ahead 3]` tells you you have 3 unpushed commits.

### Find which commit introduced a string
```bash
git log -S "createCachedRc" --oneline
```
**Purpose**: `-S` (pickaxe) searches for commits that added or removed a string. Great for "when was this added?" Different from grep: it searches across the *diff* of each commit, not the file content.

### Find which commit last touched a file
```bash
git log --oneline -5 -- src/utils/canvas-renderer.ts
```
**Purpose**: `--` separates git options from file paths. Shows the last 5 commits that modified this file.

### Who wrote this line? (blame)
```bash
git blame src/utils/canvas-renderer.ts -L 610,620
```
**Purpose**: Shows commit hash, author, and date for each line. `-L 610,620` limits to lines 610-620. Use when you need to understand *why* a specific line was written.

### Find a commit by message content
```bash
git log --grep="perf:" --oneline
```
**Purpose**: Search commit messages. Useful for finding all performance-related commits.

### See all branches and their latest commits
```bash
git branch -av
```
**Purpose**: `-a` = all branches (local + remote), `-v` = verbose (shows latest commit).

### Stash uncommitted changes temporarily
```bash
git stash                    # Save changes
git stash list               # See all stashes
git stash pop                # Restore most recent stash
git stash show -p stash@{0}  # Preview what's in a stash
```
**Purpose**: Temporarily shelve changes to switch branches or test something clean.

---

## 5. TypeScript & Build Verification

### Type-check without emitting (fast validation)
```bash
npx tsc --noEmit
```
**Purpose**: Verify all types are correct without producing output files. Run after every significant change. Zero output = success. Non-zero exit code = errors found.

### Type-check and capture errors
```bash
npx tsc --noEmit 2>&1 | head -30
```
**Purpose**: `2>&1` merges stderr into stdout so the pipe captures everything. `head -30` limits output to first 30 lines (useful when there are hundreds of errors — fix the first ones first).

### Type-check a single file's dependencies
```bash
npx tsc --noEmit --listFiles 2>&1 | grep "rough-cache"
```
**Purpose**: `--listFiles` prints every file the compiler processes. Piping through grep verifies a new file is being picked up.

### Check for circular dependencies
```bash
npx madge --circular src/
```
**Purpose**: Circular imports cause subtle bugs (undefined at import time) and make refactoring dangerous.

### Visualize the dependency graph
```bash
npx madge src/utils/canvas-renderer.ts --image graph.png
```
**Purpose**: Generate a visual dependency graph starting from a file. Helps understand the architecture.

### Build the project (full validation)
```bash
npm run build 2>&1
```
**Purpose**: Catches issues that `tsc --noEmit` misses (bundler errors, asset issues, env vars). `2>&1` merges error output so you see everything.

### Check bundle size after build
```bash
du -sh dist/
ls -lhS dist/assets/*.js    # -S sorts by size (largest first)
```
**Purpose**: Track bundle size to prevent bloat. `-sh` = summary + human readable. `-lhS` = long listing, human readable, sorted by size.

---

## 6. Testing

### List all tests without running them
```bash
npx playwright test tests/api.spec.ts --list
```
**Purpose**: Preview what will run. Useful for understanding test coverage without waiting for execution.

### Run a specific test file
```bash
npx playwright test tests/api.spec.ts
```
**Purpose**: Targeted test execution. Faster feedback than running the full suite.

### Run tests matching a name pattern
```bash
npx playwright test -g "should handle connector"
```
**Purpose**: `-g` filters by test name (grep pattern). Run only the test relevant to your change.

### Run all tests
```bash
npx playwright test
```
**Purpose**: Full regression check before committing.

### Run tests with verbose output
```bash
npx playwright test tests/api.spec.ts --reporter=list
```
**Purpose**: See each test name and status as it runs (instead of just dots).

### Run tests in headed mode (see the browser)
```bash
npx playwright test tests/api.spec.ts --headed
```
**Purpose**: Watch the browser as tests run. Invaluable for debugging visual issues.

### Debug a single test with step-through
```bash
npx playwright test tests/api.spec.ts -g "basic shapes" --debug
```
**Purpose**: Opens Playwright Inspector. Step through each action, see selectors, inspect the page.

### Show test report after run
```bash
npx playwright show-report
```
**Purpose**: Opens an HTML report with screenshots, traces, and timing for each test.

---

## 7. Dev Server & HTTP Probing

### Start the dev server in background
```bash
npm run dev &
```
**Purpose**: `&` runs the server in the background so the terminal stays free. Needed for e2e tests.

### Check if the dev server is responding
```bash
curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
```
**Purpose**: Returns just the HTTP status code (200 = OK).
- `-s` = silent (no progress bar)
- `-o /dev/null` = discard the response body (send to black hole)
- `-w "%{http_code}"` = write out only the HTTP status code

### Wait for server to be ready before proceeding
```bash
sleep 5 && curl -s -o /dev/null -w "%{http_code}" http://localhost:5173
```
**Purpose**: `sleep 5` waits 5 seconds, `&&` then runs curl only if sleep succeeded (it always does). Use before running e2e tests.

### Retry until server is ready (robust version)
```bash
until curl -s -o /dev/null http://localhost:5173; do sleep 1; done
echo "Server is up"
```
**Purpose**: `until` loops until the command succeeds. Better than a fixed `sleep` because it adapts to actual server startup time.

### Check what's running on a port
```bash
lsof -i :5173
# or
ss -tlnp | grep 5173
```
**Purpose**: Debug "port already in use" errors.
- `lsof -i :5173` = list open files on port 5173
- `ss -tlnp` = socket statistics: `-t` TCP, `-l` listening, `-n` numeric, `-p` show process

### Fetch and inspect response headers
```bash
curl -sI http://localhost:5173
```
**Purpose**: `-I` = HEAD request (headers only). Check content-type, caching headers, CORS headers, etc.

### Fetch and inspect a page
```bash
curl -s http://localhost:5173 | head -50
```
**Purpose**: Quick check that the HTML is being served correctly. `head -50` limits to first 50 lines.

### Test with specific headers (e.g., CORS)
```bash
curl -s -H "Origin: http://example.com" -v http://localhost:5173 2>&1 | grep -i "access-control"
```
**Purpose**: `-H` adds a header, `-v` verbose output includes response headers. `2>&1` captures verbose output (which goes to stderr) for grepping.

---

## 8. Performance & Metrics

### Count elements in a JSON data file
```bash
python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('elements',[])))" < data/large-sketch.json
```
**Purpose**: Quick element count without loading the whole file into an editor. `<` feeds the file into stdin.

### Measure file size
```bash
ls -lh data/large-sketch.json
wc -c data/large-sketch.json
```
**Purpose**: `-lh` = long format, human-readable sizes (KB/MB). `wc -c` = exact byte count.

### Count function calls in a hot path (estimate render cost)
```bash
grep -rc "rc\.\(rectangle\|ellipse\|circle\|polygon\|path\|line\|arc\)" src/shapes/ | grep -v ":0$"
```
**Purpose**: Quantify how many RoughJS draw calls exist across all shape renderers. Multiply by element count and FPS to estimate calls/sec. `\(\)` groups in basic regex.

### Profile-oriented: find all render-related functions
```bash
grep -rn "render\w*(" src/shapes/ --include="*.ts" | head -30
```
**Purpose**: Map out the render call graph before optimizing. `\w*` matches word characters (function name continuation).

### Measure script execution time
```bash
time node scripts/gen-large-sketch.cjs
```
**Purpose**: `time` prints real (wall clock), user (CPU in user mode), and sys (CPU in kernel mode) time after the command finishes.

### Compare file sizes before and after optimization
```bash
wc -c dist/assets/*.js | sort -n
```
**Purpose**: Check each JS chunk size. `sort -n` orders smallest to largest. Run before and after a change to see the impact.

### Estimate render cost formula
```
Total calls/sec = (rc_calls_per_element) * (element_count) * (target_fps)

Example: 6 rc calls/element * 381 elements * 60 fps = 137,160 calls/sec
With caching on static frames: 6 * 381 * 1 (first frame) = 2,286 calls total
Subsequent frames: 0 generator calls (all cache hits)
```

---

## 9. File Operations & Bulk Analysis

### Find all files importing from a specific module
```bash
grep -rl "from.*canvas-renderer" src/
```
**Purpose**: `-l` = list filenames only (not matching lines). Know the blast radius before changing a module's API.

### Count lines per file in a directory
```bash
wc -l src/shapes/**/*.ts | sort -n
```
**Purpose**: Identify the largest shape renderers (likely the most complex). `**` = recursive glob (requires `shopt -s globstar` in bash).

### Find recently modified files
```bash
find src -name '*.ts' -mmin -60
```
**Purpose**: `-mmin -60` = modified within last 60 minutes. Useful for "what did I touch?"

### Find files modified today
```bash
find src -name '*.ts' -daystart -mtime 0
```
**Purpose**: `-daystart` = measure from start of today, `-mtime 0` = modified today.

### Compare two files
```bash
diff src/utils/old-renderer.ts src/utils/new-renderer.ts
```
**Purpose**: Line-by-line comparison. Lines starting with `<` are only in file 1, `>` only in file 2.

### Side-by-side diff
```bash
diff -y --width=120 file1.ts file2.ts | head -50
```
**Purpose**: `-y` = side by side. `|` marks changed lines, `<`/`>` marks lines only in one file.

### Extract specific fields from package.json
```bash
grep -E '"(test|dev|build|scripts)"' package.json
```
**Purpose**: Quickly find available npm scripts without reading the whole file. Note: no `cat |` needed; grep reads files directly.

### Check installed package version
```bash
grep '"version"' node_modules/roughjs/package.json
```
**Purpose**: Know the exact version of a dependency. Different versions have different APIs.

### Find duplicate filenames across the project
```bash
find src -name '*.ts' -printf '%f\n' | sort | uniq -d
```
**Purpose**: `-printf '%f\n'` prints just the filename (no path). `sort | uniq -d` shows only duplicates. Catches naming collisions.

### Find the largest files in the project
```bash
find src -name '*.ts' -exec wc -l {} + | sort -rn | head -20
```
**Purpose**: `-rn` = reverse numeric (largest first). Top 20 biggest files are often the most complex and fragile.

---

## 10. JSON & Data Inspection

### Pretty-print JSON
```bash
python3 -m json.tool data/large-sketch.json | head -50
```
**Purpose**: Make minified JSON readable. `python3 -m json.tool` is available on any system with Python.

### Pretty-print with jq (if installed)
```bash
jq '.' data/large-sketch.json | head -50          # pretty-print
jq '.elements | length' data/large-sketch.json     # count elements
jq '.elements[0]' data/large-sketch.json           # first element
jq '.elements[] | .type' data/large-sketch.json    # all element types
jq '[.elements[] | .type] | group_by(.) | map({type: .[0], count: length})' data/large-sketch.json
```
**Purpose**: `jq` is a dedicated JSON processor. Far more powerful than python one-liners for complex queries.

### Extract a specific field from JSON
```bash
python3 -c "import json; d=json.load(open('data/large-sketch.json')); print(d['metadata'])"
```
**Purpose**: Quick inspection of a specific section without loading the whole file.

### Validate JSON syntax
```bash
python3 -m json.tool data/large-sketch.json > /dev/null && echo "VALID" || echo "INVALID"
```
**Purpose**: If the JSON is valid, `json.tool` exits 0 (success), `&&` runs "VALID". If invalid, it exits non-0, `||` runs "INVALID". Output discarded to `/dev/null` since we only care about pass/fail.

### Count unique values of a field
```bash
python3 -c "
import json
d = json.load(open('data/large-sketch.json'))
types = [e['type'] for e in d['elements']]
from collections import Counter
for t, c in Counter(types).most_common():
    print(f'{c:4d} {t}')
"
```
**Purpose**: Understand the distribution of element types in test data.

### Diff two JSON files (structural comparison)
```bash
diff <(python3 -m json.tool a.json) <(python3 -m json.tool b.json)
```
**Purpose**: `<()` is process substitution — it runs a command and presents its output as a file. This pretty-prints both JSONs first, then diffs the formatted output.

---

## 11. Process Management

### Run a command in the background and capture output
```bash
npm run dev > /tmp/dev-server.log 2>&1 &
echo $!  # Print the process ID
```
**Purpose**: `>` redirects stdout to log file, `2>&1` also sends stderr there, `&` backgrounds the process. `$!` is a special variable holding the PID of the most recent background process.

### Check on a background process
```bash
tail -5 /tmp/dev-server.log       # last 5 lines
tail -f /tmp/dev-server.log       # follow in real-time (Ctrl+C to stop)
```
**Purpose**: `tail -5` = last 5 lines. `tail -f` = follow mode, shows new lines as they're written.

### Kill a background process
```bash
kill $(lsof -t -i:5173)
```
**Purpose**: `lsof -t -i:5173` returns just the PID (`-t` = terse output) of whatever process is listening on port 5173. That PID is substituted via `$()` into `kill`.

### Kill a process by name
```bash
pkill -f "vite"
```
**Purpose**: `-f` matches against the full command line. Kills all processes whose command contains "vite".

### List all node processes
```bash
ps aux | grep node
```
**Purpose**: `ps aux` = all processes, all users, with details. Pipe through grep to filter.

### Run a script and capture timing
```bash
time node scripts/gen-large-sketch.cjs
```
**Purpose**: Prints three times after completion:
- `real` = wall clock time (what a human would measure with a stopwatch)
- `user` = CPU time in user mode (actual computation)
- `sys` = CPU time in kernel mode (I/O, system calls)

### Watch a command repeatedly
```bash
watch -n 2 'ls -lh dist/assets/*.js'
```
**Purpose**: Reruns the command every 2 seconds. Useful for watching build output change in real time.

---

## 12. npm & Dependency Management

### See all available scripts
```bash
npm run
```
**Purpose**: Lists every script defined in package.json with its command.

### Check for outdated packages
```bash
npm outdated
```
**Purpose**: Shows current, wanted, and latest versions of each dependency.

### See why a package is installed (dependency chain)
```bash
npm ls roughjs
```
**Purpose**: Shows the dependency tree that led to this package being installed. Useful for understanding transitive dependencies.

### Check for security vulnerabilities
```bash
npm audit
```
**Purpose**: Scans dependencies against known vulnerability databases.

### See the resolved version of a package
```bash
npm ls roughjs --depth=0
```
**Purpose**: `--depth=0` shows only direct dependencies. Without it, shows the full tree.

### Clean install (nuke node_modules)
```bash
rm -rf node_modules && npm install
```
**Purpose**: Nuclear option when dependencies are in a weird state. Deletes everything and reinstalls from scratch.

### Check what npm install would change (dry run)
```bash
npm install --dry-run
```
**Purpose**: Shows what would be added/removed/changed without actually doing it.

---

## 13. Environment Debugging

### Check Node.js version
```bash
node -v
npm -v
npx -v
```
**Purpose**: Version mismatches cause mysterious failures. Always check when something "works on my machine."

### Check environment variables
```bash
env | grep -i node       # Node-related env vars
env | grep -i vite       # Vite-related env vars
echo $PATH               # Where the shell looks for executables
```
**Purpose**: `env` lists all environment variables. Pipe through `grep -i` (case insensitive) to filter.

### Find where an executable lives
```bash
which node
which npx
type tsc
```
**Purpose**: `which` shows the full path. `type` shows if it's a shell alias, function, or binary. Useful for "am I running the right version?"

### Check available disk space
```bash
df -h .
```
**Purpose**: `-h` = human readable. `.` = current filesystem. Builds fail silently when disk is full.

### Check memory usage
```bash
free -h
```
**Purpose**: Shows total, used, free RAM. Build tools (webpack, tsc) can eat lots of memory on large projects.

### Check system load
```bash
uptime
```
**Purpose**: Shows load averages (1min, 5min, 15min). If load > number of CPU cores, the system is overloaded.

---

## 14. Browser DevTools from the CLI

### Open a URL in the default browser
```bash
xdg-open http://localhost:5173           # Linux
open http://localhost:5173               # macOS
```
**Purpose**: Quick way to open the app for manual testing.

### Generate a Lighthouse performance report
```bash
npx lighthouse http://localhost:5173 --output=json --output-path=./lighthouse.json --chrome-flags="--headless"
```
**Purpose**: Automated performance audit. Checks FPS, load time, accessibility, best practices.

### Take a screenshot from CLI
```bash
npx playwright screenshot http://localhost:5173 screenshot.png
```
**Purpose**: Capture the current state without opening a browser manually.

---

## 15. Canvas & Rendering Debugging

These techniques are specific to HTML Canvas projects like Yappy.

### Find all Canvas API calls in the codebase
```bash
grep -rn "ctx\.\(fillRect\|strokeRect\|beginPath\|arc\|lineTo\|moveTo\|fill\|stroke\|save\|restore\|translate\|rotate\|scale\)" src/ | wc -l
```
**Purpose**: Quantify how many canvas operations exist. Each one is a potential performance concern in a hot render loop.

### Find all state save/restore pairs (check for leaks)
```bash
echo "saves:"; grep -rc "ctx.save()" src/ | grep -v ":0$"
echo "restores:"; grep -rc "ctx.restore()" src/ | grep -v ":0$"
```
**Purpose**: Every `ctx.save()` must have a matching `ctx.restore()`. Mismatches leak state and cause rendering bugs (wrong transform, wrong color, etc.).

### Find all places that modify canvas transform
```bash
grep -rn "ctx\.\(translate\|rotate\|scale\|setTransform\|resetTransform\)" src/
```
**Purpose**: Canvas transforms are cumulative and a common source of bugs. Map all mutation sites.

### Find all globalAlpha/globalCompositeOperation changes
```bash
grep -rn "ctx\.\(globalAlpha\|globalCompositeOperation\)" src/
```
**Purpose**: These affect all subsequent draw calls. Forgetting to restore them causes subtle rendering bugs.

### Measure render call density
```
Formula: total_canvas_api_calls_per_frame =
    (calls_per_element * visible_elements) +
    (overlay_calls * selected_elements) +
    (grid_calls if grid visible)

Target: < 10,000 calls per frame for smooth 60fps
Warning: > 50,000 calls per frame likely causes jank
```

### Check for expensive patterns in render loops
```bash
# String allocation in hot path
grep -rn "JSON.stringify\|JSON.parse\|\.split(\|\.join(" src/utils/canvas-renderer.ts

# Object spread in render loop (creates garbage for GC)
grep -rn "\.\.\." src/utils/canvas-renderer.ts

# Array methods that allocate (vs. for loops)
grep -rn "\.map(\|\.filter(\|\.reduce(" src/utils/canvas-renderer.ts
```
**Purpose**: In a 60fps render loop, micro-allocations add up. `...spread`, `.map()`, string operations all create objects that trigger garbage collection pauses.

---

## 16. Regex Patterns for Code Analysis

### Common patterns for code search

```bash
# Find exported functions
grep -rn "^export \(function\|const\|class\)" src/utils/

# Find React/Solid component definitions
grep -rn "^export \(default \)\?function [A-Z]" src/components/

# Find TODO/FIXME/HACK comments
grep -rn "//.*\(TODO\|FIXME\|HACK\|XXX\|TEMP\)" src/

# Find magic numbers (numeric literals not 0 or 1)
grep -rn "[^a-zA-Z0-9_][2-9][0-9]*[^a-zA-Z0-9_.]" src/utils/ --include="*.ts"

# Find console.log statements (should be removed before commit)
grep -rn "console\.\(log\|warn\|error\|debug\)" src/ --include="*.ts" --include="*.tsx"

# Find commented-out code (lines starting with // followed by code-like patterns)
grep -rn "^[[:space:]]*//[[:space:]]*\(const\|let\|var\|function\|return\|if\|for\)" src/

# Find type assertions (potential type safety issues)
grep -rn "as any" src/ --include="*.ts" --include="*.tsx" | wc -l

# Find non-null assertions (risky ! operator)
grep -rn "[a-zA-Z]!" src/ --include="*.ts" | grep -v "!=\|!=" | head -20
```

### Regex syntax quick reference

```
.       Any character          \d      Digit [0-9]
*       0 or more              \w      Word char [a-zA-Z0-9_]
+       1 or more              \s      Whitespace
?       0 or 1                 \b      Word boundary
^       Start of line          $       End of line
[abc]   Character class        [^abc]  Negated class
(a|b)   Alternation            \(  \)  Group (basic regex)
{n}     Exactly n times        {n,m}   Between n and m times
```

**grep vs grep -E**:
- Basic regex (`grep`): `\|`, `\(\)`, `\{n\}` need escaping
- Extended regex (`grep -E`): `|`, `()`, `{n}` work without escaping
- Use `-E` to avoid backslash hell

---

## 17. Reactive Store & Data Flow Debugging

When a feature works in one UI layer (e.g., contenteditable editor) but breaks in another (e.g., canvas rendering), the bug is usually in the data pipeline between them.

### Trace a data commit pipeline end-to-end
```bash
# 1. Find the commit handler (what saves data to the store)
grep -rn "commitRichText\|commitText" src/ --include="*.ts" --include="*.tsx"

# 2. Find the updateElement function (the store mutation)
grep -rn "function updateElement\|const updateElement" src/store/

# 3. Check for guards/interceptors that may modify the update
grep -rn -A 10 "updateElement" src/store/app-store.ts | head -40

# 4. Find the renderer that reads the data back
grep -rn "el\.richText\|el\.text" src/shapes/renderers/text-renderer.ts
```
**Purpose**: When data is correct in the editor but wrong on canvas, the bug is in steps 2-3 (store mutation interceptors). In this project, `updateElement` had a guard that cleared `richText` when `text` was present in updates — even when `richText` was being intentionally set.

### Debug SolidJS store mutations
```bash
# Find all places that call updateElement with specific fields
grep -rn "updateElement.*richText\|updateElement.*text" src/

# Find store interceptors (guards that transform updates)
grep -rn "if.*'text' in updates\|if.*'richText' in updates" src/store/

# Check for signal resets that may clear data
grep -rn "setRichTextSpans\(\[\]\)" src/
```
**Purpose**: SolidJS stores can have mutation interceptors. A common bug pattern: a guard meant for one code path (property panel) accidentally triggers in another (commit handler).

### Trace rich text formatting flow
```bash
# 1. HTML → Spans: Check the parser extracts formatting
grep -rn "htmlToSpans\|walk.*inherited" src/utils/rich-text-utils.ts

# 2. Spans → Store: Check the commit saves spans
grep -rn "richText: spans\|richText:" src/utils/tool-handlers/text-editing-handler.ts

# 3. Store → Renderer: Check the renderer reads spans
grep -rn "el\.richText\|span\.underline\|span\.bold\|span\.italic\|span\.strikethrough" src/shapes/renderers/

# 4. Layout engine: Check segments preserve span references
grep -rn "span:.*token\.span\|seg\.span" src/utils/rich-text-utils.ts
```
**Purpose**: Rich text has a 4-step pipeline: DOM → Spans → Store → Canvas. Each step can lose formatting. Trace through each step to find where data drops.

### Debug "works in editor, broken on canvas" issues
```bash
# Check if the rendering condition matches the element type
grep -rn "el\.type === 'richtext'\|el\.type === 'text'" src/shapes/renderers/text-renderer.ts

# Check if the editor overlay is shown for the right element types
grep -rn "el?.type === 'richtext'\|richTextSpans" src/components/canvas.tsx | head -10

# Check if blur/commit handlers are called correctly
grep -rn "handleBlur\|handleCommit\|onCommitRichText" src/components/rich-text-editing-overlay.tsx
```
**Purpose**: The overlay (contenteditable) and the canvas renderer may have different conditions for when rich text is active. Mismatches cause "works while editing, broken after blur."

### Find tool-lock and tool-reset issues
```bash
# Find all places that reset the selected tool to 'selection'
grep -rn "setSelectedTool.*selection\|setSelectedTool('selection')" src/

# Check which tools are in the CONTINUOUS_TOOLS list
grep -rn "CONTINUOUS_TOOLS" src/utils/tool-handlers/

# Check for toolLocked guards
grep -rn "store\.toolLocked\|toolLocked" src/
```
**Purpose**: When a tool resets unexpectedly after an action, search for all `setSelectedTool('selection')` calls. Each should check `!store.toolLocked` before resetting.

---

## 18. Investigation Patterns (Thinking Framework)

### The Thinking Framework

When approaching any codebase investigation, follow this systematic pattern:

#### Pattern 1: "Where is X defined?"
```
1. grep -rn "function X\|class X\|const X" src/
2. Read the file containing the definition
3. grep -rn "import.*X" src/  (find all consumers)
```

#### Pattern 2: "Why is this broken?"
```
1. npx tsc --noEmit 2>&1 | head -20  (type errors?)
2. npm run build 2>&1                 (build errors?)
3. git diff                           (what changed recently?)
4. git log --oneline -10              (recent commits)
5. grep -rn "THE_ERROR_MSG" src/      (find where error originates)
6. git stash && npm run build         (does reverting fix it?)
7. git stash pop                      (restore changes)
```

#### Pattern 3: "How does feature Y work?"
```
1. grep -rn "Y" src/ --include="*.ts" | head -20  (find entry points)
2. Read the main file top-to-bottom
3. Follow imports to understand dependencies
4. grep -rn "Y" src/ -l  (map all related files)
5. Draw the call graph mentally: A calls B calls C
```

#### Pattern 4: "Is it safe to change Z?"
```
1. grep -rl "Z" src/             (who imports Z?)
2. grep -rn "Z" src/ -c          (how many references?)
3. Make the change
4. npx tsc --noEmit              (type-check after change)
5. npx playwright test            (run tests after change)
6. git diff                      (review all changes)
```

#### Pattern 5: "What's the performance bottleneck?"
```
1. Count call sites:  grep -rc "expensiveFunc" src/
2. Count elements:    python3 -c "..." on data file
3. Multiply: calls_per_element * element_count * 60fps
4. Read the hot path code
5. Identify what can be cached/skipped
6. Measure before and after: time npm run build, or DevTools Performance tab
```

#### Pattern 6: "Understand a dependency's API"
```
1. grep '"version"' node_modules/pkg/package.json
2. cat node_modules/pkg/bin/*.d.ts   (read type definitions)
3. grep -rn "from.*pkg" src/         (how we currently use it)
4. Check the README: cat node_modules/pkg/README.md | head -100
```

#### Pattern 7: "Prepare for a safe refactor"
```
1. grep -rl "oldName" src/                  (find all files)
2. grep -rc "oldName" src/ | grep -v ":0$"  (count per file)
3. npx tsc --noEmit                         (baseline: no errors)
4. Make changes
5. npx tsc --noEmit                         (still no errors?)
6. npx playwright test                       (tests still pass?)
7. git diff --stat                          (review scope)
```

#### Pattern 8: "Debug a flaky test"
```
1. npx playwright test -g "test name" --repeat-each=5   (reproduce)
2. npx playwright test -g "test name" --debug            (step through)
3. npx playwright test -g "test name" --headed           (watch it)
4. Check for timing: grep -n "waitFor\|setTimeout\|sleep" tests/
5. Check for shared state: grep -n "beforeEach\|afterEach" tests/
```

---

## 19. Quick Reference Cheat Sheet

### Shell Operators
| Operator | Meaning |
|----------|---------|
| `\|` | Pipe stdout to next command |
| `>` | Redirect stdout to file (overwrite) |
| `>>` | Redirect stdout to file (append) |
| `2>` | Redirect stderr to file |
| `2>&1` | Merge stderr into stdout |
| `&>` | Redirect both stdout+stderr to file |
| `&&` | Run next only if previous succeeded |
| `\|\|` | Run next only if previous failed |
| `;` | Run next regardless |
| `&` | Run in background |
| `$()` | Command substitution |
| `$!` | PID of last background process |
| `$?` | Exit code of last command |
| `<()` | Process substitution (output as file) |
| `<<EOF` | Here document (multi-line input) |

### Common Commands
| Goal | Command |
|------|---------|
| Type check | `npx tsc --noEmit` |
| Find definition | `grep -rn "function X" src/` |
| Find usages | `grep -rn "X" src/ -l` |
| Count references | `grep -rc "X" src/ \| grep -v ":0$"` |
| Recent changes | `git log --oneline -10` |
| What changed | `git diff` |
| Who wrote this line | `git blame file -L 10,20` |
| Server alive? | `curl -s -o /dev/null -w "%{http_code}" http://localhost:5173` |
| Run one test | `npx playwright test tests/file.spec.ts` |
| Lines of code | `find src -name '*.ts' \| xargs wc -l \| tail -1` |
| Kill port | `kill $(lsof -t -i:PORT)` |
| JSON validate | `python3 -m json.tool file.json > /dev/null` |
| File blast radius | `grep -rl "from.*module" src/` |
| Package version | `grep '"version"' node_modules/pkg/package.json` |
| Disk space | `df -h .` |
| Node version | `node -v` |
| Background + log | `cmd > file.log 2>&1 &` |
| Follow log | `tail -f file.log` |

### grep Flags
| Flag | Meaning |
|------|---------|
| `-r` | Recursive (search directories) |
| `-n` | Show line numbers |
| `-l` | List filenames only (matches) |
| `-L` | List filenames only (non-matches) |
| `-c` | Count matches per file |
| `-i` | Case insensitive |
| `-w` | Whole word match |
| `-v` | Invert match (exclude) |
| `-E` | Extended regex |
| `-A N` | N lines after match |
| `-B N` | N lines before match |
| `-C N` | N lines context (before + after) |
| `--include` | Filter by filename pattern |
| `--exclude-dir` | Skip directories |
