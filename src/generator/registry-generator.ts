import { 
  ParsedStoryFile, 
  RegistryItem, 
  Registry, 
  RegistryFile, 
  RegistryItemType,
  SyncConfig,
  ComponentAnalysis 
} from '../types';
import { RegistryItemSchema, RegistrySchema } from '../config/schemas';
import { 
  kebabCase, 
  startCase, 
  writeJsonFile, 
  ensureDir, 
  createError
} from '../utils';
import * as path from 'path';

export class RegistryGenerator {
  constructor(private config: SyncConfig) {}

  /**
   * Generate complete registry from parsed story files
   */
  async generateRegistry(
    storyFiles: ParsedStoryFile[],
    analyses?: ComponentAnalysis[]
  ): Promise<Registry> {
    const items: RegistryItem[] = [];

    for (let i = 0; i < storyFiles.length; i++) {
      const storyFile = storyFiles[i]!;
      const analysis = analyses?.[i];
      
      try {
        const item = await this.generateRegistryItem(storyFile, analysis);
        if (item) {
          items.push(item);
        }
      } catch (error) {
        console.warn(`Failed to generate registry item for ${storyFile.filePath}:`, error);
      }
    }

    const registry: Registry = {
      $schema: 'https://ui.shadcn.com/schema/registry.json',
      name: this.config.output.registryName,
      ...(this.config.output.homepage && { homepage: this.config.output.homepage }),
      items,
    };

    // Validate registry
    const validation = RegistrySchema.safeParse(registry);
    if (!validation.success) {
      throw createError(
        `Generated registry is invalid: ${validation.error.message}`,
        'REGISTRY_VALIDATION_ERROR'
      );
    }

    return registry;
  }

  /**
   * Generate individual registry item from story file
   */
  async generateRegistryItem(
    storyFile: ParsedStoryFile,
    analysis?: ComponentAnalysis
  ): Promise<RegistryItem | null> {
    if (!storyFile.componentName) {
      return null;
    }

    const name = this.generateItemName(storyFile.componentName);
    const type = this.determineItemType(storyFile, analysis);
    const title = this.generateTitle(storyFile);
    const description = this.generateDescription(storyFile);
    const files = await this.generateFiles(storyFile, type);
    const dependencies = this.generateDependencies(storyFile);
    const registryDependencies = this.generateRegistryDependencies(storyFile);

    const item: RegistryItem = {
      $schema: 'https://ui.shadcn.com/schema/registry-item.json',
      name,
      type,
      title,
      description,
      files,
      ...(dependencies.length > 0 && { dependencies }),
      ...(registryDependencies.length > 0 && { registryDependencies }),
    };

    // Add CSS variables if available
    const cssVars = this.generateCssVars(storyFile);
    if (cssVars) {
      item.cssVars = cssVars;
    }

    // Validate item
    const validation = RegistryItemSchema.safeParse(item);
    if (!validation.success) {
      throw createError(
        `Generated registry item is invalid: ${validation.error.message}`,
        'REGISTRY_ITEM_VALIDATION_ERROR',
        storyFile.filePath
      );
    }

    return item;
  }

  /**
   * Generate item name from component name
   */
  private generateItemName(componentName: string): string {
    return kebabCase(componentName);
  }

  /**
   * Determine registry item type based on story file and analysis
   */
  private determineItemType(
    storyFile: ParsedStoryFile,
    analysis?: ComponentAnalysis
  ): RegistryItemType {
    // Use analysis if available
    if (analysis?.type) {
      return analysis.type;
    }

    // Apply configuration rules
    const { componentTypeRules } = this.config.mapping;
    const filePath = storyFile.filePath;

    for (const rule of componentTypeRules) {
      if (this.matchesPattern(filePath, rule.pattern)) {
        // Check additional conditions if specified
        if (rule.condition && rule.threshold) {
          if (this.meetsCondition(storyFile, analysis, rule.condition, rule.threshold)) {
            return rule.type;
          }
        } else {
          return rule.type;
        }
      }
    }

    // Default to component
    return 'registry:component';
  }

  /**
   * Check if file path matches pattern
   */
  private matchesPattern(filePath: string, pattern: string): boolean {
    // Convert glob pattern to regex
    const regexPattern = pattern
      .replace(/\*\*/g, '.*')
      .replace(/\*/g, '[^/]*')
      .replace(/\?/g, '.');
    
    const regex = new RegExp(regexPattern);
    return regex.test(filePath);
  }

  /**
   * Check if story meets condition threshold
   */
  private meetsCondition(
    storyFile: ParsedStoryFile,
    analysis: ComponentAnalysis | undefined,
    condition: string,
    threshold: number
  ): boolean {
    switch (condition) {
      case 'fileCount':
        return (analysis?.files.length || 1) >= threshold;
      case 'complexity':
        return (analysis?.complexity.score || 0) >= threshold;
      case 'dependencies':
        return storyFile.dependencies.length >= threshold;
      default:
        return false;
    }
  }

  /**
   * Generate title from story file
   */
  private generateTitle(storyFile: ParsedStoryFile): string {
    if (storyFile.meta.title) {
      // Extract last part of title path
      const parts = storyFile.meta.title.split('/');
      return parts[parts.length - 1] || storyFile.componentName;
    }
    
    return startCase(storyFile.componentName);
  }

