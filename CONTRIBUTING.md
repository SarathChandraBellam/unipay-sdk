# Contributing to UniPay SDK

Thank you for your interest in contributing to UniPay SDK! This document provides guidelines for contributing to the project.

## Code of Conduct

This project adheres to a Code of Conduct. By participating, you are expected to uphold this code.

## How to Contribute

### Reporting Bugs

Before creating bug reports, please check existing issues to avoid duplicates. When creating a bug report, include:

- A clear, descriptive title
- Steps to reproduce the issue
- Expected behavior
- Actual behavior
- Environment details (Node version, OS, etc.)
- Code samples if applicable

### Suggesting Enhancements

Enhancement suggestions are welcome! Please provide:

- A clear, descriptive title
- Detailed description of the proposed feature
- Use cases and examples
- Why this enhancement would be useful

### Pull Requests

1. **Fork the repository** and create your branch from `main`
2. **Install dependencies**: `npm install`
3. **Make your changes** following our coding standards
4. **Add tests** for your changes
5. **Run tests**: `npm test`
6. **Run linter**: `npm run lint:fix`
7. **Build packages**: `npm run build`
8. **Commit your changes** using conventional commits format
9. **Push to your fork** and submit a pull request

#### Conventional Commits

We use conventional commits for clear commit history:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `test:` - Adding or updating tests
- `refactor:` - Code refactoring
- `perf:` - Performance improvements
- `chore:` - Maintenance tasks

Example: `feat: add webhook signature verification for Stripe`

### Adding a New Provider Adapter

To add support for a new payment provider:

1. Create a new package: `packages/adapter-<provider>`
2. Implement the `PaymentProvider` interface
3. Add tests for your adapter
4. Add documentation
5. Submit a pull request

See the [Adapter Template](./ADAPTER_TEMPLATE.md) for detailed instructions.

## Development Setup

### Prerequisites

- Node.js 18 or higher
- npm 9 or higher

### Setup

```bash
# Clone the repository
git clone https://github.com/SarathChandraBellam/unipay-sdk.git
cd unipay-sdk

# Install dependencies
npm install

# Build all packages
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

### Project Structure

```
unipay-sdk/
├── packages/
│   ├── core/             # Core SDK
│   ├── utils/            # Shared utilities
│   ├── adapter-stripe/   # Stripe adapter
│   ├── adapter-razorpay/ # Razorpay adapter
│   ├── adapter-paypal/   # PayPal adapter
│   └── client/           # Browser helpers
├── .github/              # GitHub workflows
└── ...
```

## Coding Standards

- Follow TypeScript strict mode
- Use ESLint and Prettier (run `npm run lint:fix` and `npm run format`)
- Write meaningful variable and function names
- Add JSDoc comments for public APIs
- Keep functions small and focused
- Avoid any types unless absolutely necessary

## Testing

- Write unit tests for all new features
- Maintain test coverage above 80%
- Use descriptive test names
- Follow AAA pattern: Arrange, Act, Assert
- Mock external dependencies

## Documentation

- Update README.md if adding features
- Add JSDoc comments for public APIs
- Include code examples
- Update CLAUDE.md if changing architecture

## Questions?

Feel free to open an issue for questions or join discussions.

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
