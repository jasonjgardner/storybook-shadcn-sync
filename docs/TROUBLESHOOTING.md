# Troubleshooting Guide

## Common Issues and Solutions

### Installation Issues

#### Node.js Version Compatibility

**Problem:** Tool fails to install or run due to Node.js version mismatch.

**Error Messages:**
```
Error: Unsupported Node.js version
npm ERR! engine Unsupported engine
```

**Solution:**
1. Check your Node.js version: `node --version`
2. Upgrade to Node.js 16 or higher
3. Use nvm to manage Node.js versions:
   ```bash
   nvm install 18
   nvm use 18
   ```

#### Permission Errors

**Problem:** Installation fails due to permission issues.

**Error Messages:**
```
EACCES: permission denied
npm ERR! Error: EACCES
```

**Solutions:**
1. Use npm with proper permissions:
   ```bash
   sudo npm install -g storybook-shadcn-sync
   ```
2. Configure npm to use a different directory:
   ```bash
   npm config set prefix ~/.npm-global
   export PATH=~/.npm-global/bin:$PATH
   ```
3. Use npx instead of global installation:
   ```bash
   npx storybook-shadcn-sync init
   ```

### Configuration Issues

#### Configuration File Not Found

**Problem:** Tool can't locate the configuration file.

**Error Messages:**
```
Configuration file not found at ./storybook-sync.config.json
Using default configuration
```

**Solutions:**
1. Run `storybook-sync init` to create configuration
2. Specify custom config path:
   ```bash
   storybook-sync sync --config ./custom-config.json
   ```
3. Check file permissions and location

#### Invalid Configuration Format

**Problem:** Configuration file has syntax errors or invalid structure.

**Error Messages:**
```
Failed to load configuration: Unexpected token
Configuration validation failed
```

