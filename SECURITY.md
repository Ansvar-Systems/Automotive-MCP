# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| 0.1.x   | :x:                |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please report it responsibly.

### How to Report

**Do NOT open a public GitHub issue for security vulnerabilities.**

Instead, please report security vulnerabilities by emailing:

**security@ansvar.ai**

Include the following information:

1. **Description** of the vulnerability
2. **Steps to reproduce** the issue
3. **Potential impact** assessment
4. **Suggested fix** if you have one

### What to Expect

- **Acknowledgment** within 48 hours
- **Initial assessment** within 7 days
- **Regular updates** on progress
- **Credit** in the security advisory (if desired)

### Scope

This security policy covers:

- The MCP server code (`src/`)
- Build scripts (`scripts/`)
- Database schema and population
- GitHub Actions workflows

Out of scope:

- Third-party dependencies (report to their maintainers)
- The MCP protocol itself (report to Anthropic)

## Security Measures

### Current Protections

- **Secret scanning** via Gitleaks in CI
- **Static analysis** via CodeQL
- **Dependency auditing** via npm audit
- **Automated updates** via Dependabot

### Best Practices for Users

1. **Keep dependencies updated** - Run `npm audit` regularly
2. **Review database content** - The database contains regulatory text only
3. **Use read-only mode** - The server operates in read-only database mode
4. **Secure your MCP configuration** - Protect your `claude_desktop_config.json`

## Security Design

### Database Security

- SQLite database is opened in **read-only mode**
- No user input is directly interpolated into SQL queries
- FTS5 queries use parameterized statements

### MCP Protocol

- The server only implements **read operations**
- No file system write access
- No network requests from the server
- No execution of external commands

## Disclosure Policy

We follow coordinated disclosure:

1. Reporter notifies us privately
2. We investigate and develop a fix
3. We release the fix
4. We publish a security advisory
5. Reporter may publish their findings

We aim to resolve critical vulnerabilities within 30 days.

## Acknowledgments

We thank all security researchers who responsibly disclose vulnerabilities.
