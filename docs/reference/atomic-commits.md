---
trigger: always_on
---

Analyze unstaged changes, identify dependency relationships, and create a well-ordered series of small, focused commits that each leave the repository in a working state.

Quick Start
Assess — Review all staged and unstaged changes
Analyze — Map dependency relationships between changes
Plan — Propose a commit sequence (get user approval)
Execute — Create commits one at a time, verifying after each
Verify — Show the final commit log
Workflow
1. Assess the Current State
*.bash
Shell
git status --porcelain
git diff --stat
git diff --cached --stat
If there are no changes, stop — nothing to commit.

2. Analyze Changes and Plan Commit Order
Read the actual diffs to understand what changed:

*.bash
Shell
git diff
git diff --cached
Map the dependency relationships between all changed files:

Self-contained — Can be committed independently
Dependent — Requires other changes to be committed first (e.g., a new import used in another file, a schema change needed by a query)
Logically related — Part of the same feature, fix, or refactoring
3. Plan the Commit Sequence
Apply these ordering rules:

Standalone changes first. If file A can be committed independently but file B depends on changes in file A, commit A before B.
Each commit must be functional. Code should work after every commit. Changes that depend on each other must be in the same commit.
Group related commits sequentially. If commits B and C relate to a feature but commit A is an unrelated fix, order them A → B → C so history reads cleanly by topic.
Smaller is better. When in doubt, prefer more smaller commits over fewer large ones. Five small commits are better than one large commit with the same changes.
Present the plan to the user before executing:

*.txt
Plaintext
Planned commits:
1. <short description> — <files>
2. <short description> — <files>
...
Wait for approval before proceeding.

4. Execute Commits
For each planned commit:

Stage specific files only — Use git add <file>.... Never use git add -A or git add ..
Write a concise message using Conventional Commits:

Format:
`<type>(optional-scope): <imperative summary>`

Allowed types:
- `feat` — new feature
- `fix` — bug fix
- `docs` — documentation only
- `refactor` — code change without behavior change
- `test` — tests added/updated
- `chore` — maintenance, tooling, cleanup
- `perf` — performance improvement
- `build` — build/dependency changes
- `ci` — CI/CD changes

Message rules:
- First line under 72 characters
- Imperative mood
- No default co-author trailer unless the user explicitly requests it

Examples:
- `feat(chat): add OpenClaw forwarding route`
- `docs(readme): document gateway responses endpoint`
- `chore(types): remove unused import`

Commit with HEREDOC for clean formatting:
*.bash
Shell
git add <files> && git commit -m "$(cat <<'EOF'
<commit message>
EOF
)"
Verify the commit succeeded (git status --porcelain) before moving on.
5. Final Verification
git log --oneline -<N>
Show the user the commit log so they can review.

Rules
Never git add -A or git add . — Always stage specific files by name.
Never --no-verify — If a hook fails, fix the issue and retry.
Never amend unless the user explicitly asks — always create new commits.
Use Conventional Commits for all commit subjects.
Never commit secrets — Warn the user if .env, credentials, or token files appear in the changeset.
One change is fine — If there's only one logical change, a single commit is correct. Don't split artificially.
Partial staging — If only some hunks in a file belong to a commit and this can't be handled non-interactively, tell the user and ask them to stage those hunks manually.
