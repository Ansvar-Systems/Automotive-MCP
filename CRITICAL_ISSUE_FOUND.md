# CRITICAL ISSUE FOUND - Database Not Included in npm Package

**Severity:** CRITICAL - BLOCKING NPM PUBLISH
**Discovered:** 2026-01-29 during quality assessment
**Impact:** Server will not work when installed from npm

---

## Problem Description

The `automotive.db` database file is excluded from the npm package because:

1. `*.db` is in `.gitignore`
2. npm uses `.gitignore` for exclusions when no `.npmignore` exists
3. No `files` field in `package.json` to override this
4. The `prepublishOnly` script runs `npm run build:db`, but the generated file is still excluded

**Verification:**
```bash
$ npm pack --dry-run
# automotive.db is NOT in the tarball contents
```

**Impact:**
- Users who install from npm will NOT have the database
- Server will fail to start with error: "Failed to open database at .../data/automotive.db"
- Server is completely non-functional without the database

---

## Solutions (Choose One)

### Solution 1: Add .npmignore (RECOMMENDED)

Create `.npmignore` with contents:
```
# Test files
tests/
*.test.ts
*.test.js

# Development files
.serena/
.claude/
test-*.mjs
test-*.py
inspect-*.py
quality-*.mjs

# Source files (dist/ is shipped instead)
src/
tsconfig.json
vitest.config.ts

# Build artifacts
*.tsbuildinfo

# Environment
.env
.env.local

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Git
.git/
.gitignore
.gitattributes

# Worktrees
.worktrees/

# NOTE: Do NOT exclude data/ - database must be included!
```

**Pros:**
- Explicit control over what's published
- Can include database while excluding other ignored files
- Standard npm practice

**Cons:**
- Need to maintain separate ignore file

### Solution 2: Use package.json "files" field (ALTERNATIVE)

Add to package.json:
```json
{
  "files": [
    "dist/",
    "data/automotive.db",
    "data/seed/",
    "README.md"
  ]
}
```

**Pros:**
- Explicit whitelist approach
- Clear what's included
- Smaller package (only ships what's needed)

**Cons:**
- Must remember to add new directories

### Solution 3: Remove *.db from .gitignore and commit database (NOT RECOMMENDED)

**Pros:**
- Simple

**Cons:**
- Binary files in git (bad practice)
- Database file will grow over time
- Git history bloat
- Not recommended for databases

---

## Recommended Fix

**Use Solution 1: Create .npmignore**

This is the most flexible and allows:
- Database included in npm package
- Database excluded from git
- Development/test files excluded from npm
- Clean separation of concerns

---

## Verification Steps

After implementing fix:

1. Create the .npmignore file (or add files field)
2. Run `npm pack`
3. Verify output includes:
   ```
   npm notice data/automotive.db
   ```
4. Extract tarball and verify database exists:
   ```bash
   tar -xzf ansvar-automotive-cybersecurity-mcp-0.1.0.tgz
   ls -la package/data/automotive.db
   ```
5. Test install from tarball:
   ```bash
   npm install -g ./ansvar-automotive-cybersecurity-mcp-0.1.0.tgz
   ```
6. Verify server starts:
   ```bash
   automotive-cybersecurity-mcp
   # Should start without database errors
   ```

---

## Impact Assessment

**Without Fix:**
- ❌ Server completely non-functional when installed from npm
- ❌ Users get "database not found" error
- ❌ No workaround unless user manually builds database
- ❌ npm package is useless

**With Fix:**
- ✅ Server works immediately after npm install
- ✅ Users can use server without building anything
- ✅ Database is ready to use
- ✅ Package is fully functional

---

## Priority

**CRITICAL - MUST FIX BEFORE NPM PUBLISH**

This is a **blocking issue** that prevents the package from being functional. It must be fixed before publishing to npm.

---

## Proposed .npmignore File

```
# Development and testing
tests/
*.test.ts
*.test.js
test-*.mjs
test-*.py
inspect-*.py
quality-*.mjs
coverage/
.serena/
.claude/

# Source TypeScript (ship compiled dist/ instead)
src/
tsconfig.json
vitest.config.ts

# Assessment docs (keep README.md but not internal docs)
QUALITY_ASSESSMENT_REPORT.md
TEST_RESULTS.md
DEPLOYMENT_CHECKLIST.md
CRITICAL_ISSUE_FOUND.md

# Git
.git/
.gitignore
.gitattributes
.worktrees/

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Environment
.env
.env.local

# Build artifacts
*.tsbuildinfo
*.log

# IMPORTANT: Do NOT exclude these
# - dist/
# - data/automotive.db
# - data/seed/
# - README.md
# - LICENSE (to be added)
# - package.json
```

---

**Status:** Issue identified and solution provided
**Next Step:** Implement .npmignore file before publishing
