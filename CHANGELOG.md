# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.0.0] - 2024-06-17

### Added

#### Core Features

- **Storybook Parser**: Complete TypeScript AST-based parser for CSF 2.0 and 3.0 story files
- **Registry Generator**: Generates valid shadcn/ui registry.json and individual component files
- **Component Analyzer**: Analyzes component complexity, dependencies, and characteristics
- **CLI Interface**: Comprehensive command-line tool with init, sync, export, and validate commands
- **Configuration System**: Flexible JSON-based configuration with auto-detection
- **Schema Validation**: Full Zod validation for registry and component schemas

#### CLI Commands

- `storybook-sync init` - Initialize project with configuration
- `storybook-sync sync` - Synchronize stories to registry format
- `storybook-sync export` - Export stories in different formats
- `storybook-sync validate` - Validate configuration and setup

#### Parser Features

- TypeScript AST parsing for accurate story extraction
- Support for both CSF 2.0 and CSF 3.0 formats
- Metadata extraction from story parameters and argTypes
- Dependency analysis and import resolution
- Component file discovery and mapping

#### Generator Features

- Registry.json generation with proper schema compliance
- Individual component file generation
- Automatic component type classification
- Dependency mapping and resolution
- Example generation from story data
- CSS variables and Tailwind config support

#### Configuration Options

- Component type rules for automatic classification
- Dependency mapping for internal to registry dependencies
- Exclude patterns for filtering files
- Output format customization
- Incremental processing support

#### Documentation

- Comprehensive API documentation
- User guide with step-by-step instructions
- Troubleshooting guide for common issues
- Demo project with working examples
- Contributing guidelines

#### Testing

- Unit tests for all core modules
- Integration tests for end-to-end workflows
- CLI end-to-end tests with real command execution
- Schema validation tests
- Performance tests for large projects

### Technical Details

#### Dependencies

- TypeScript compiler API for AST parsing
- Zod for schema validation
- Commander.js for CLI interface
- fs-extra for file system operations
- glob for file pattern matching
- class-variance-authority for component variants

#### Supported Formats

- **Input**: CSF 2.0 and 3.0 story files (.js, .jsx, .ts, .tsx)
- **Output**: shadcn/ui registry format (registry.json and individual .json files)
- **Components**: React components with TypeScript support

#### Registry Types

- `registry:ui` - Basic UI components
- `registry:component` - Complex components
- `registry:block` - Composed blocks/templates
- `registry:hook` - React hooks
- `registry:lib` - Utility libraries

### Examples

#### Basic Usage

```bash
# Initialize project
storybook-sync init

# Sync stories to registry
storybook-sync sync --validate --examples

# Export in different formats
storybook-sync export --format individual
```

#### Configuration Example

```json
{
  "input": {
    "storybookPath": "./src/stories",
    "storiesPattern": "**/*.stories.@(js|jsx|ts|tsx)",
    "componentsPath": "./src/components"
  },
  "output": {
    "registryPath": "./registry",
    "registryName": "my-components"
  },
  "mapping": {
    "componentTypeRules": [{ "pattern": "**/ui/**", "type": "registry:ui" }]
  }
}
```

### Known Issues

#### Limitations

- Currently supports React components only
- Requires TypeScript for optimal parsing
- Watch mode not yet implemented
- Limited to file-based component discovery

#### Workarounds

- Use incremental processing for large projects
- Ensure proper TypeScript configuration
- Validate output after generation

### Migration Guide

This is the initial release, so no migration is required.

### Breaking Changes

None - initial release.

### Deprecations

None - initial release.

### Security

- No known security vulnerabilities
- File system operations are sandboxed to configured directories
- Input validation prevents malicious configuration

---

## [Unreleased]

### Planned Features

- Watch mode for continuous synchronization
- Support for Vue and Angular components
- Plugin system for custom generators
- Web interface for configuration
- Advanced dependency analysis
- Component usage analytics

### In Progress

- Performance optimizations for large projects
- Enhanced error reporting and debugging
- Additional output formats
- Integration with popular design systems
