# Storybook to shadcn/ui Sync Tool

## API Documentation

### Table of Contents

1. [Core Classes](#core-classes)
2. [Configuration](#configuration)
3. [Type Definitions](#type-definitions)
4. [CLI Commands](#cli-commands)
5. [Error Handling](#error-handling)
6. [Examples](#examples)

## Core Classes

### SyncOrchestrator

The main orchestration class that coordinates all sync operations.

#### Constructor

```typescript
constructor(config: SyncConfig)
```

Creates a new SyncOrchestrator instance with the provided configuration.

**Parameters:**

- `config: SyncConfig` - The configuration object defining input/output paths and processing options

#### Methods

##### sync(options?)

Performs a complete synchronization operation from Storybook stories to shadcn/ui registry format.

```typescript
async sync(options: {
  incremental?: boolean;
  validate?: boolean;
  generateExamples?: boolean;
  since?: Date;
} = {}): Promise<SyncResult>
```

**Parameters:**

- `options.incremental` - Only process files changed since the specified date
- `options.validate` - Validate the generated output against schemas
- `options.generateExamples` - Generate usage examples and documentation
- `options.since` - Date threshold for incremental processing

**Returns:** `Promise<SyncResult>` containing success status, generated registry, items, and statistics

##### export(options?)

Exports Storybook stories to registry format without full sync workflow.

```typescript
async export(options: {
  format?: 'registry' | 'individual';
  includeExamples?: boolean;
  outputPath?: string;
} = {}): Promise<SyncResult>
```

**Parameters:**

- `options.format` - Output format: single registry file or individual item files
- `options.includeExamples` - Include generated examples in output
- `options.outputPath` - Custom output directory path

##### validate()

Validates the current configuration and project setup.

```typescript
async validate(): Promise<{
  valid: boolean;
  issues: Array<{ type: 'error' | 'warning' | 'info'; message: string; file?: string }>;
}>
```

**Returns:** Validation result with issues categorized by severity

##### initialize(options?)

Initializes a new project with configuration file and directory structure.

```typescript
async initialize(options: {
  force?: boolean;
  template?: string;
  storybookPath?: string;
  componentsPath?: string;
  outputPath?: string;
} = {}): Promise<void>
```

**Parameters:**

- `options.force` - Overwrite existing configuration files
- `options.template` - Use a specific project template
- `options.storybookPath` - Custom Storybook directory path
- `options.componentsPath` - Custom components directory path
- `options.outputPath` - Custom output directory path

##### fromConfig(configPath?)

Static factory method to create SyncOrchestrator from configuration file.

```typescript
static async fromConfig(configPath?: string): Promise<SyncOrchestrator>
```

**Parameters:**

- `configPath` - Path to configuration file (defaults to `./storybook-sync.config.json`)

### StorybookParser

Parses Storybook Component Story Format (CSF) files using TypeScript AST.

#### Constructor

```typescript
constructor(tsconfigPath?: string)
```

**Parameters:**

- `tsconfigPath` - Path to TypeScript configuration file for enhanced parsing

#### Methods

##### parseStoryFile(filePath)

Parses a single story file and extracts metadata.

```typescript
async parseStoryFile(filePath: string): Promise<ParsedStoryFile>
```

**Parameters:**

- `filePath` - Absolute path to the story file

**Returns:** `ParsedStoryFile` containing meta, stories, dependencies, and component information

##### parseStoryFiles(filePaths)

Parses multiple story files in parallel.

```typescript
async parseStoryFiles(filePaths: string[]): Promise<ParsedStoryFile[]>
```

### RegistryGenerator

Generates shadcn/ui registry format from parsed story data.

#### Constructor

```typescript
constructor(config: SyncConfig)
```

#### Methods

##### generateRegistry(storyFiles, analyses?)

Generates a complete registry from story files and optional component analyses.

```typescript
async generateRegistry(
  storyFiles: ParsedStoryFile[],
  analyses?: ComponentAnalysis[]
): Promise<Registry>
```

##### generateAndWrite(storyFiles, analyses?)

Generates registry and writes to configured output paths.

```typescript
async generateAndWrite(
  storyFiles: ParsedStoryFile[],
  analyses?: ComponentAnalysis[]
): Promise<{ registry: Registry; items: RegistryItem[] }>
```

### ComponentAnalyzer

Analyzes component complexity, quality, and characteristics.

#### Methods

##### analyzeComponent(storyFile)

Analyzes a single component from its story file.

```typescript
async analyzeComponent(storyFile: ParsedStoryFile): Promise<ComponentAnalysis>
```

##### analyzeComponents(storyFiles)

Analyzes multiple components in parallel.

```typescript
async analyzeComponents(storyFiles: ParsedStoryFile[]): Promise<ComponentAnalysis[]>
```

### FileDiscovery

Discovers and validates story and component files.

#### Constructor

```typescript
constructor(config: SyncConfig)
```

#### Methods

##### discoverStoryFiles()

Discovers all story files matching the configured pattern.

```typescript
async discoverStoryFiles(): Promise<string[]>
```

##### filterChangedFiles(files, since)

Filters files to only those modified since the specified date.

```typescript
async filterChangedFiles(files: string[], since: Date): Promise<string[]>
```

##### validateStoryFile(filePath)

Validates that a file is a proper CSF story file.

```typescript
async validateStoryFile(filePath: string): Promise<boolean>
```

## Configuration

### SyncConfig

Main configuration interface for the sync tool.

```typescript
interface SyncConfig {
  input: SyncConfigInput;
  output: SyncConfigOutput;
  mapping: SyncConfigMapping;
  generation: SyncConfigGeneration;
}
```

### SyncConfigInput

Input configuration for source files and patterns.

```typescript
interface SyncConfigInput {
  storybookPath: string; // Path to Storybook files
  storiesPattern: string; // Glob pattern for story files
  componentsPath: string; // Path to component files
  tsconfigPath?: string; // Path to TypeScript config
}
```

### SyncConfigOutput

Output configuration for generated registry files.

```typescript
interface SyncConfigOutput {
  registryPath: string; // Output directory for registry
  registryName: string; // Name of the registry
  homepage?: string; // Homepage URL for registry
}
```

### SyncConfigMapping

Mapping rules for component classification and dependencies.

```typescript
interface SyncConfigMapping {
  componentTypeRules: ComponentTypeRule[];
  dependencyMapping: Record<string, string>;
  excludePatterns: string[];
}
```

### ComponentTypeRule

Rule for determining component registry type based on file patterns.

```typescript
interface ComponentTypeRule {
  pattern: string; // Glob pattern to match
  type: RegistryItemType; // Registry type to assign
}
```

## Type Definitions

### ParsedStoryFile

Represents a parsed Storybook story file.

```typescript
interface ParsedStoryFile {
  filePath: string;
  meta: StorybookMeta;
  stories: Record<string, StorybookStory>;
  dependencies: DependencyInfo[];
  componentName: string;
  componentPath?: string;
}
```

### StorybookMeta

Metadata from the default export of a story file.

```typescript
interface StorybookMeta {
  title?: string;
  component?: any;
  args?: Record<string, any>;
  argTypes?: Record<string, any>;
  parameters?: Record<string, any>;
  tags?: string[];
}
```

### StorybookStory

Individual story definition from named exports.

```typescript
interface StorybookStory {
  name?: string;
  args?: Record<string, any>;
  parameters?: Record<string, any>;
  tags?: string[];
}
```

### Registry

shadcn/ui registry format.

```typescript
interface Registry {
  $schema: string;
  name: string;
  homepage?: string;
  items: RegistryItem[];
}
```

### RegistryItem

Individual component in the registry.

```typescript
interface RegistryItem {
  name: string;
  type: RegistryItemType;
  description?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
  tailwind?: TailwindConfig;
  cssVars?: CssVars;
  meta?: RegistryMeta;
}
```

### SyncResult

Result of sync or export operations.

```typescript
interface SyncResult {
  success: boolean;
  registry: Registry;
  items: RegistryItem[];
  stats: SyncStats;
  errors?: Error[];
}
```

### SyncStats

Statistics from sync operations.

```typescript
interface SyncStats {
  filesProcessed: number;
  componentsGenerated: number;
  errorsCount: number;
  warningsCount: number;
  duration: number;
}
```

## CLI Commands

### init

Initialize a new project with configuration.

```bash
storybook-sync init [options]
```

**Options:**

- `-f, --force` - Overwrite existing configuration
- `-t, --template <name>` - Use specific template
- `--storybook-path <path>` - Custom Storybook path
- `--components-path <path>` - Custom components path
- `--output-path <path>` - Custom output path

### sync

Synchronize stories to registry format.

```bash
storybook-sync sync [options]
```

**Options:**

- `-w, --watch` - Watch for file changes
- `-i, --incremental` - Only process changed files
- `--validate` - Validate output after sync
- `--examples` - Generate usage examples
- `-c, --config <path>` - Custom config file path

### export

Export stories to registry format.

```bash
storybook-sync export [options]
```

**Options:**

- `-f, --format <type>` - Output format (registry|individual)
- `--include-examples` - Include story examples
- `-o, --output <path>` - Custom output directory
- `-c, --config <path>` - Custom config file path

### validate

Validate configuration and setup.

```bash
storybook-sync validate [options]
```

**Options:**

- `--fix` - Automatically fix issues
- `-r, --report-format <type>` - Report format (text|json|html)
- `-c, --config <path>` - Custom config file path

## Error Handling

### Error Types

The tool defines several custom error types for better error handling:

#### CustomError

Base error interface with additional context.

```typescript
interface CustomError extends Error {
  code?: string;
  file?: string;
}
```

### Common Error Codes

- `CONFIG_LOAD_ERROR` - Configuration file loading failed
- `CONFIG_VALIDATION_ERROR` - Configuration validation failed
- `PARSE_ERROR` - Story file parsing failed
- `GENERATION_ERROR` - Registry generation failed
- `VALIDATION_ERROR` - Output validation failed
- `FILE_NOT_FOUND` - Required file not found
- `PERMISSION_ERROR` - File system permission error

### Error Handling Best Practices

1. **Graceful Degradation**: The tool continues processing even when individual files fail
2. **Detailed Reporting**: Errors include file paths and specific failure reasons
3. **Recovery Options**: Many errors provide suggestions for resolution
4. **Validation**: Built-in validation prevents common configuration mistakes

## Examples

### Basic Usage

```typescript
import { SyncOrchestrator, loadConfig } from 'storybook-shadcn-sync';

// Load configuration and create orchestrator
const config = await loadConfig('./storybook-sync.config.json');
const orchestrator = new SyncOrchestrator(config);

// Perform sync operation
const result = await orchestrator.sync({
  validate: true,
  generateExamples: true,
});

if (result.success) {
  console.log(`Generated ${result.items.length} components`);
} else {
  console.error('Sync failed:', result.errors);
}
```

### Custom Configuration

```typescript
import { SyncOrchestrator } from 'storybook-shadcn-sync';

const customConfig = {
  input: {
    storybookPath: './src/stories',
    storiesPattern: '**/*.stories.@(ts|tsx)',
    componentsPath: './src/components',
    tsconfigPath: './tsconfig.json',
  },
  output: {
    registryPath: './dist/registry',
    registryName: 'my-ui-library',
    homepage: 'https://my-ui-library.com',
  },
  mapping: {
    componentTypeRules: [
      { pattern: '**/ui/**', type: 'registry:ui' },
      { pattern: '**/blocks/**', type: 'registry:block' },
    ],
    dependencyMapping: {
      '@my/design-system': '@shadcn/ui',
    },
    excludePatterns: ['**/*.test.*', '**/node_modules/**'],
  },
  generation: {
    generateIndividualItems: true,
    includeStoryExamples: true,
    validateOutput: true,
  },
};

const orchestrator = new SyncOrchestrator(customConfig);
```

### Incremental Processing

```typescript
// Process only files changed in the last 24 hours
const result = await orchestrator.sync({
  incremental: true,
  since: new Date(Date.now() - 24 * 60 * 60 * 1000),
});
```

### Export to Different Formats

```typescript
// Export as single registry file
await orchestrator.export({
  format: 'registry',
  includeExamples: true,
});

// Export as individual component files
await orchestrator.export({
  format: 'individual',
  outputPath: './dist/components',
});
```

### Validation and Error Handling

```typescript
// Validate project setup
const validation = await orchestrator.validate();

if (!validation.valid) {
  for (const issue of validation.issues) {
    if (issue.type === 'error') {
      console.error(`❌ ${issue.message}`);
      if (issue.file) {
        console.error(`   File: ${issue.file}`);
      }
    }
  }
}
```

### Component Analysis

```typescript
import { ComponentAnalyzer, StorybookParser } from 'storybook-shadcn-sync';

const parser = new StorybookParser();
const analyzer = new ComponentAnalyzer();

// Parse and analyze a specific component
const storyFile = await parser.parseStoryFile('./Button.stories.tsx');
const analysis = await analyzer.analyzeComponent(storyFile);

console.log(`Component: ${analysis.name}`);
console.log(`Complexity Score: ${analysis.complexity.score}`);
console.log(`Quality Score: ${analysis.quality.score}`);
console.log(`Type: ${analysis.type}`);
```