**Solutions:**
1. Validate JSON syntax using online JSON validator
2. Check for missing commas, brackets, or quotes
3. Compare with example configuration:
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
     }
   }
   ```

#### Path Resolution Issues

**Problem:** Configured paths don't exist or are inaccessible.

**Error Messages:**
```
Storybook path does not exist: ./src/stories
Components path does not exist: ./src/components
```

**Solutions:**
1. Verify paths exist: `ls -la ./src/stories`
2. Use absolute paths if relative paths fail
3. Check directory permissions: `ls -la ./src/`
4. Update configuration with correct paths:
   ```bash
   storybook-sync init --storybook-path ./stories --components-path ./components
   ```

### Story File Issues

#### No Story Files Found

**Problem:** Tool can't discover any story files.

**Error Messages:**
```
No story files found with current pattern
Found 0 story files
```

**Solutions:**
1. Check your stories pattern in configuration:
   ```json
   {
     "input": {
       "storiesPattern": "**/*.stories.@(js|jsx|ts|tsx|mdx)"
     }
   }
   ```
2. Verify story files exist: `find . -name "*.stories.*"`
3. Ensure story files are in the configured directory
4. Test pattern matching:
   ```bash
   ls src/stories/**/*.stories.*
   ```

#### Story Parsing Errors

**Problem:** Individual story files fail to parse.

**Error Messages:**
```
Failed to parse ./Button.stories.tsx: Unexpected token
SyntaxError: Cannot use import statement outside a module
```

**Solutions:**
1. Check TypeScript syntax: `npx tsc --noEmit`
2. Ensure proper CSF format:
   ```typescript
   // Required: default export with meta
   export default {
     title: 'Components/Button',
     component: Button,
   };
   
   // Required: named story exports
   export const Primary = {
     args: { variant: 'primary' },
   };
   ```
3. Verify imports are correct:
   ```typescript
   import type { Meta, StoryObj } from '@storybook/react';
   import { Button } from './Button';
   ```

#### Missing Component References

**Problem:** Stories reference components that can't be found.

**Error Messages:**
```
Component not found: ./Button
Cannot resolve module './Button'
```

**Solutions:**
1. Check import paths in story files
2. Verify component files exist
3. Update `componentsPath` in configuration
4. Use relative imports correctly:
   ```typescript
   // If story is in src/stories/ and component in src/components/
   import { Button } from '../components/Button';
   ```

### TypeScript Issues

#### TypeScript Configuration Problems

**Problem:** Tool can't load or parse TypeScript configuration.

**Error Messages:**
```
TypeScript config not found: ./tsconfig.json
Failed to load TypeScript configuration
```

**Solutions:**
1. Ensure tsconfig.json exists and is valid
2. Specify custom TypeScript config:
   ```json
   {
     "input": {
       "tsconfigPath": "./tsconfig.app.json"
     }
   }
   ```
3. Create minimal tsconfig.json if missing:
   ```json
   {
     "compilerOptions": {
       "target": "es2020",
       "module": "esnext",
       "moduleResolution": "node",
       "jsx": "react-jsx",
       "strict": true
     },
     "include": ["src/**/*"]
   }
   ```

#### Type Definition Errors

**Problem:** TypeScript types are missing or incorrect.

**Error Messages:**
```
Cannot find module '@storybook/react'
Property 'component' does not exist on type
```

**Solutions:**
1. Install missing type definitions:
   ```bash
   npm install --save-dev @types/react @storybook/react
   ```
2. Update Storybook types:
   ```bash
   npm install --save-dev @storybook/types
   ```
3. Add type imports to stories:
   ```typescript
   import type { Meta, StoryObj } from '@storybook/react';
   ```

### Output Generation Issues

#### Registry Validation Failures

**Problem:** Generated registry doesn't pass validation.

**Error Messages:**
```
Registry validation failed: Invalid schema
Item validation failed for button: Missing required field
```

**Solutions:**
1. Check component naming (must be kebab-case):
   ```typescript
   // Good
   export const MyButton = { /* ... */ };
   // Generates: my-button.json
   
   // Avoid special characters
   export const My_Button$ = { /* ... */ };
   ```
2. Ensure required fields are present:
   ```typescript
   export default {
     title: 'Components/Button', // Required
     component: Button,          // Required
   };
   ```
3. Validate manually:
   ```bash
   storybook-sync sync --validate
   ```

#### File Permission Errors

**Problem:** Tool can't write to output directory.

**Error Messages:**
```
EACCES: permission denied, mkdir './registry'
Cannot write to output directory
```

**Solutions:**
1. Check directory permissions:
   ```bash
   ls -la ./
   ```
2. Create directory manually:
   ```bash
   mkdir -p ./registry
   chmod 755 ./registry
   ```
3. Use different output path:
   ```bash
   storybook-sync sync --output ./dist/registry
   ```

#### Empty or Incomplete Output

**Problem:** Registry files are generated but empty or missing components.

**Symptoms:**
- registry.json exists but has empty items array
- Individual component files are missing
- Examples directory is empty

**Solutions:**
1. Check for parsing errors in console output
2. Verify story files have proper structure
3. Enable verbose logging:
   ```bash
   DEBUG=storybook-sync:* storybook-sync sync
   ```
4. Test with single story file:
   ```bash
   storybook-sync sync --config minimal-config.json
   ```

### Performance Issues

#### Slow Processing

**Problem:** Sync operation takes very long time.

**Symptoms:**
- Command hangs for minutes
- High CPU usage
- Memory consumption increases

**Solutions:**
1. Use incremental processing:
   ```bash
   storybook-sync sync --incremental
   ```
2. Exclude unnecessary files:
   ```json
   {
     "mapping": {
       "excludePatterns": [
         "**/node_modules/**",
         "**/dist/**",
         "**/*.test.*",
         "**/coverage/**"
       ]
     }
   }
   ```
3. Process smaller batches:
   ```bash
   # Process specific directories
   storybook-sync sync --storybook-path ./src/stories/components
   ```

#### Memory Issues

**Problem:** Tool runs out of memory with large projects.

**Error Messages:**
```
JavaScript heap out of memory
FATAL ERROR: Ineffective mark-compacts near heap limit
```

**Solutions:**
1. Increase Node.js memory limit:
   ```bash
   node --max-old-space-size=4096 ./node_modules/.bin/storybook-sync sync
   ```
2. Process in smaller chunks
3. Exclude large files or directories
4. Use incremental processing

### CLI Issues

#### Command Not Found

**Problem:** CLI command is not recognized.

**Error Messages:**
```
storybook-sync: command not found
'storybook-sync' is not recognized as an internal or external command
```

**Solutions:**
1. Install globally:
   ```bash
   npm install -g storybook-shadcn-sync
   ```
2. Use npx:
   ```bash
   npx storybook-shadcn-sync init
   ```
3. Add to package.json scripts:
   ```json
   {
     "scripts": {
       "sync": "storybook-sync sync"
     }
   }
   ```
4. Check PATH environment variable

#### Invalid Command Options

**Problem:** CLI options are not recognized or cause errors.

**Error Messages:**
```
Unknown option: --invalid-option
Invalid argument: --format=wrong
```

**Solutions:**
1. Check available options:
   ```bash
   storybook-sync --help
   storybook-sync sync --help
   ```
2. Use correct option format:
   ```bash
   # Good
   storybook-sync export --format registry
   
   # Wrong
   storybook-sync export --format=registry
   ```

### Integration Issues

#### CI/CD Pipeline Failures

**Problem:** Tool fails in continuous integration environment.

**Common Issues:**
- Different Node.js version
- Missing dependencies
- File permission issues
- Environment variable problems

**Solutions:**
1. Pin Node.js version in CI:
   ```yaml
   - uses: actions/setup-node@v3
     with:
       node-version: '18'
   ```
2. Install dependencies explicitly:
   ```yaml
   - run: npm ci
   - run: npm install -g storybook-shadcn-sync
   ```
3. Set proper permissions:
   ```yaml
   - run: chmod +x ./scripts/sync.sh
   ```
4. Use npx to avoid global installation:
   ```yaml
   - run: npx storybook-shadcn-sync sync --validate
   ```

#### Git Integration Issues

**Problem:** Generated files cause Git conflicts or issues.

**Solutions:**
1. Add registry files to .gitignore if they're build artifacts:
   ```gitignore
   /registry/
   *.registry.json
   ```
2. Or commit them if they're source files:
   ```bash
   git add registry/
   git commit -m "Update component registry"
   ```
3. Use Git hooks for automatic sync:
   ```bash
   # .git/hooks/pre-commit
   #!/bin/sh
   storybook-sync validate
   ```

## Debugging Techniques

### Enable Debug Logging

```bash
# Enable all debug output
DEBUG=storybook-sync:* storybook-sync sync

