# GitHub Actions Security Setup

This document explains how to configure GitHub Actions secrets for the Automotive Cybersecurity MCP CI/CD pipeline.

## Required Secrets

| Secret Name | Purpose | Used By |
|------------|---------|---------|
| `NPM_TOKEN` | Publish to npm registry | `publish.yml` |

## NPM_TOKEN Setup

### Create npm Access Token

1. Log in to [npmjs.com](https://www.npmjs.com)
2. Click your profile → **Access Tokens**
3. Click **Generate New Token** → **Classic Token**
4. Select **Automation** scope
5. Copy the token (starts with `npm_`)

### Add to GitHub Secrets

1. Go to your repository on GitHub
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `NPM_TOKEN`
5. Value: Paste the npm token
6. Click **Add secret**

### Security Notes

- **Never commit** this token to the repository
- **Never log** this token in workflow outputs
- **Rotate regularly** (npm allows generating new tokens and revoking old ones)
- Use **Automation scope** (not Classic or Publish)

---

## MCP Registry Publishing

**Note:** This project does not currently use MCP Registry signing. If added in the future, additional secrets will be required for cryptographic signing of MCP packages.

---

## Troubleshooting

### "npm publish permission denied"

**Symptom:** `npm publish` fails with 403

**Possible causes:**
- `NPM_TOKEN` invalid or expired
- Package name already taken
- Not authorized to publish under `@ansvar` scope

**Solution:**
```bash
# Verify token works locally
export NPM_TOKEN=<your-token>
npm whoami --registry https://registry.npmjs.org

# Check package ownership
npm owner ls @ansvar/automotive-cybersecurity-mcp
```

---

## Security Best Practices

### Secret Hygiene

1. **Never commit secrets** to the repository (use `.gitignore` for local test files)
2. **Use `::add-mask::`** in workflows to prevent accidental logging
3. **Rotate regularly** even if not compromised
4. **Audit access** to GitHub secrets

### Workflow Security

1. **Pin action versions** (e.g., `actions/checkout@v4`, not `@main`)
2. **Minimal permissions** (use `permissions:` block)
3. **Avoid command injection** (never interpolate untrusted input)
4. **Review dependencies** (check new workflow actions)

### Incident Response

If a secret is compromised:

1. **Immediately revoke** the token in the source system
2. **Rotate** to a new secret
3. **Update GitHub secret** with new value
4. **Review logs** for unauthorized use
5. **Document** the incident for audit trail

---

**Last Updated:** 2026-01-30
**Maintainer:** Ansvar Systems (hello@ansvar.eu)
