# User Guide: Storybook to shadcn/ui Sync Tool

## Introduction

The Storybook to shadcn/ui Sync Tool is a powerful utility that bridges the gap between Storybook component documentation and the shadcn/ui component registry format. This tool automatically analyzes your Storybook stories and generates properly formatted registry files that can be used with the shadcn/ui CLI or published as a custom component registry.

## Why Use This Tool?

### The Problem

Modern React development often involves maintaining components in multiple formats and locations. Teams typically have:

- **Storybook stories** for component documentation and testing
- **Component libraries** with reusable UI components  
- **Design systems** that need to be shared across projects
- **Registry formats** required by tools like shadcn/ui

Manually maintaining consistency between these different representations is time-consuming and error-prone. When you update a component, you need to remember to update the story, the documentation, the registry entry, and any examples.

### The Solution

This tool automates the synchronization process by:

1. **Parsing Storybook stories** to extract component metadata, props, and usage examples
2. **Analyzing component complexity** and automatically categorizing components
3. **Generating shadcn/ui registry format** with proper file structures and dependencies
4. **Creating documentation** with usage examples derived from your stories
5. **Validating output** to ensure compatibility with shadcn/ui tooling

## Installation

### Prerequisites

Before installing the tool, ensure you have:

- **Node.js 16+** installed on your system
- **TypeScript project** with Storybook already configured
- **Component Story Format (CSF)** stories (CSF 2.0 or 3.0)

### Install via npm

```bash
npm install -g storybook-shadcn-sync
```

### Install as Development Dependency

```bash
npm install --save-dev storybook-shadcn-sync
```

### Verify Installation

```bash
storybook-sync --version
```

## Quick Start

### 1. Initialize Your Project

Navigate to your project directory and run the initialization command:

```bash
storybook-sync init
```

This command will:
- Detect your existing Storybook and component directories
- Create a `storybook-sync.config.json` configuration file
- Set up default mapping rules for component classification

### 2. Review Configuration

Open the generated `storybook-sync.config.json` file and review the settings:

```json
{
  "input": {
    "storybookPath": "./src/stories",
    "storiesPattern": "**/*.stories.@(js|jsx|ts|tsx)",
    "componentsPath": "./src/components",
    "tsconfigPath": "./tsconfig.json"
  },
  "output": {
    "registryPath": "./registry",
    "registryName": "my-components"
  },
  "mapping": {
    "componentTypeRules": [
      {
        "pattern": "**/ui/**",
        "type": "registry:ui"
      },
      {
        "pattern": "**/blocks/**", 
        "type": "registry:block"
      }
    ],
    "dependencyMapping": {},
    "excludePatterns": ["**/node_modules/**", "**/dist/**"]
  },
  "generation": {
    "generateIndividualItems": true,
    "includeStoryExamples": true,
    "validateOutput": true
  }
}
```

### 3. Validate Your Setup

Before running the sync, validate that everything is configured correctly:

```bash
storybook-sync validate
```

This will check:
- Whether your Storybook and component directories exist
- If your story files are in valid CSF format
- Whether the output directory is writable
- If your TypeScript configuration is accessible

### 4. Run Your First Sync

Execute the sync command to generate your registry:

```bash
storybook-sync sync --validate --examples
```

This will:
- Parse all your story files
- Analyze component complexity and dependencies
- Generate registry.json and individual component files
- Create usage examples and documentation
- Validate the output against shadcn/ui schemas

### 5. Review Generated Output

Check the `./registry` directory (or your configured output path) for:

