# Storybook to shadcn/ui Sync Tool

A powerful CLI tool that automatically synchronizes Storybook Component Story Format (CSF) files with shadcn/ui registry format, enabling seamless integration between component documentation and registry-based component distribution.

## 🚀 Features

- **Automatic Story Parsing**: Extracts metadata from CSF 2.0 and 3.0 story files
- **Registry Generation**: Creates valid shadcn/ui registry.json and individual component files
- **Component Analysis**: Analyzes complexity, dependencies, and component characteristics
- **Example Generation**: Creates usage examples and documentation from stories
- **Schema Validation**: Ensures compatibility with shadcn/ui tooling
- **TypeScript Support**: Full TypeScript integration with AST-based parsing
- **CLI Interface**: Comprehensive command-line interface with multiple commands
- **Incremental Processing**: Only processes changed files for better performance
- **Flexible Configuration**: Customizable mapping rules and output formats

## 📦 Installation

### Global Installation

```bash
npm install -g storybook-shadcn-sync
```

### Project Installation

```bash
npm install --save-dev storybook-shadcn-sync
```

### Using npx

```bash
npx storybook-shadcn-sync init
```

## 🏃 Quick Start

### 1. Initialize Your Project

```bash
storybook-sync init
```

This creates a `storybook-sync.config.json` file with auto-detected settings.

### 2. Validate Setup

```bash
storybook-sync validate
```

### 3. Sync Stories to Registry

```bash
storybook-sync sync --validate --examples
```

### 4. Check Generated Output

```bash
ls registry/
# registry.json - Main registry file
# button.json, input.json, etc. - Individual component files
# examples/ - Generated documentation
```

## 📋 Requirements

- **Node.js 16+**
- **TypeScript project** with Storybook configured
- **Component Story Format (CSF)** stories
- **React components** (other frameworks coming soon)

## 🛠️ CLI Commands

### `init` - Initialize Project

```bash
storybook-sync init [options]

Options:
  --force                    Overwrite existing configuration
  --storybook-path <path>    Custom Storybook directory
  --components-path <path>   Custom components directory
  --output-path <path>       Custom output directory
```

### `sync` - Synchronize Stories

```bash
storybook-sync sync [options]

Options:
  --watch                    Watch for file changes (coming soon)
  --incremental              Only process changed files
  --validate                 Validate output after sync
  --examples                 Generate usage examples
  --config <path>            Custom configuration file
```

### `export` - Export Registry

```bash
storybook-sync export [options]

Options:
  --format <type>            Output format: registry|individual
  --include-examples         Include story examples
  --output <path>            Custom output directory
```

### `validate` - Validate Setup

```bash
storybook-sync validate [options]

Options:
  --report-format <type>     Report format: text|json|html
  --config <path>            Custom configuration file
```

## ⚙️ Configuration

### Basic Configuration

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
    "registryName": "my-components",
    "homepage": "https://my-components.com"
  },
  "mapping": {
    "componentTypeRules": [
      { "pattern": "**/ui/**", "type": "registry:ui" },
      { "pattern": "**/blocks/**", "type": "registry:block" }
    ],
    "dependencyMapping": {
      "@/lib/utils": "utils"
    },
    "excludePatterns": ["**/node_modules/**", "**/dist/**"]
  },
  "generation": {
    "generateIndividualItems": true,
    "includeStoryExamples": true,
    "validateOutput": true
  }
}
```

### Component Type Rules

Automatically classify components based on file paths:

```json
{
  "componentTypeRules": [
    { "pattern": "**/ui/**", "type": "registry:ui" },
    { "pattern": "**/blocks/**", "type": "registry:block" },
    { "pattern": "**/hooks/**", "type": "registry:hook" },
    { "pattern": "**/lib/**", "type": "registry:lib" }
  ]
}
```

### Dependency Mapping

Map internal dependencies to registry equivalents:

```json
{
  "dependencyMapping": {
    "@/components/ui/button": "button",
    "@/lib/utils": "utils",
    "internal-component": "registry-component"
  }
}
```

## 📖 Story Format Requirements

### CSF 3.0 (Recommended)

```typescript
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: {
        component: 'A versatile button component with multiple variants.',
      },
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary'],
      description: 'The visual style variant',
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
```

### CSF 2.0 (Legacy Support)

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

## 🎯 Use Cases

### Design System Maintenance

- **Sync component documentation** with registry format
- **Automate registry updates** when stories change
- **Generate examples** from existing stories
- **Validate consistency** across components

### Component Library Distribution

- **Publish registries** for easy component installation
- **Create custom registries** for internal use
- **Generate documentation** automatically
- **Maintain compatibility** with shadcn/ui tooling

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Sync Storybook to Registry
  run: |
    npm install -g storybook-shadcn-sync
    storybook-sync sync --validate --examples

- name: Upload Registry
  uses: actions/upload-artifact@v3
  with:
    name: component-registry
    path: registry/
```

