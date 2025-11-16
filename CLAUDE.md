# CLAUDE.md - UniPay SDK

## Repository Overview

This is the **UniPay SDK** repository - a software development kit for integrating with UniPay payment processing services.

**Current Status**: New repository - initial setup phase
**Repository**: unipay-sdk
**Last Updated**: 2025-11-16

## Project Purpose

The UniPay SDK is designed to provide developers with a simple, type-safe interface for integrating UniPay payment services into their applications. This SDK should support multiple programming languages and provide comprehensive documentation, examples, and testing utilities.

---

## Codebase Structure

### Recommended Organization

As this repository is in its initial phase, here's the recommended structure for development:

```
unipay-sdk/
├── src/                    # Source code
│   ├── client/            # Main SDK client implementation
│   ├── models/            # Data models and types
│   ├── services/          # Service-specific implementations
│   ├── utils/             # Utility functions
│   └── index.ts           # Main entry point
├── tests/                 # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── fixtures/         # Test data and fixtures
├── examples/             # Usage examples
├── docs/                 # Documentation
├── scripts/              # Build and utility scripts
├── package.json          # Dependencies and scripts
├── tsconfig.json         # TypeScript configuration
├── .eslintrc.js          # Linting rules
├── .prettierrc           # Code formatting
└── README.md             # User-facing documentation
```

### Key Directories