- **registry.json** - Main registry file listing all components
- **Individual component files** - Separate JSON files for each component
- **examples/** - Generated documentation and usage examples

## Configuration Guide

### Input Configuration

The `input` section defines where the tool should look for your source files.

#### storybookPath

Path to your Storybook files directory.

```json
{
  "input": {
    "storybookPath": "./src/stories"
  }
}
```

**Common patterns:**
- `./src/stories` - Stories in src/stories directory
- `./stories` - Stories in root stories directory  
- `./src` - Stories mixed with components

#### storiesPattern

Glob pattern to match story files.

```json
{
  "input": {
    "storiesPattern": "**/*.stories.@(js|jsx|ts|tsx)"
  }
}
```

**Common patterns:**
- `**/*.stories.@(js|jsx|ts|tsx)` - All story files
- `**/*.stories.tsx` - Only TypeScript React stories
- `**/!(*.test).stories.*` - Exclude test stories

#### componentsPath

Path to your component source files.

```json
{
  "input": {
    "componentsPath": "./src/components"
  }
}
```

This helps the tool locate component source code for dependency analysis.

#### tsconfigPath

Path to your TypeScript configuration file.

```json
{
  "input": {
    "tsconfigPath": "./tsconfig.json"
  }
}
```

Used for enhanced TypeScript parsing and module resolution.

### Output Configuration

The `output` section defines where and how to generate registry files.

#### registryPath

Directory where registry files will be generated.

```json
{
  "output": {
    "registryPath": "./registry"
  }
}
```

#### registryName

Name of your component registry.

```json
{
  "output": {
    "registryName": "my-design-system"
  }
}
```

This appears in the generated registry.json file.

#### homepage

Optional homepage URL for your registry.

```json
{
  "output": {
    "homepage": "https://my-design-system.com"
  }
}
```

### Mapping Configuration

The `mapping` section controls how components are classified and dependencies are resolved.

#### componentTypeRules

Rules for determining component registry types based on file paths.

```json
{
  "mapping": {
    "componentTypeRules": [
      {
        "pattern": "**/ui/**",
        "type": "registry:ui"
      },
      {
        "pattern": "**/blocks/**",
        "type": "registry:block"
      },
      {
        "pattern": "**/hooks/**",
        "type": "registry:hook"
      },
      {
        "pattern": "**/lib/**",
        "type": "registry:lib"
      }
    ]
  }
}
```

**Available types:**
- `registry:ui` - Basic UI components (buttons, inputs, etc.)
- `registry:component` - Complex components
- `registry:block` - Composed blocks/templates
- `registry:hook` - React hooks
- `registry:lib` - Utility libraries

#### dependencyMapping

Map internal dependencies to registry dependencies.

```json
{
  "mapping": {
    "dependencyMapping": {
      "@my/design-tokens": "@shadcn/ui",
      "@my/utils": "utils",
      "internal-component": "button"
    }
  }
}
```

#### excludePatterns

Patterns for files to exclude from processing.

```json
{
  "mapping": {
    "excludePatterns": [
      "**/node_modules/**",
      "**/dist/**",
      "**/*.test.*",
      "**/*.spec.*"
    ]
  }
}
```

### Generation Configuration

The `generation` section controls output generation options.

#### generateIndividualItems

Whether to generate individual JSON files for each component.

```json
{
  "generation": {
    "generateIndividualItems": true
  }
}
```

When `true`, creates separate files like `button.json`, `input.json`, etc.

#### includeStoryExamples

Whether to generate usage examples from stories.

```json
{
  "generation": {
    "includeStoryExamples": true
  }
}
```

Creates documentation with code examples derived from your story args.

#### validateOutput

Whether to validate generated output against schemas.

```json
{
  "generation": {
    "validateOutput": true
  }
}
```

Ensures compatibility with shadcn/ui tooling.

## Command Reference

### init Command

Initialize a new project with configuration.

```bash
storybook-sync init [options]
```

**Options:**
- `--force` - Overwrite existing configuration
- `--template <name>` - Use specific template
- `--storybook-path <path>` - Custom Storybook directory
- `--components-path <path>` - Custom components directory  
- `--output-path <path>` - Custom output directory

**Examples:**

```bash
# Basic initialization
storybook-sync init

# Force overwrite existing config
storybook-sync init --force

