# Contributing to Automotive Cybersecurity MCP

Thank you for your interest in contributing to the Automotive Cybersecurity MCP Server! This document provides guidelines and instructions for contributing.

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- **Clear title** describing the issue
- **Steps to reproduce** the behavior
- **Expected behavior** vs actual behavior
- **Environment details** (Node.js version, OS, Claude Desktop version)
- **Error messages** or logs if applicable

### Suggesting Enhancements

Enhancement suggestions are welcome! Please include:

- **Clear title** describing the enhancement
- **Detailed description** of the proposed functionality
- **Use case** explaining why this would be valuable
- **Possible implementation** if you have ideas

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Follow the coding style** of the project
3. **Add tests** for any new functionality
4. **Update documentation** if needed
5. **Ensure CI passes** before requesting review

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Local Development

```bash
# Clone your fork
git clone https://github.com/YOUR-USERNAME/Automotive-MCP.git
cd Automotive-MCP

# Install dependencies
npm install

# Build the database
npm run build:db

# Build TypeScript
npm run build

# Run tests
npm test

# Run in development mode
npm run dev
```

### Project Structure

```
├── src/               # TypeScript source code
│   ├── index.ts       # MCP server entry point
│   ├── tools/         # Tool implementations
│   ├── db/            # Database operations
│   └── types/         # TypeScript type definitions
├── scripts/           # Build and utility scripts
├── data/              # Seed data and generated database
├── tests/             # Test files
└── .github/           # GitHub Actions and templates
```

## Coding Guidelines

### TypeScript

- Use TypeScript strict mode
- Prefer `const` over `let`
- Use meaningful variable names
- Add JSDoc comments for public APIs

### Commits

Follow [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` new feature
- `fix:` bug fix
- `docs:` documentation only
- `test:` adding or updating tests
- `refactor:` code change that neither fixes a bug nor adds a feature
- `chore:` maintenance tasks
- `ci:` CI/CD changes

Examples:
```
feat: add support for ISO 21434 clause queries
fix: handle empty search results gracefully
docs: update installation instructions
```

### Testing

- Write tests for new features
- Maintain or improve test coverage
- Run `npm test` before submitting PRs

## Database Changes

The automotive regulations database is built from seed files in `data/seed/`. If you need to modify the database schema or content:

1. Update the relevant seed files
2. Update the schema in `scripts/build-db.ts` if needed
3. Rebuild with `npm run build:db`
4. Add tests for new data

## Review Process

1. **Automated checks** must pass (CI, linting, tests)
2. **Code review** by a maintainer
3. **Approval** required before merging
4. **Squash merge** is preferred for clean history

## Getting Help

- Open an issue for questions
- Check existing documentation
- Review closed issues for similar problems

## Recognition

Contributors are recognized in release notes. Thank you for helping improve automotive cybersecurity tooling!

## License

By contributing, you agree that your contributions will be licensed under the [Apache 2.0 License](LICENSE).