## 📁 Generated Output

### Registry Structure

```
registry/
├── registry.json              # Main registry file
├── button.json               # Individual component files
├── input.json
├── card.json
└── examples/                 # Generated documentation
    ├── button.md
    ├── input.md
    └── card.md
```

### Registry Format

```json
{
  "$schema": "https://ui.shadcn.com/schema/registry.json",
  "name": "my-components",
  "homepage": "https://my-components.com",
  "items": [
    {
      "name": "button",
      "type": "registry:ui",
      "description": "A versatile button component",
      "files": [
        {
          "path": "registry/default/button/button.tsx",
          "type": "registry:ui"
        }
      ],
      "dependencies": ["react", "class-variance-authority"],
      "registryDependencies": ["utils"]
    }
  ]
}
```

## 🔧 Advanced Usage

### Programmatic API

```typescript
import { SyncOrchestrator, loadConfig } from 'storybook-shadcn-sync';

const config = await loadConfig('./storybook-sync.config.json');
const orchestrator = new SyncOrchestrator(config);

const result = await orchestrator.sync({
  validate: true,
  generateExamples: true,
});

console.log(`Generated ${result.items.length} components`);
```

### Custom Component Analysis

```typescript
import { ComponentAnalyzer, StorybookParser } from 'storybook-shadcn-sync';

const parser = new StorybookParser();
const analyzer = new ComponentAnalyzer();

const storyFile = await parser.parseStoryFile('./Button.stories.tsx');
const analysis = await analyzer.analyzeComponent(storyFile);

console.log(`Complexity Score: ${analysis.complexity.score}`);
```

### Multiple Registries

```bash
# Generate different registries for different purposes
storybook-sync export --config ui-config.json --output ./ui-registry
storybook-sync export --config blocks-config.json --output ./blocks-registry
```

## 🐛 Troubleshooting

### Common Issues

**No story files found**

- Check `storybookPath` and `storiesPattern` in configuration
- Verify story files are in valid CSF format

**Component not found**

- Check import paths in story files
- Verify `componentsPath` configuration

**Registry validation failed**

- Ensure component names are kebab-case
- Check for missing required story metadata

### Debug Mode

```bash
DEBUG=storybook-sync:* storybook-sync sync
```

### Validation

```bash
storybook-sync validate --report-format json > validation-report.json
```

## 📚 Documentation

- **[API Documentation](docs/API.md)** - Complete API reference
- **[User Guide](docs/USER_GUIDE.md)** - Comprehensive usage guide
- **[Troubleshooting](docs/TROUBLESHOOTING.md)** - Common issues and solutions
- **[Demo Project](examples/demo-project/)** - Working example

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

```bash
git clone https://github.com/your-org/storybook-shadcn-sync.git
cd storybook-shadcn-sync
npm install
npm run build
npm test
```

### Running Tests

```bash
npm test                    # Run all tests
npm run test:unit          # Unit tests only
npm run test:integration   # Integration tests only
npm run test:e2e          # End-to-end tests only
```

## 📄 License

MIT License - see [LICENSE](LICENSE) file for details.

---

![Made with Manus](docs/manus.png)
