# CI/CD Documentation

## Overview

This project uses GitHub Actions for continuous integration and deployment with comprehensive security scanning.

## Workflows

### 1. CI Pipeline (`.github/workflows/ci.yml`)

**Triggers:** Push to `main`/`develop`, pull requests, manual dispatch

**Jobs:**
- **Gitleaks** - Secret scanning to prevent credential leaks
- **Lint** - TypeScript type checking
- **Test** - Full test suite on Node 18/20/22 across Ubuntu/macOS/Windows
- **Audit** - npm security vulnerability scanning

**Required Checks:** All must pass before merge

### 2. Publish to npm (`.github/workflows/publish.yml`)

**Triggers:** Release published, manual dispatch

**Process:**
1. Runs full CI test suite
2. Builds database (620KB)
3. Compiles TypeScript → JavaScript
4. Publishes to npm with provenance attestation
5. Public access under `@ansvar` scope

**Required Secret:** `NPM_TOKEN` (npm automation token)

### 3. CodeQL Security Scan (`.github/workflows/codeql.yml`)

**Triggers:** Push to `main`, pull requests, weekly schedule (Mondays 2am UTC)

**Analysis:**
- JavaScript/TypeScript code scanning
- Security vulnerability detection
- SARIF results uploaded to GitHub Security tab

## Security Features

### Gitleaks Configuration (`.gitleaks.toml`)

Scans for:
- npm tokens
- GitHub tokens
- Generic API keys
- Private cryptographic keys

**Allowlist:** Test files, examples, package-lock.json

### Dependabot (`.github/dependabot.yml`)

**npm dependencies:** Weekly updates on Mondays
**GitHub Actions:** Weekly updates on Mondays

Auto-creates PRs with labels: `dependencies`, `automated`

## npm Publishing Process

### Automatic (Recommended)

1. Create a GitHub release (triggers publish workflow)
2. CI runs automatically
3. Package published to npm if tests pass

### Manual

```bash
# Ensure you're on main with latest code
git checkout main
git pull

# Run full test suite
npm run test:ci

# Verify package contents
npm run verify:package

# Publish (requires npm login)
npm publish
```

### Pre-Publish Checks

The `prepublishOnly` script automatically runs:
- Full test suite (`npm run test:ci`)
- Database verification (`npm run verify:db`)
- Build verification

**Package Contents:**
- `dist/` - Compiled JavaScript
- `data/automotive.db` - 620KB regulation database
- `data/seed/` - JSON seed data
- `README.md`, `LICENSE`, `package.json`

**Excluded from Package:**
- `src/` - TypeScript source
- `tests/` - Test files
- `.github/` - CI/CD configs
- Documentation markdown files (internal)

## Secrets Required

### Repository Secrets

Set in GitHub Settings → Secrets and variables → Actions:

| Secret | Purpose | How to Get |
|--------|---------|------------|
| `NPM_TOKEN` | npm publishing | npm access tokens (automation) |

**Creating NPM_TOKEN:**
```bash
# Login to npm
npm login

# Create automation token (granular access recommended)
# Go to: https://www.npmjs.com/settings/[username]/tokens
# Click "Generate New Token" → "Automation"
# Copy token and add to GitHub secrets
```

## Running CI Locally

```bash
# Install dependencies
npm ci

# Type check (lint job)
npm run typecheck

# Build database
npm run build:db

# Build TypeScript
npm run build

# Run tests
npm test

# Security audit
npm audit --production --audit-level=high

# Scan for secrets (requires gitleaks installed)
gitleaks detect --source . --verbose
```

### Install Gitleaks Locally

**macOS:**
```bash
brew install gitleaks
```

**Linux:**
```bash
wget https://github.com/gitleaks/gitleaks/releases/download/v8.18.0/gitleaks_8.18.0_linux_x64.tar.gz
tar xzf gitleaks_8.18.0_linux_x64.tar.gz
sudo mv gitleaks /usr/local/bin/
```

**Windows:**
```powershell
choco install gitleaks
```

## Badge Status

Add to README.md:

```markdown
[![CI](https://github.com/Ansvar-Systems/Automotive-MCP/actions/workflows/ci.yml/badge.svg)](https://github.com/Ansvar-Systems/Automotive-MCP/actions/workflows/ci.yml)
[![CodeQL](https://github.com/Ansvar-Systems/Automotive-MCP/actions/workflows/codeql.yml/badge.svg)](https://github.com/Ansvar-Systems/Automotive-MCP/actions/workflows/codeql.yml)
[![npm version](https://badge.fury.io/js/@ansvar%2Fautomotive-cybersecurity-mcp.svg)](https://www.npmjs.com/package/@ansvar/automotive-cybersecurity-mcp)
```

## Troubleshooting

### CI Failing on Database Size

**Problem:** Database smaller than expected (< 600KB)

**Solution:**
```bash
# Rebuild database with complete content
npm run build:db

# Verify size
ls -lh data/automotive.db
# Should be ~620KB

# Commit updated database
git add data/automotive.db
git commit -m "chore: rebuild database"
```

### npm Publish Fails

**Problem:** `npm ERR! 403 Forbidden - PUT https://registry.npmjs.org/@ansvar/automotive-cybersecurity-mcp`

**Solutions:**
1. Verify `NPM_TOKEN` is valid (check expiration)
2. Ensure token has publish permissions
3. Verify `@ansvar` scope exists and you have access
4. Check `publishConfig.access` is set to `public`

### Gitleaks False Positives

**Problem:** Gitleaks flags test data as secrets

**Solution:**
Add to `.gitleaks.toml` allowlist:
```toml
[allowlist]
paths = [
  '''path/to/test/file\.ts''',
]
```

## Version Bumping

```bash
# Patch (0.1.0 → 0.1.1)
npm version patch

# Minor (0.1.0 → 0.2.0)
npm version minor

# Major (0.1.0 → 1.0.0)
npm version major

# Push with tags
git push origin main --tags
```

## Release Checklist

- [ ] All tests passing locally
- [ ] Database rebuilt (`npm run build:db`)
- [ ] CHANGELOG.md updated
- [ ] Version bumped in package.json
- [ ] Committed and pushed to main
- [ ] Create GitHub release with tag (e.g., `v0.2.0`)
- [ ] Wait for publish workflow to complete
- [ ] Verify package on npm: `npm view @ansvar/automotive-cybersecurity-mcp`
- [ ] Test install: `npx @ansvar/automotive-cybersecurity-mcp@latest`

## Monitoring

**GitHub Actions:** https://github.com/Ansvar-Systems/Automotive-MCP/actions
**npm Package:** https://www.npmjs.com/package/@ansvar/automotive-cybersecurity-mcp
**Security Alerts:** GitHub Security tab → Code scanning alerts
