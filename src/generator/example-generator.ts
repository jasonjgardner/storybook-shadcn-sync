import { ParsedStoryFile, StorybookStory, RegistryItem } from '../types';
import { startCase } from '../utils';

export class ExampleGenerator {
  /**
   * Generate usage examples from story data
   */
  generateExamples(storyFile: ParsedStoryFile): string[] {
    const examples: string[] = [];

    // Generate basic usage example
    const basicExample = this.generateBasicExample(storyFile);
    if (basicExample) {
      examples.push(basicExample);
    }

    // Generate examples from stories
    for (const [storyName, story] of Object.entries(storyFile.stories)) {
      const storyExample = this.generateStoryExample(storyFile, storyName, story);
      if (storyExample) {
        examples.push(storyExample);
      }
    }

    return examples;
  }

  /**
   * Generate basic usage example
   */
  private generateBasicExample(storyFile: ParsedStoryFile): string | null {
    if (!storyFile.componentName) return null;

    const componentName = storyFile.componentName;
    const defaultArgs = storyFile.meta.args || {};
    
    const props = Object.entries(defaultArgs)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}="${value}"`;
        } else if (typeof value === 'boolean') {
          return value ? key : `${key}={false}`;
        } else {
          return `${key}={${JSON.stringify(value)}}`;
        }
      })
      .join(' ');

    return `<${componentName}${props ? ' ' + props : ''} />`;
  }

  /**
   * Generate example from specific story
   */
  private generateStoryExample(
    storyFile: ParsedStoryFile,
    storyName: string,
    story: StorybookStory
  ): string | null {
    if (!storyFile.componentName) return null;

    const componentName = storyFile.componentName;
    const args = { ...storyFile.meta.args, ...story.args };
    
    const props = Object.entries(args)
      .map(([key, value]) => {
        if (typeof value === 'string') {
          return `${key}="${value}"`;
        } else if (typeof value === 'boolean') {
          return value ? key : `${key}={false}`;
        } else {
          return `${key}={${JSON.stringify(value)}}`;
        }
      })
      .join(' ');

    const comment = `// ${startCase(storyName)} example`;
    const jsx = `<${componentName}${props ? ' ' + props : ''} />`;
    
    return `${comment}\n${jsx}`;
  }

  /**
   * Generate installation instructions
   */
  generateInstallationInstructions(registryItem: RegistryItem): string[] {
    const instructions: string[] = [];

    // Add CLI installation command
    instructions.push(`npx shadcn-ui@latest add ${registryItem.name}`);

    // Add manual installation if dependencies exist
    if (registryItem.dependencies && registryItem.dependencies.length > 0) {
      const deps = registryItem.dependencies.join(' ');
      instructions.push(`npm install ${deps}`);
    }

    return instructions;
  }

  /**
   * Generate import statements
   */
  generateImportStatements(registryItem: RegistryItem): string[] {
    const imports: string[] = [];

    // Generate main component import
    const componentFile = registryItem.files.find(f => 
      f.type === 'registry:component' || f.type === 'registry:ui'
    );

    if (componentFile) {
      const componentName = this.extractComponentNameFromPath(componentFile.path);
      imports.push(`import { ${componentName} } from "@/components/ui/${registryItem.name}"`);
    }

    // Generate hook imports
    const hookFiles = registryItem.files.filter(f => f.type === 'registry:hook');
    for (const hookFile of hookFiles) {
      const hookName = this.extractHookNameFromPath(hookFile.path);
      imports.push(`import { ${hookName} } from "@/hooks/${hookName}"`);
    }

    return imports;
  }

  /**
   * Extract component name from file path
   */
  private extractComponentNameFromPath(filePath: string): string {
    const fileName = filePath.split('/').pop() || '';
    const nameWithoutExt = fileName.replace(/\.(tsx?|jsx?)$/, '');
    
    // Convert kebab-case to PascalCase
    return nameWithoutExt
      .split('-')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }

  /**
   * Extract hook name from file path
   */
  private extractHookNameFromPath(filePath: string): string {
    const fileName = filePath.split('/').pop() || '';
    const nameWithoutExt = fileName.replace(/\.(tsx?|jsx?)$/, '');
    
    // Convert use-hook-name to useHookName
    if (nameWithoutExt.startsWith('use-')) {
      const parts = nameWithoutExt.split('-');
      return parts[0] + parts.slice(1)
        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
        .join('');
    }
    
    return nameWithoutExt;
  }

  /**
   * Generate complete documentation
   */
  generateDocumentation(
    storyFile: ParsedStoryFile,
    registryItem: RegistryItem
  ): {
    title: string;
    description: string;
    installation: string[];
    imports: string[];
    examples: string[];
  } {
    return {
      title: registryItem.title,
      description: registryItem.description,
      installation: this.generateInstallationInstructions(registryItem),
      imports: this.generateImportStatements(registryItem),
      examples: this.generateExamples(storyFile),
    };
  }
}

