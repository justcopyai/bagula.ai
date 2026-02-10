# Contributing to Bagula

First off, thank you for considering contributing to Bagula! It's people like you that make Bagula such a great tool for the AI community.

## Code of Conduct

This project and everyone participating in it is governed by our Code of Conduct. By participating, you are expected to uphold this code. Please report unacceptable behavior to [conduct@bagula.ai](mailto:conduct@bagula.ai).

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

- **Use a clear and descriptive title**
- **Describe the exact steps to reproduce the problem**
- **Provide specific examples** to demonstrate the steps
- **Describe the behavior you observed** and what you expected
- **Include screenshots or code samples** if relevant
- **Provide your environment details** (OS, Node version, package versions)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

- **Use a clear and descriptive title**
- **Provide a detailed description** of the suggested enhancement
- **Explain why this enhancement would be useful** to most Bagula users
- **List some examples** of how it would be used

### Pull Requests

1. **Fork the repo** and create your branch from `main`
2. **Add tests** if you've added code that should be tested
3. **Ensure the test suite passes** (`npm test`)
4. **Format your code** (`npm run format`)
5. **Write a clear commit message** following our commit conventions
6. **Update documentation** if you're changing functionality

## Development Setup

### Prerequisites

- Node.js >= 18
- npm >= 9
- Git

### Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/bagula.ai.git
cd bagula.ai

# Add upstream remote
git remote add upstream https://github.com/justcopyai/bagula.ai.git

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test
```

### Project Structure

```
bagula/
├── packages/
│   ├── core/           # Core testing framework
│   ├── cli/            # Command-line interface
│   ├── dashboard/      # Web dashboard
│   ├── integrations/   # Framework integrations
│   └── plugins/        # CI/CD plugins
├── examples/           # Example projects
├── docs/              # Documentation
└── tests/             # End-to-end tests
```

### Working on Packages

This is a monorepo using npm workspaces and Turbo. To work on a specific package:

```bash
# Build a specific package
cd packages/core
npm run build

# Run tests for a specific package
npm test

# Watch mode for development
npm run dev
```

### Running Examples

```bash
cd examples/customer-support-agent
npm install
npm test
```

## Commit Message Guidelines

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types

- `feat`: A new feature
- `fix`: A bug fix
- `docs`: Documentation only changes
- `style`: Code style changes (formatting, etc)
- `refactor`: Code change that neither fixes a bug nor adds a feature
- `perf`: Performance improvements
- `test`: Adding or updating tests
- `chore`: Changes to build process or auxiliary tools

### Examples

```
feat(core): add multi-agent workflow testing

Implement support for testing collaborative agent workflows with
dependency tracking between agent steps.

Closes #123
```

```
fix(cli): handle missing config file gracefully

Previously, the CLI would crash when config file was missing.
Now it shows a helpful error message and suggests running init.

Fixes #456
```

## Code Style

- We use TypeScript for all code
- We use Prettier for code formatting
- We use ESLint for linting
- Run `npm run format` before committing
- Run `npm run lint` to check for issues

## Testing

- Write tests for all new features
- Maintain or improve code coverage
- Run `npm test` to run the full test suite
- Run `npm run test:watch` for watch mode

### Test Structure

```typescript
describe('TestRunner', () => {
  it('should run a single test case', async () => {
    const runner = new TestRunner();
    const result = await runner.runTest(testCase, config);
    expect(result.validation.passed).toBe(true);
  });
});
```

## Documentation

- Update README.md if adding new features
- Add JSDoc comments for public APIs
- Update examples if behavior changes
- Keep CHANGELOG.md updated

## Release Process

(For maintainers only)

1. Update version in package.json files
2. Update CHANGELOG.md
3. Create a git tag
4. Push to GitHub
5. Publish to npm
6. Create GitHub release

## Community

- Join our [Discord](https://discord.gg/CjeXJxfSQ8)
- Follow us on [X/Twitter](https://x.com/justcopy_ai)
- Visit [JustCopy.ai](https://justcopy.ai)

## Questions?

Don't hesitate to reach out:
- Open an issue with the `question` label
- Ask in our [Discord](https://discord.gg/CjeXJxfSQ8)
- Email us at [hello@bagula.ai](mailto:hello@bagula.ai)

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.

---

Thank you for contributing to Bagula! 🧪