- **src/**: All production source code
- **tests/**: Comprehensive test coverage (aim for >80%)
- **examples/**: Working code examples for common use cases
- **docs/**: API documentation, guides, and tutorials

---

## Technology Stack

### Expected Technologies

Based on SDK best practices, this project should likely use:

- **Language**: TypeScript (for type safety and better DX)
- **Build Tool**: tsup, rollup, or esbuild
- **Testing**: Jest or Vitest
- **Linting**: ESLint with TypeScript support
- **Formatting**: Prettier
- **Package Manager**: npm, yarn, or pnpm
- **Documentation**: TypeDoc or similar

### Dependencies Philosophy

- Keep dependencies minimal to reduce bundle size
- Prefer well-maintained, widely-used packages
- Pin major versions to prevent breaking changes
- Use peer dependencies for common libraries

---

## Development Workflows

### Setting Up the Project

When initializing this repository, follow these steps:

1. **Initialize package.json**
   ```bash
   npm init -y
   ```

2. **Install TypeScript and build tools**
   ```bash
   npm install -D typescript tsup
   ```

3. **Set up testing framework**
   ```bash
   npm install -D vitest @vitest/ui
   ```

4. **Configure linting and formatting**
   ```bash
   npm install -D eslint prettier eslint-config-prettier
   ```

5. **Create initial directory structure**
   ```bash
   mkdir -p src/{client,models,services,utils} tests/{unit,integration} examples docs
   ```

### Git Workflow

- **Main Branch**: `main` or `master` - always production-ready
- **Feature Branches**: `feature/description` - for new features
- **Bug Fixes**: `fix/description` - for bug fixes
- **Claude Branches**: `claude/claude-md-*` - for AI-assisted development

### Branch Protection

- All changes should go through pull requests
- Require passing tests before merging
- Require code review for significant changes
- Use semantic versioning for releases

---

## Coding Conventions

### TypeScript Standards

1. **Strict Mode**: Enable strict TypeScript compiler options
   ```json
   {
     "compilerOptions": {
       "strict": true,
       "noImplicitAny": true,
       "strictNullChecks": true
     }
   }
   ```

2. **Naming Conventions**:
   - Classes: PascalCase (`PaymentClient`)
   - Interfaces: PascalCase with 'I' prefix optional (`IPaymentOptions` or `PaymentOptions`)
   - Functions: camelCase (`createPayment`)
   - Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
   - Files: kebab-case (`payment-client.ts`)

3. **Code Organization**:
   - One class/interface per file
   - Group related functionality together
   - Use barrel exports (index.ts) for cleaner imports

### Documentation Standards

1. **JSDoc Comments**: All public APIs must have JSDoc comments
   ```typescript
   /**
    * Creates a new payment transaction
    * @param options - Payment configuration options
    * @returns Promise resolving to payment result
    * @throws {PaymentError} When payment validation fails
    */
   export async function createPayment(options: PaymentOptions): Promise<PaymentResult> {
     // implementation
   }
   ```

2. **README**: Keep README.md up to date with:
   - Installation instructions
   - Quick start guide
   - Basic usage examples
   - Link to full documentation

3. **CHANGELOG**: Maintain a CHANGELOG.md following Keep a Changelog format

### Error Handling

1. **Custom Error Classes**: Create specific error types
   ```typescript
   export class PaymentError extends Error {
     constructor(
       message: string,
       public code: string,
       public statusCode?: number
     ) {
       super(message);
       this.name = 'PaymentError';
     }
   }
   ```

2. **Error Propagation**: Let errors bubble up, handle at appropriate level
3. **User-Friendly Messages**: Provide clear, actionable error messages

### Testing Standards

1. **Coverage**: Aim for >80% code coverage
2. **Test Structure**: Follow AAA pattern (Arrange, Act, Assert)
3. **Test Naming**: Descriptive names: `should return error when amount is negative`
4. **Mock External Dependencies**: Use mocks/stubs for API calls
5. **Integration Tests**: Test real-world scenarios end-to-end

---

## AI Assistant Guidelines

### When Working on This Codebase

1. **Always Check Existing Code First**
   - Read relevant files before making changes
   - Understand the existing patterns and follow them
   - Don't introduce inconsistent coding styles

2. **Type Safety is Critical**
   - Never use `any` type unless absolutely necessary
   - Provide proper type definitions for all functions
   - Use generics where appropriate for reusability

3. **Write Tests Alongside Code**
   - Create unit tests for new functions
   - Update tests when modifying existing code
   - Ensure all tests pass before committing

4. **Documentation is Required**
   - Add JSDoc comments to all public APIs
   - Update README.md if adding new features
   - Include code examples for complex functionality

5. **Security Considerations**
   - Never commit API keys, secrets, or credentials
   - Validate all inputs, especially payment amounts
   - Use secure methods for handling sensitive data
   - Implement rate limiting for API calls

6. **Performance**
   - Keep bundle size minimal
   - Use lazy loading where appropriate
   - Avoid unnecessary dependencies
   - Optimize for common use cases

7. **Commit Messages**
   - Use conventional commits format:
     - `feat: add payment verification endpoint`
     - `fix: correct amount validation logic`
     - `docs: update API documentation`
     - `test: add unit tests for refund service`
     - `refactor: simplify error handling`

8. **Before Pushing Code**
   - Run linter: `npm run lint`
   - Run tests: `npm test`
   - Build project: `npm run build`
   - Check for TypeScript errors: `npm run type-check`

### Common Tasks

#### Adding a New Feature

1. Create feature branch: `git checkout -b feature/feature-name`
2. Implement feature in `src/`
3. Add types/interfaces in `src/models/`
4. Write unit tests in `tests/unit/`
5. Add integration test in `tests/integration/`
6. Update documentation
7. Run all checks (lint, test, build)
8. Commit and push

#### Fixing a Bug

1. Create fix branch: `git checkout -b fix/bug-description`
2. Write failing test that reproduces the bug
3. Fix the bug
4. Ensure test passes
5. Check for regressions
6. Commit with descriptive message
7. Push changes

#### Updating Dependencies

1. Check for breaking changes in changelogs
2. Update package.json
3. Run `npm install`
4. Run full test suite
5. Update code if needed for breaking changes
6. Test examples to ensure they still work

---

## API Design Principles

### SDK Interface Design

1. **Simplicity First**: Make common tasks simple, complex tasks possible
2. **Consistent API**: Use consistent naming and patterns throughout
3. **Chainable Methods**: Support method chaining where it makes sense
4. **Sensible Defaults**: Provide good defaults, allow overrides
5. **Progressive Disclosure**: Simple interface with advanced options available

### Example SDK Client Structure

```typescript
// Recommended client structure
export class UniPayClient {
  constructor(config: UniPayConfig) {
    // Initialize with API key, environment, etc.
  }