# Custom paths
storybook-sync init --storybook-path ./stories --output-path ./dist/registry
```

### sync Command

Synchronize stories to registry format.

```bash
storybook-sync sync [options]
```

**Options:**
- `--watch` - Watch for file changes (coming soon)
- `--incremental` - Only process changed files
- `--validate` - Validate output after sync
- `--examples` - Generate usage examples
- `--config <path>` - Custom configuration file

**Examples:**

```bash
# Basic sync
storybook-sync sync

# Sync with validation and examples
storybook-sync sync --validate --examples

# Incremental sync (only changed files)
storybook-sync sync --incremental

# Use custom config
storybook-sync sync --config ./custom-config.json
```

### export Command

Export stories to registry format without full sync workflow.

```bash
storybook-sync export [options]
```

**Options:**
- `--format <type>` - Output format: `registry` or `individual`
- `--include-examples` - Include story examples
- `--output <path>` - Custom output directory
- `--config <path>` - Custom configuration file

**Examples:**

```bash
# Export as single registry file
storybook-sync export --format registry

# Export as individual component files
storybook-sync export --format individual

# Export with examples to custom directory
storybook-sync export --include-examples --output ./dist/components
```

### validate Command

Validate configuration and project setup.

```bash
storybook-sync validate [options]
```

**Options:**
- `--fix` - Automatically fix issues (coming soon)
- `--report-format <type>` - Report format: `text`, `json`, or `html`
- `--config <path>` - Custom configuration file

**Examples:**

```bash
# Basic validation
storybook-sync validate

# JSON output for CI/CD
storybook-sync validate --report-format json

# Validate custom config
storybook-sync validate --config ./custom-config.json
```

## Story Format Requirements

### Component Story Format (CSF)

Your stories must follow the Component Story Format specification. Both CSF 2.0 and CSF 3.0 are supported.

#### CSF 3.0 Example (Recommended)

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: 'A versatile button component with multiple variants.',
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary', 'destructive'],
      description: 'The visual style variant',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'The size of the button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button', 
    variant: 'secondary',
  },
};
```

#### CSF 2.0 Example (Legacy Support)

```typescript
import { Button } from './Button';

export default {
  title: 'Components/Button',
  component: Button,
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary'],
    },
  },
};

export const Primary = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
  },
};
```

### Required Metadata

For optimal results, include these metadata elements in your stories:

#### Component Title

```typescript
const meta: Meta<typeof Button> = {
  title: 'Components/Button', // Used for categorization
  // ...
};
```

#### Component Reference

```typescript
const meta: Meta<typeof Button> = {
  component: Button, // Links to actual component
  // ...
};
```

#### Documentation

```typescript
const meta: Meta<typeof Button> = {
  parameters: {
    docs: {
      description: 'Component description for registry',
    },
  },
  // ...
};
```

#### Prop Documentation

```typescript
const meta: Meta<typeof Button> = {
  argTypes: {
    variant: {
      description: 'The visual style variant',
      control: { type: 'select' },
      options: ['primary', 'secondary'],
    },
    // ...
  },
  // ...
};
```

### Best Practices

#### Use Descriptive Story Names

```typescript
// Good
export const PrimaryButton: Story = { /* ... */ };
export const SecondaryButton: Story = { /* ... */ };
export const SmallButton: Story = { /* ... */ };

// Avoid
export const Story1: Story = { /* ... */ };
export const Default: Story = { /* ... */ };
```

#### Provide Comprehensive Args

```typescript
export const CompleteExample: Story = {
  args: {
    children: 'Click me',
    variant: 'primary',
    size: 'md',
    disabled: false,
    onClick: () => alert('Clicked!'),
  },
};
```

#### Include Edge Cases

```typescript
export const DisabledState: Story = {
  args: {
    children: 'Disabled Button',
    disabled: true,
  },
};

export const LongText: Story = {
  args: {
    children: 'This is a button with very long text that might wrap',
  },
};
```

## Integration Workflows

### CI/CD Integration

#### GitHub Actions Example

