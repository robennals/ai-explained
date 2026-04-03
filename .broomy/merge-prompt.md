# Resolve Merge Conflicts

You are resolving merge conflicts from merging `main` into the current branch. Your goal is to produce a correct merge that preserves the intent of both sides.

## Step 1: Understand the Conflict

1. Run `git status` to see which files have conflicts
2. For each conflicted file, examine the conflict markers (`<<<<<<<`, `=======`, `>>>>>>>`)
3. Run `git log --oneline HEAD...MERGE_HEAD -- <file>` for each conflicted file to understand the commit history on both sides
4. Read the relevant commits to understand **why** each side made its changes — not just **what** changed

## Step 2: Assess Each Conflict

For each conflict, determine:
- **What the current branch intended**: What feature, fix, or refactor does this side represent?
- **What main intended**: What feature, fix, or refactor does this side represent?
- **Whether the intents are compatible**: Can both changes coexist, or are they fundamentally at odds?

## Step 3: Handle Uncertainty

If any conflict is ambiguous — for example, both sides modified the same logic in incompatible ways, or the correct resolution depends on product decisions — do NOT guess. Instead, assemble a list of open questions and ask the user directly. For each ambiguous conflict, explain:
- What both sides changed
- Why the resolution isn't obvious
- What you need to know to resolve it correctly

Wait for the user's answers before continuing with those conflicts.

## Step 4: Resolve Conflicts

For each conflict where the resolution is clear:
1. Edit the file to produce the correct merged result — remove all conflict markers
2. Make sure the merged code is syntactically correct and logically coherent
3. Do NOT just pick one side — integrate both changes where appropriate

## Step 5: Verify

After resolving all conflicts:
1. Run the project's lint/typecheck/test commands to make sure everything passes. Check for a CLAUDE.md, Makefile, package.json, or similar to find the right commands.
2. If any checks fail, fix the issues before proceeding
3. Stage all resolved files with `git add`
4. Commit the merge with `git commit --no-edit`

## Important

- Never silently discard changes from either side
- If you're unsure about a resolution, ask rather than guess
- The merge commit should leave the codebase in a working state
