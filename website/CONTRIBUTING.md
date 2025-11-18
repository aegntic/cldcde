# Contributing to SOTA Template Suite

**ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ**
**ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ ae.ˡᵗᵈ**

Thank you for your interest in contributing to the SOTA Template Suite! We welcome contributions from the community and are committed to making the contribution process as smooth as possible.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Development Setup](#development-setup)
3. [Contributing Guidelines](#contributing-guidelines)
4. [Code Standards](#code-standards)
5. [Performance Requirements](#performance-requirements)
6. [Testing](#testing)
7. [Documentation](#documentation)
8. [Pull Request Process](#pull-request-process)
9. [Release Process](#release-process)

## Getting Started

### Prerequisites

- **Node.js**: v18.0.0 or higher
- **Bun**: v1.0.0 or higher (recommended)
- **Git**: v2.30.0 or higher
- **GitHub Account**: With two-factor authentication enabled

### Development Workflow

1. **Fork the repository**
2. **Clone your fork locally**
3. **Create a feature branch**
4. **Make your changes**
5. **Test thoroughly**
6. **Submit a pull request**

## Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/SOTA-suite.git
cd SOTA-suite

# Add upstream remote
git remote add upstream https://github.com/aegntic/SOTA-suite.git

# Install dependencies
bun install

# Run development server
bun run dev

# Run tests
bun test

# Build project
bun run build
```

## Contributing Guidelines

### What We Welcome

- **Performance optimizations** with measurable improvements
- **New modules** that extend functionality
- **Bug fixes** with comprehensive tests
- **Documentation improvements** and examples
- **Accessibility enhancements**
- **Security improvements**

### What We Don't Accept

- **Features without performance consideration**
- **Code that violates solid design principles**
- **Changes that introduce breaking API changes without proper deprecation**
- **Documentation without code examples**
- **Code without tests**

### Performance Requirements

All contributions must meet or exceed our performance standards:

- **Core Web Vitals**: LCP < 2.5s, CLS < 0.1, INP < 200ms
- **Bundle Size**: No significant increases without justification
- **Runtime Performance**: 60fps animations, <16ms frame time
- **Memory Usage**: No memory leaks, efficient garbage collection

## Code Standards

### TypeScript Requirements

```typescript
// Use strict TypeScript configuration
export interface SOTAModule {
  name: string;
  version: string;
  initialize(config?: ModuleConfig): Promise<void>;
  destroy(): void;
  getStatus(): ModuleStatus;
}

// Always include JSDoc comments
/**
 * Performance monitoring module for Core Web Vitals
 */
export class PerformanceMonitor {
  // Implementation
}
```

### Solid Design Principles

- **No gradients** in UI components
- **No glassmorphism** effects
- **Solid colors** with depth through shadows
- **Monospace fonts** for headings/titles
- **Professional aesthetics** only

### File Organization

```
src/
├── core/           # Core functionality
├── modules/        # Individual modules
├── types/          # Type definitions
├── utils/          # Utility functions
└── examples/       # Usage examples
```

## Testing Requirements

### Unit Tests

```typescript
import { SOTATemplate } from '../src/template';

describe('SOTATemplate', () => {
  test('should initialize with performance monitoring', async () => {
    const template = new SOTATemplate({
      performance: { enableRealTimeMonitoring: true }
    });

    await template.initialize();
    expect(template.getStatus()).toBe('ready');
  });
});
```

### Performance Tests

```typescript
import { performance } from 'perf_hooks';

describe('Performance', () => {
  test('should meet LCP target', async () => {
    const start = performance.now();
    // Test code here
    const end = performance.now();

    expect(end - start).toBeLessThan(2500); // LCP target
  });
});
```

### Coverage Requirements

- **Minimum coverage**: 90%
- **Critical paths**: 100% coverage
- **Performance-critical code**: 100% coverage

## Documentation Requirements

### JSDoc Documentation

```typescript
/**
 * Creates a scroll-triggered animation
 * @param config - Animation configuration
 * @param config.target - Target element or selector
 * @param config.start - Scroll trigger start position
 * @param config.end - Scroll trigger end position
 * @param config.animation - Animation properties
 * @returns Promise resolving to animation instance
 * @example
 * ```typescript
 * const animation = await createAnimation({
 *   target: '.my-element',
 *   start: 'top 80%',
 *   end: 'bottom 20%',
 *   animation: { opacity: { from: 0, to: 1 } }
 * });
 * ```
 */
export async function createAnimation(config: AnimationConfig): Promise<Animation>;
```

### README Requirements

Every module must include:
- **Description** of functionality
- **Installation instructions**
- **Usage examples**
- **Performance characteristics**
- **API documentation**

## Pull Request Process

### Before Submitting

1. **Create a feature branch** from `main`:
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Ensure your code follows all standards**:
   ```bash
   bun run lint
   bun run type-check
   bun run test
   bun run build
   ```

3. **Update documentation** and examples

4. **Test performance impact**:
   ```bash
   bun run test:performance
   ```

### Pull Request Template

```markdown
## Description
Brief description of changes

## Performance Impact
- Core Web Vitals: [LCP/CLS/INP impact]
- Bundle size: [+/- KB]
- Runtime: [ms impact]

## Testing
- [ ] Unit tests pass
- [ ] Performance tests pass
- [ ] Manual testing completed
- [ ] Cross-browser testing completed

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] Examples provided
- [ ] Tests included
```

### Review Process

1. **Automated checks**: CI/CD pipeline validates requirements
2. **Performance review**: Core Web Vitals impact assessment
3. **Code review**: Technical review by maintainers
4. **Design review**: Solid design principles compliance
5. **Documentation review**: Completeness and accuracy

## Release Process

### Version Management

- **Semantic versioning**: MAJOR.MINOR.PATCH
- **Breaking changes**: Require major version bump
- **New features**: Minor version bump
- **Bug fixes**: Patch version bump

### Release Checklist

- [ ] All tests pass
- [ ] Documentation updated
- [ ] Performance benchmarks meet targets
- [ ] Changelog updated
- [ ] Security review completed
- [ ] License headers included
- [ ] GitHub release created

## Getting Help

### Community Support

- **GitHub Discussions**: Ask questions and share ideas
- **Issues**: Report bugs and request features
- **Discord**: Real-time community support

### Maintainer Support

For maintainer-specific questions:
- **Email**: maintainers@aegntic.ai
- **Slack**: #sota-suite-maintainers

## Recognition

Contributors are recognized in multiple ways:

- **GitHub contributors list**: Automatic inclusion
- **Release notes**: Mentioned for significant contributions
- **Documentation**: Attribution in relevant sections
- **Community spotlight**: Featured in blog posts

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please read our [Code of Conduct](CODE_OF_CONDUCT.md) for more information.

## Security

For security-related concerns:

- **Do not open public issues**
- **Email**: security@aegntic.ai
- **PGP Key**: Available on request

---

Thank you for contributing to the SOTA Template Suite! Your contributions help make web development faster, more performant, and more enjoyable for everyone.

*ᵖᵒʷᵉʳᵉᵈ ᵇʸ ᵃᵉᵍⁿᵗᶦᶜ ᵉᶜᵒˢʸˢᵗᵉᵐˢ*
*ʳᵘᵗʰˡᵉˢˢˡʸ ᵈᵉᵛᵉˡᵒᵖᵉᵈ ᵇʸ ae.ˡᵗᵈ*