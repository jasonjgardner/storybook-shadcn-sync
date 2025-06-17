# Contributing to Storybook to shadcn/ui Sync Tool

Thank you for your interest in contributing to the Storybook to shadcn/ui Sync Tool! This document provides guidelines and information for contributors.

## 🚀 Getting Started

### Prerequisites

- Node.js 16 or higher
- npm or yarn
- Git
- TypeScript knowledge
- Familiarity with Storybook and shadcn/ui

### Development Setup

1. **Fork and Clone**

   ```bash
   git clone https://github.com/jasonjgardner/storybook-shadcn-sync.git
   cd storybook-shadcn-sync
   ```

2. **Install Dependencies**

   ```bash
   npm install
   ```

3. **Build the Project**

   ```bash
   npm run build
   ```

4. **Run Tests**

   ```bash
   npm test
   ```

5. **Test CLI Locally**
   ```bash
   npm link
   storybook-sync --help
   ```

## 🏗️ Project Structure

```
storybook-shadcn-sync/
├── src/
│   ├── cli/                 # CLI commands and interface
│   ├── parser/              # Story file parsing logic
│   ├── analyzer/            # Component analysis and orchestration
│   ├── generator/           # Registry generation logic
│   ├── config/              # Configuration and schemas
│   ├── types/               # TypeScript type definitions
│   ├── utils/               # Utility functions
│   └── test/                # Test files
├── examples/
│   └── demo-project/        # Demo project for testing
├── docs/                    # Documentation
├── dist/                    # Compiled JavaScript (generated)
└── package.json
```

## 🧪 Testing

### Running Tests

```bash
# All tests
npm test

# Unit tests only
npm run test:unit

# Integration tests only
npm run test:integration

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage
```

### Test Categories

1. **Unit Tests** - Test individual functions and classes
2. **Integration Tests** - Test complete workflows with file system
3. **CLI Tests** - Test command-line interface end-to-end
4. **Schema Tests** - Test validation schemas

### Writing Tests

- Use Jest for testing framework
- Place tests in `src/test/` or alongside source files with `.test.ts` suffix
- Follow existing test patterns and naming conventions
- Include both positive and negative test cases
- Mock external dependencies appropriately

Example test structure:

```typescript
describe('ComponentAnalyzer', () => {
  describe('analyzeComponent', () => {
    it('should analyze component complexity correctly', async () => {
      // Test implementation
    });

    it('should handle missing component gracefully', async () => {
      // Error case test
    });
  });
});
```

## 🔧 Development Guidelines

### Code Style

- Use TypeScript for all new code
- Follow existing code formatting (Prettier configuration)
- Use ESLint rules (see `.eslintrc.js`)
- Write descriptive variable and function names
- Add JSDoc comments for public APIs

### Commit Messages

Follow conventional commit format:

```
type(scope): description

[optional body]

[optional footer]
```

Types:

- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes
- `refactor`: Code refactoring
- `test`: Test additions or changes
- `chore`: Build process or auxiliary tool changes

Examples:

```
feat(parser): add support for CSF 3.0 story format
fix(generator): handle object descriptions in story metadata
docs(readme): update installation instructions
test(integration): add tests for CLI commands
```

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring

### Pull Request Process

1. **Create Feature Branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Changes**

   - Write code following guidelines
   - Add tests for new functionality
   - Update documentation if needed

3. **Test Changes**

   ```bash
   npm test
   npm run build
   npm run lint
   ```

4. **Commit Changes**

   ```bash
   git add .
   git commit -m "feat(scope): description"
   ```

5. **Push and Create PR**

   ```bash
   git push origin feature/your-feature-name
   ```

6. **PR Requirements**
   - Clear description of changes
   - Link to related issues
   - All tests passing
   - Code review approval

## 🐛 Bug Reports

### Before Reporting

1. Check existing issues
2. Test with latest version
3. Reproduce with minimal example
4. Check troubleshooting guide

### Bug Report Template

```markdown
**Bug Description**
Clear description of the bug

**Steps to Reproduce**

1. Step one
2. Step two
3. Step three

**Expected Behavior**
What should happen

**Actual Behavior**
What actually happens

**Environment**

- Node.js version:
- Tool version:
- Operating System:
- Storybook version:

**Additional Context**

- Configuration file
- Sample story files
- Error messages
- Debug output
```

## 💡 Feature Requests

### Before Requesting

1. Check existing feature requests
2. Consider if it fits project scope
3. Think about implementation approach
4. Consider backward compatibility

### Feature Request Template

```markdown
**Feature Description**
Clear description of the proposed feature

**Use Case**
Why is this feature needed?

**Proposed Solution**
How should this feature work?

**Alternatives Considered**
Other approaches you've considered

**Additional Context**
Any other relevant information
```

## 📝 Documentation

### Types of Documentation

1. **API Documentation** - Function and class documentation
2. **User Guide** - How-to guides and tutorials
3. **Troubleshooting** - Common issues and solutions
4. **Examples** - Working code examples

### Documentation Guidelines

- Write clear, concise explanations
- Include code examples
- Update documentation with code changes
- Use proper Markdown formatting
- Test examples to ensure they work

### Building Documentation

```bash
# Generate API docs (if configured)
npm run docs:api

# Build all documentation
npm run docs:build
```

## 🔄 Release Process

### Version Numbering

Follow Semantic Versioning (SemVer):

- `MAJOR.MINOR.PATCH`
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes (backward compatible)

### Release Steps

1. **Update Version**

   ```bash
   npm version patch|minor|major
   ```

2. **Update Changelog**

   - Add new version section
   - List all changes since last release
   - Follow Keep a Changelog format

3. **Create Release PR**

   - Update version in package.json
   - Update CHANGELOG.md
   - Update README if needed

4. **Tag and Release**

   ```bash
   git tag v1.0.0
   git push origin v1.0.0
   ```

5. **Publish to npm**
   ```bash
   npm publish
   ```

## 🏷️ Issue Labels

- `bug` - Something isn't working
- `enhancement` - New feature or request
- `documentation` - Improvements or additions to docs
- `good first issue` - Good for newcomers
- `help wanted` - Extra attention is needed
- `question` - Further information is requested
- `wontfix` - This will not be worked on

## 🤝 Code of Conduct

### Our Pledge

We pledge to make participation in our project a harassment-free experience for everyone, regardless of age, body size, disability, ethnicity, gender identity and expression, level of experience, nationality, personal appearance, race, religion, or sexual identity and orientation.

### Our Standards

**Positive behavior includes:**

- Using welcoming and inclusive language
- Being respectful of differing viewpoints
- Gracefully accepting constructive criticism
- Focusing on what is best for the community
- Showing empathy towards other community members

**Unacceptable behavior includes:**

- Trolling, insulting/derogatory comments, and personal attacks
- Public or private harassment
- Publishing others' private information without permission
- Other conduct which could reasonably be considered inappropriate

### Enforcement

Project maintainers are responsible for clarifying standards and taking appropriate action in response to unacceptable behavior.

### Types of Contributions

We value all types of contributions:

- Code contributions
- Documentation improvements
- Bug reports
- Feature suggestions
- Testing and feedback
- Community support

## 📋 Checklist for Contributors

Before submitting a contribution:

- [ ] Code follows project style guidelines
- [ ] Tests are written and passing
- [ ] Documentation is updated
- [ ] Commit messages follow convention
- [ ] PR description is clear and complete
- [ ] All CI checks are passing
- [ ] Code is reviewed by maintainer

Thank you for contributing to the Storybook to shadcn/ui Sync Tool! Your contributions help make this tool better for everyone.