  // Payment operations
  payments: {
    create(options: CreatePaymentOptions): Promise<Payment>;
    get(id: string): Promise<Payment>;
    list(filters?: PaymentFilters): Promise<Payment[]>;
    cancel(id: string): Promise<Payment>;
  };

  // Customer operations
  customers: {
    create(data: CustomerData): Promise<Customer>;
    get(id: string): Promise<Customer>;
    update(id: string, data: Partial<CustomerData>): Promise<Customer>;
  };

  // Webhook handling
  webhooks: {
    verify(payload: string, signature: string): boolean;
    parse(payload: string): WebhookEvent;
  };
}
```

### Configuration

```typescript
interface UniPayConfig {
  apiKey: string;
  environment?: 'sandbox' | 'production';
  timeout?: number;
  retryPolicy?: RetryPolicy;
  logger?: Logger;
}
```

---

## Testing Strategy

### Test Categories

1. **Unit Tests**: Test individual functions/classes in isolation
2. **Integration Tests**: Test interaction between components
3. **E2E Tests**: Test complete user workflows
4. **Contract Tests**: Ensure API contract compatibility

### Mock Data

- Store mock data in `tests/fixtures/`
- Create realistic test data that matches production scenarios
- Use factories/builders for generating test data

### Testing Checklist

- [ ] Happy path scenarios
- [ ] Error conditions and edge cases
- [ ] Input validation
- [ ] Timeout and retry logic
- [ ] Authentication and authorization
- [ ] Rate limiting
- [ ] Webhook signature verification

---

## Security Best Practices

1. **API Key Management**
   - Never hardcode API keys
   - Use environment variables
   - Provide clear documentation on key management

2. **Input Validation**
   - Validate all inputs on the client side
   - Sanitize data before sending to API
   - Use schema validation (e.g., Zod, Yup)

3. **HTTPS Only**
   - Always use HTTPS for API calls
   - Reject insecure connections in production

4. **Rate Limiting**
   - Implement client-side rate limiting
   - Handle 429 responses gracefully
   - Provide backoff strategies

5. **Sensitive Data**
   - Never log sensitive information
   - Mask credit card numbers, API keys in logs
   - Use PCI-compliant practices for payment data

---

## Release Process

### Versioning

Follow Semantic Versioning (semver):
- **MAJOR**: Breaking changes
- **MINOR**: New features, backwards compatible
- **PATCH**: Bug fixes, backwards compatible

### Release Checklist

1. [ ] All tests passing
2. [ ] Documentation updated
3. [ ] CHANGELOG.md updated
4. [ ] Version bumped in package.json
5. [ ] Git tag created
6. [ ] npm package published
7. [ ] Release notes created
8. [ ] Examples tested with new version

---

## Resources

### Documentation Links

- **TypeScript**: https://www.typescriptlang.org/docs/
- **Testing Best Practices**: https://testingjavascript.com/
- **Semantic Versioning**: https://semver.org/
- **Conventional Commits**: https://www.conventionalcommits.org/

### Internal Documentation

As the project grows, maintain these documents:
- API Reference (generated from JSDoc)
- Integration Guides
- Migration Guides (for breaking changes)
- Troubleshooting Guide
- FAQ

---

## Questions or Issues?

When encountering issues or needing clarification:

1. Check existing documentation in `/docs`
2. Review similar implementations in the codebase
3. Check test files for usage examples
4. Consult with repository maintainers
5. Document decisions in code comments

---

## Future Considerations

As the SDK matures, consider adding:

- [ ] Multiple language support (Python, Java, Go, etc.)
- [ ] CLI tool for testing
- [ ] Postman/OpenAPI collection
- [ ] Interactive documentation
- [ ] Code generation from OpenAPI spec
- [ ] Telemetry and analytics
- [ ] Performance benchmarks

---

**Note**: This document should be updated as the codebase evolves. Keep it synchronized with actual implementation details and architectural decisions.