# Enable specific modules
DEBUG=storybook-sync:parser storybook-sync sync
DEBUG=storybook-sync:generator storybook-sync sync
```

### Validate Step by Step

```bash
# 1. Validate configuration
storybook-sync validate --report-format json

# 2. Test file discovery
storybook-sync validate | grep "Found.*story files"

# 3. Test parsing individual files
# (requires custom script or debug mode)

# 4. Test generation
storybook-sync sync --validate
```

### Inspect Generated Output

```bash
# Check registry structure
cat registry/registry.json | jq '.'

# Validate against schema
npx ajv-cli validate -s schema.json -d registry.json

# Check individual components
ls -la registry/
cat registry/button.json | jq '.'
```

### Test with Minimal Configuration

Create a minimal test setup:

```json
{
  "input": {
    "storybookPath": "./test-stories",
    "storiesPattern": "*.stories.tsx",
    "componentsPath": "./test-components"
  },
  "output": {
    "registryPath": "./test-registry",
    "registryName": "test"
  },
  "mapping": {
    "componentTypeRules": [],
    "dependencyMapping": {},
    "excludePatterns": []
  },
  "generation": {
    "generateIndividualItems": true,
    "includeStoryExamples": false,
    "validateOutput": false
  }
}
```

### Check Dependencies

```bash
# Verify all dependencies are installed
npm ls storybook-shadcn-sync

# Check for peer dependency issues
npm ls --depth=0

# Update dependencies
npm update storybook-shadcn-sync
```

## Getting Help

### Check Documentation

1. **API Documentation**: `docs/API.md`
2. **User Guide**: `docs/USER_GUIDE.md`
3. **Examples**: `examples/` directory

### Community Support

1. **GitHub Issues**: Report bugs and request features
2. **Discussions**: Ask questions and share experiences
3. **Stack Overflow**: Tag questions with `storybook-shadcn-sync`

### Reporting Issues

When reporting issues, include:

1. **Environment Information**:
   ```bash
   node --version
   npm --version
   storybook-sync --version
   ```

2. **Configuration File**:
   ```json
   // Your storybook-sync.config.json
   ```

3. **Error Messages**:
   ```
   Complete error output with stack trace
   ```

4. **Minimal Reproduction**:
   - Sample story file that fails
   - Steps to reproduce the issue
   - Expected vs actual behavior

5. **Debug Output**:
   ```bash
   DEBUG=storybook-sync:* storybook-sync sync 2>&1 | tee debug.log
   ```

### Self-Help Checklist

Before seeking help, try:

- [ ] Update to latest version
- [ ] Check Node.js version compatibility
- [ ] Validate configuration file syntax
- [ ] Test with minimal configuration
- [ ] Check file permissions
- [ ] Review error messages carefully
- [ ] Search existing GitHub issues
- [ ] Try with debug logging enabled

This troubleshooting guide covers the most common issues encountered when using the Storybook to shadcn/ui sync tool. Most problems can be resolved by following these solutions and debugging techniques.