```yaml
name: Sync Storybook to Registry

on:
  push:
    branches: [main]
    paths: ['src/stories/**', 'src/components/**']

jobs:
  sync:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Sync stories to registry
        run: npx storybook-sync sync --validate --examples
        
      - name: Upload registry artifacts
        uses: actions/upload-artifact@v3
        with:
          name: component-registry
          path: registry/
```

#### Validation in Pull Requests

```yaml
name: Validate Registry Sync

on:
  pull_request:
    paths: ['src/stories/**', 'src/components/**']

jobs:
  validate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Validate configuration
        run: npx storybook-sync validate --report-format json
        
      - name: Test sync process
        run: npx storybook-sync sync --validate
```

### Package.json Scripts

Add convenient scripts to your package.json:

```json
{
  "scripts": {
    "registry:sync": "storybook-sync sync --validate --examples",
    "registry:export": "storybook-sync export --format registry --include-examples",
    "registry:validate": "storybook-sync validate",
    "registry:init": "storybook-sync init --force"
  }
}
```

### Pre-commit Hooks

Use tools like Husky to validate before commits:

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "storybook-sync validate && lint-staged"
    }
  }
}
```

### Development Workflow

#### 1. Component Development

```bash
# Create new component
mkdir src/components/NewComponent
touch src/components/NewComponent/NewComponent.tsx
touch src/stories/NewComponent.stories.tsx

# Develop component and stories
# ...

# Validate as you go
npm run registry:validate
```

#### 2. Story Updates

```bash
# Update stories
# ...

# Sync changes
npm run registry:sync

# Review generated output
ls registry/
```

#### 3. Release Process

```bash
# Final validation
npm run registry:validate

# Generate production registry
npm run registry:export

# Publish registry (if using npm)
cd registry && npm publish
```

## Troubleshooting

### Common Issues

#### "No story files found"

**Problem:** The tool can't find your story files.

**Solutions:**
1. Check your `storybookPath` configuration
2. Verify your `storiesPattern` matches your file naming
3. Ensure story files are in valid CSF format

```bash
# Debug file discovery
storybook-sync validate --report-format json
```

#### "Failed to parse story file"

**Problem:** Story file has syntax errors or invalid CSF format.

**Solutions:**
1. Validate TypeScript syntax: `npx tsc --noEmit`
2. Check for missing default export
3. Ensure meta object is properly typed

#### "Component not found"

**Problem:** Story references a component that can't be located.

**Solutions:**
1. Check import paths in story files
2. Verify `componentsPath` configuration
3. Ensure component files exist

#### "Registry validation failed"

**Problem:** Generated registry doesn't match shadcn/ui schema.

**Solutions:**
1. Check component naming (must be kebab-case)
2. Verify file content is valid
3. Review dependency mappings

### Debug Mode

Enable verbose logging for troubleshooting:

```bash
DEBUG=storybook-sync:* storybook-sync sync
```

### Configuration Validation

Test your configuration without running full sync:

```bash
storybook-sync validate --report-format json > validation-report.json
```

### File Permissions

Ensure the tool has proper file system permissions:

```bash
# Check directory permissions
ls -la registry/

# Fix permissions if needed
chmod -R 755 registry/
```

## Advanced Usage

### Custom Component Types

Define custom component classification rules:

```json
{
  "mapping": {
    "componentTypeRules": [
      {
        "pattern": "**/forms/**",
        "type": "registry:component"
      },
      {
        "pattern": "**/charts/**", 
        "type": "registry:block"
      },
      {
        "pattern": "**/utils/**",
        "type": "registry:lib"
      }
    ]
  }
}
```

### Dependency Mapping

Map internal dependencies to registry equivalents:

```json
{
  "mapping": {
    "dependencyMapping": {
      "@company/design-tokens": "@shadcn/ui",
      "@company/icons": "lucide-react",
      "internal-utils": "utils"
    }
  }
}
```

### Multiple Registries

Generate different registries for different purposes:

```bash
# UI components only
storybook-sync export --config ui-config.json --output ./ui-registry