  /**
   * Generate description from story file
   */
  private generateDescription(storyFile: ParsedStoryFile): string {
    // Try to extract description from story parameters
    const docsParams = storyFile.meta.parameters?.['docs'];
    if (docsParams?.description) {
      // Handle both string and object formats
      if (typeof docsParams.description === 'string') {
        return docsParams.description;
      } else if (typeof docsParams.description === 'object' && docsParams.description.component) {
        return docsParams.description.component;
      }
    }

    // Generate default description
    return `A ${storyFile.componentName} component.`;
  }

  /**
   * Generate files array for registry item
   */
  private async generateFiles(
    storyFile: ParsedStoryFile,
    type: RegistryItemType
  ): Promise<RegistryFile[]> {
    const files: RegistryFile[] = [];
    const componentName = kebabCase(storyFile.componentName);

    // Add main component file
    if (storyFile.componentPath) {
      const componentFile: RegistryFile = {
        path: this.generateRegistryPath(componentName, 'component'),
        type: this.getFileType(type),
      };
      files.push(componentFile);
    }

    // Add additional files based on type
    if (type === 'registry:block') {
      // Blocks might have multiple files
      files.push({
        path: this.generateRegistryPath(componentName, 'index'),
        type: 'registry:component',
      });
    }

    return files;
  }

  /**
   * Generate registry file path
   */
  private generateRegistryPath(componentName: string, fileType: string): string {
    const basePath = `registry/default/${componentName}`;
    
    switch (fileType) {
      case 'component':
        return `${basePath}/${componentName}.tsx`;
      case 'index':
        return `${basePath}/index.ts`;
      case 'hook':
        return `${basePath}/use-${componentName}.ts`;
      case 'lib':
        return `${basePath}/${componentName}.ts`;
      default:
        return `${basePath}/${componentName}.tsx`;
    }
  }

  /**
   * Get file type based on registry item type
   */
  private getFileType(itemType: RegistryItemType): RegistryItemType {
    switch (itemType) {
      case 'registry:block':
        return 'registry:component';
      case 'registry:ui':
        return 'registry:ui';
      case 'registry:hook':
        return 'registry:hook';
      case 'registry:lib':
        return 'registry:lib';
      default:
        return 'registry:component';
    }
  }

  /**
   * Generate npm dependencies
   */
  private generateDependencies(storyFile: ParsedStoryFile): string[] {
    const { dependencyMapping } = this.config.mapping;
    const dependencies: string[] = [];

    for (const dep of storyFile.dependencies) {
      // Skip relative imports
      if (dep.startsWith('.')) continue;
      
      // Map dependency if configured
      const mappedDep = dependencyMapping[dep] || dep;
      if (mappedDep && !dependencies.includes(mappedDep)) {
        dependencies.push(mappedDep);
      }
    }

    return dependencies.sort();
  }

  /**
   * Generate registry dependencies
   */
  private generateRegistryDependencies(storyFile: ParsedStoryFile): string[] {
    const registryDeps: string[] = [];
    
    // Look for common shadcn/ui components in dependencies
    const commonComponents = [
      'button', 'input', 'label', 'card', 'dialog', 'dropdown-menu',
      'select', 'checkbox', 'radio-group', 'switch', 'textarea',
      'tooltip', 'popover', 'accordion', 'alert', 'badge', 'avatar'
    ];

    for (const dep of storyFile.dependencies) {
      const depName = dep.toLowerCase();
      for (const component of commonComponents) {
        if (depName.includes(component) && !registryDeps.includes(component)) {
          registryDeps.push(component);
        }
      }
    }

    return registryDeps.sort();
  }

  /**
   * Generate CSS variables from story parameters
   */
  private generateCssVars(storyFile: ParsedStoryFile): RegistryItem['cssVars'] | undefined {
    const cssVars = storyFile.meta.parameters?.['cssVars'];
    if (cssVars && typeof cssVars === 'object') {
      return cssVars;
    }
    return undefined;
  }

  /**
   * Write registry to file system
   */
  async writeRegistry(registry: Registry): Promise<void> {
    const registryPath = path.join(this.config.output.registryPath, 'registry.json');
    await writeJsonFile(registryPath, registry);
  }

  /**
   * Write individual registry items to file system
   */
  async writeRegistryItems(items: RegistryItem[]): Promise<void> {
    const registryDir = this.config.output.registryPath;
    
    for (const item of items) {
      const itemPath = path.join(registryDir, `${item.name}.json`);
      await writeJsonFile(itemPath, item);
    }
  }

  /**
   * Generate complete registry and write to file system
   */
  async generateAndWrite(
    storyFiles: ParsedStoryFile[],
    analyses?: ComponentAnalysis[]
  ): Promise<{ registry: Registry; items: RegistryItem[] }> {
    // Generate registry
    const registry = await this.generateRegistry(storyFiles, analyses);
    
    // Ensure output directory exists
    await ensureDir(this.config.output.registryPath);
    
    // Write registry file
    await this.writeRegistry(registry);
    
    // Write individual items if configured
    if (this.config.generation.generateIndividualItems) {
      await this.writeRegistryItems(registry.items);
    }

    return { registry, items: registry.items };
  }
}

