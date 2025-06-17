# Demo Project: Storybook to shadcn/ui Sync

This demo project showcases how to use the Storybook to shadcn/ui sync tool with a real component library.

## Project Structure

```
demo-project/
├── src/
│   ├── components/ui/          # shadcn/ui components
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   └── card.tsx
│   ├── lib/
│   │   └── utils.ts           # Utility functions
│   └── stories/               # Storybook stories
│       ├── Button.stories.tsx
│       ├── Input.stories.tsx
│       ├── Label.stories.tsx
│       └── Card.stories.tsx
├── registry/                  # Generated registry files
├── storybook-sync.config.json # Sync configuration
└── package.json
```

## Components Included

### UI Components

1. **Button** - Versatile button with multiple variants and sizes
2. **Input** - Flexible input component with consistent styling
3. **Label** - Accessible label component built with Radix UI
4. **Card** - Flexible card component with header, content, and footer

### Stories Features

- Comprehensive prop documentation
- Multiple variants and states
- Accessibility examples
- Real-world usage scenarios
- Interactive controls

## Running the Demo

### 1. Install Dependencies

```bash
cd examples/demo-project
npm install
```

### 2. Install the Sync Tool

```bash
# Install globally
npm install -g storybook-shadcn-sync

# Or use the local version
npm link ../../
```

### 3. Run Storybook

```bash
npm run storybook
```

### 4. Sync Stories to Registry

```bash
# Initialize (already done)
npm run sync:init

# Validate setup
npm run sync:validate

# Run sync
npm run sync:run

# Export registry
npm run sync:export
```

## Generated Registry

After running the sync, you'll find:

### Registry Files

- `registry/registry.json` - Main registry file
- `registry/button.json` - Button component registry item
- `registry/input.json` - Input component registry item
- `registry/label.json` - Label component registry item
- `registry/card.json` - Card component registry item

### Examples

- `registry/examples/` - Generated documentation and usage examples

## Configuration Highlights

The `storybook-sync.config.json` demonstrates:

- **Component Type Rules**: Automatically classifies UI components
- **Dependency Mapping**: Maps internal imports to registry dependencies
- **Story Examples**: Includes story-based examples in output
- **Validation**: Ensures output compatibility with shadcn/ui

## Using the Generated Registry

### With shadcn/ui CLI

```bash
# Add the registry to your project
npx shadcn-ui@latest add --registry ./registry/registry.json button

# Or add individual components
npx shadcn-ui@latest add ./registry/button.json
```

### Manual Installation

Copy the component files and dependencies as specified in the registry items.

## Key Features Demonstrated

1. **Automatic Component Discovery**: Finds all story files
2. **Metadata Extraction**: Pulls component props and documentation
3. **Dependency Analysis**: Identifies required dependencies
4. **Example Generation**: Creates usage examples from stories
5. **Schema Validation**: Ensures compatibility with shadcn/ui
6. **Multiple Formats**: Supports both registry and individual formats

## Customization Examples

### Adding New Components

1. Create the component in `src/components/ui/`
2. Create stories in `src/stories/`
3. Run `npm run sync:run` to update registry

### Custom Component Types

Update `storybook-sync.config.json`:

```json
{
  "mapping": {
    "componentTypeRules": [
      {
        "pattern": "**/forms/**",
        "type": "registry:block"
      },
      {
        "pattern": "**/charts/**",
        "type": "registry:component"
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
      "@/components/ui/button": "button",
      "@/lib/utils": "utils"
    }
  }
}
```

This demo provides a complete example of how to integrate the sync tool into a real component library workflow.