# Block components only  
storybook-sync export --config blocks-config.json --output ./blocks-registry
```

### Incremental Updates

Process only recently changed files:

```bash
# Only files changed in last 24 hours
storybook-sync sync --incremental

# Custom time threshold (requires manual scripting)
storybook-sync sync --incremental --since "2024-01-01"
```

### Custom Templates

Create reusable configuration templates:

```json
// templates/ui-library.json
{
  "input": {
    "storybookPath": "./src/stories",
    "storiesPattern": "**/*.stories.tsx",
    "componentsPath": "./src/components"
  },
  "output": {
    "registryPath": "./dist/registry",
    "registryName": "ui-library"
  },
  "mapping": {
    "componentTypeRules": [
      { "pattern": "**/ui/**", "type": "registry:ui" }
    ]
  }
}
```

```bash
storybook-sync init --template ./templates/ui-library.json
```

## Best Practices

### Story Organization

#### Hierarchical Structure

```
src/stories/
├── components/
│   ├── Button.stories.tsx
│   ├── Input.stories.tsx
│   └── Select.stories.tsx
├── blocks/
│   ├── LoginForm.stories.tsx
│   └── SearchBar.stories.tsx
└── hooks/
    ├── useLocalStorage.stories.tsx
    └── useDebounce.stories.tsx
```

#### Consistent Naming

```typescript
// Good: Descriptive and consistent
export const PrimaryButton: Story = { /* ... */ };
export const SecondaryButton: Story = { /* ... */ };
export const DisabledButton: Story = { /* ... */ };

// Avoid: Generic names
export const Default: Story = { /* ... */ };
export const Story1: Story = { /* ... */ };
```

### Component Documentation

#### Rich Descriptions

```typescript
const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: `
        A versatile button component that supports multiple variants,
        sizes, and states. Built with accessibility in mind and 
        follows the design system guidelines.
      `,
    },
  },
};
```

#### Comprehensive ArgTypes

```typescript
const meta: Meta<typeof Button> = {
  argTypes: {
    variant: {
      description: 'Visual style variant of the button',
      control: { type: 'select' },
      options: ['primary', 'secondary', 'destructive'],
      table: {
        defaultValue: { summary: 'primary' },
        type: { summary: 'string' },
      },
    },
    size: {
      description: 'Size of the button affecting padding and font size',
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
    },
    disabled: {
      description: 'Whether the button is disabled',
      control: { type: 'boolean' },
    },
  },
};
```

### Registry Optimization

#### Minimize Dependencies

```typescript
// Good: Only necessary dependencies
dependencies: ['react', 'clsx']

// Avoid: Excessive dependencies
dependencies: ['react', 'lodash', 'moment', 'axios', 'styled-components']
```

#### Proper File Organization

```
registry/
├── registry.json           # Main registry file
├── button.json            # Individual components
├── input.json
├── examples/              # Generated documentation
│   ├── button.md
│   └── input.md
└── components/            # Optional: actual component files
    ├── button.tsx
    └── input.tsx
```

### Performance Optimization

#### Exclude Unnecessary Files

```json
{
  "mapping": {
    "excludePatterns": [
      "**/node_modules/**",
      "**/dist/**",
      "**/*.test.*",
      "**/*.spec.*",
      "**/coverage/**",
      "**/.storybook/**"
    ]
  }
}
```

#### Use Incremental Processing

```bash
# For large projects, use incremental updates
storybook-sync sync --incremental
```

#### Optimize Story Files

```typescript
// Good: Focused stories
export const Primary: Story = {
  args: { variant: 'primary', children: 'Primary' },
};

// Avoid: Overly complex stories
export const ComplexScenario: Story = {
  args: { /* 50+ properties */ },
  parameters: { /* complex setup */ },
  decorators: [/* multiple decorators */],
};
```

This comprehensive user guide provides everything needed to successfully implement and use the Storybook to shadcn/ui sync tool in real-world projects. The tool streamlines the workflow between component development, documentation, and registry management, making it easier to maintain consistent design systems across teams and projects.

