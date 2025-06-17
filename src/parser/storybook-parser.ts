import * as ts from 'typescript';
import * as fs from 'fs-extra';
import * as path from 'path';
import { ParsedStoryFile, StorybookMeta, StorybookStory } from '../types';
import { createError, normalizePath } from '../utils';

export class StorybookParser {
  constructor(private configPath?: string) {
    // Load TypeScript configuration for parsing
    this.loadTsConfig();
  }

  /**
   * Parse a single Storybook story file
   */
  async parseStoryFile(filePath: string): Promise<ParsedStoryFile> {
    try {
      const absolutePath = path.resolve(filePath);
      const content = await fs.readFile(absolutePath, 'utf8');
      
      // Create source file
      const sourceFile = ts.createSourceFile(
        absolutePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      // Parse the file
      const result = this.parseSourceFile(sourceFile);
      
      return {
        filePath: normalizePath(absolutePath),
        ...result,
      };
    } catch (error) {
      throw createError(
        `Failed to parse story file: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'PARSE_ERROR',
        filePath
      );
    }
  }

  /**
   * Parse multiple story files
   */
  async parseStoryFiles(filePaths: string[]): Promise<ParsedStoryFile[]> {
    const results: ParsedStoryFile[] = [];
    const errors: Error[] = [];

    for (const filePath of filePaths) {
      try {
        const result = await this.parseStoryFile(filePath);
        results.push(result);
      } catch (error) {
        errors.push(error as Error);
      }
    }

    if (errors.length > 0 && results.length === 0) {
      throw createError(
        `Failed to parse any story files. Errors: ${errors.map(e => e.message).join(', ')}`,
        'PARSE_ALL_FAILED'
      );
    }

    return results;
  }

  /**
   * Parse TypeScript source file and extract story metadata
   */
  private parseSourceFile(sourceFile: ts.SourceFile): Omit<ParsedStoryFile, 'filePath'> {
    let meta: StorybookMeta | null = null;
    const stories: Record<string, StorybookStory> = {};
    const dependencies: string[] = [];
    let componentName = '';
    let componentPath = '';

    // Visit all nodes in the source file
    const visit = (node: ts.Node) => {
      // Extract imports for dependency analysis
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          dependencies.push(moduleSpecifier.text);
        }
      }

      // Extract default export (meta)
      if (ts.isExportAssignment(node) && node.isExportEquals === false) {
        meta = this.extractMeta(node.expression);
      }

      // Extract variable declarations that might be default exports
      if (ts.isVariableStatement(node)) {
        const declaration = node.declarationList.declarations[0];
        if (declaration && ts.isIdentifier(declaration.name)) {
          const name = declaration.name.text;
          if (name === 'meta' || name.toLowerCase().includes('meta')) {
            if (declaration.initializer) {
              meta = this.extractMeta(declaration.initializer);
            }
          }
        }
      }

      // Extract named exports (stories)
      if (ts.isExportDeclaration(node) && node.exportClause && ts.isNamedExports(node.exportClause)) {
        for (const element of node.exportClause.elements) {
          const storyName = element.name.text;
          // Find the corresponding variable declaration
          const story = this.findStoryDeclaration(sourceFile, storyName);
          if (story) {
            stories[storyName] = story;
          }
        }
      }

      // Extract variable declarations that are exported
      if (ts.isVariableStatement(node)) {
        const hasExportModifier = node.modifiers?.some(
          modifier => modifier.kind === ts.SyntaxKind.ExportKeyword
        );
        
        if (hasExportModifier) {
          for (const declaration of node.declarationList.declarations) {
            if (ts.isIdentifier(declaration.name) && declaration.initializer) {
              const storyName = declaration.name.text;
              const story = this.extractStory(declaration.initializer);
              if (story) {
                stories[storyName] = story;
              }
            }
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);

    if (!meta) {
      throw createError(
        'No default export (meta) found in story file',
        'NO_META_EXPORT',
        sourceFile.fileName
      );
    }

    // Extract component information from meta
    if (meta && 'component' in meta) {
      const metaWithComponent = meta as StorybookMeta & { component: any };
      if (metaWithComponent.component) {
        componentName = this.extractComponentName(metaWithComponent.component);
        componentPath = this.extractComponentPath(dependencies, componentName);
      }
    }

    return {
      meta,
      stories,
      dependencies: this.filterDependencies(dependencies),
      componentName,
      componentPath,
    };
  }

  /**
   * Extract meta object from expression
   */
  private extractMeta(expression: ts.Expression): StorybookMeta {
    const meta: StorybookMeta = {};

    if (ts.isObjectLiteralExpression(expression)) {
      for (const property of expression.properties) {
        if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
          const key = property.name.text;
          const value = this.extractValue(property.initializer);
          
          switch (key) {
            case 'title':
              meta.title = value as string;
              break;
            case 'component':
              meta.component = value;
              break;
            case 'decorators':
              meta.decorators = value as any[];
              break;
            case 'parameters':
              meta.parameters = value as Record<string, any>;
              break;
            case 'args':
              meta.args = value as Record<string, any>;
              break;
            case 'argTypes':
              meta.argTypes = value as Record<string, any>;
              break;
            case 'tags':
              meta.tags = value as string[];
              break;
          }
        }
      }
    }

    return meta;
  }

  /**
   * Extract story object from expression
   */
  private extractStory(expression: ts.Expression): StorybookStory | null {
    const story: StorybookStory = {};

    if (ts.isObjectLiteralExpression(expression)) {
      for (const property of expression.properties) {
        if (ts.isPropertyAssignment(property) && ts.isIdentifier(property.name)) {
          const key = property.name.text;
          const value = this.extractValue(property.initializer);
          
          switch (key) {
            case 'name':
              story.name = value as string;
              break;
            case 'args':
              story.args = value as Record<string, any>;
              break;
            case 'parameters':
              story.parameters = value as Record<string, any>;
              break;
            case 'decorators':
              story.decorators = value as any[];
              break;
            case 'render':
              story.render = value;
              break;
            case 'play':
              story.play = value;
              break;
            case 'tags':
              story.tags = value as string[];
              break;
          }
        }
      }
      return story;
    }

    return null;
  }

  /**
   * Find story declaration by name
   */
  private findStoryDeclaration(sourceFile: ts.SourceFile, storyName: string): StorybookStory | null {
    let story: StorybookStory | null = null;

    const visit = (node: ts.Node) => {
      if (ts.isVariableStatement(node)) {
        for (const declaration of node.declarationList.declarations) {
          if (ts.isIdentifier(declaration.name) && declaration.name.text === storyName) {
            if (declaration.initializer) {
              story = this.extractStory(declaration.initializer);
            }
          }
        }
      }
      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return story;
  }

  /**
   * Extract value from TypeScript expression
   */
  private extractValue(expression: ts.Expression): any {
    if (ts.isStringLiteral(expression)) {
      return expression.text;
    }
    
    if (ts.isNumericLiteral(expression)) {
      return Number(expression.text);
    }
    
    if (expression.kind === ts.SyntaxKind.TrueKeyword) {
      return true;
    }
    
    if (expression.kind === ts.SyntaxKind.FalseKeyword) {
      return false;
    }
    
    if (expression.kind === ts.SyntaxKind.NullKeyword) {
      return null;
    }

    if (ts.isArrayLiteralExpression(expression)) {
      return expression.elements.map(element => this.extractValue(element));
    }

    if (ts.isObjectLiteralExpression(expression)) {
      const obj: Record<string, any> = {};
      for (const property of expression.properties) {
        if (ts.isPropertyAssignment(property)) {
          let key: string;
          if (ts.isIdentifier(property.name)) {
            key = property.name.text;
          } else if (ts.isStringLiteral(property.name)) {
            key = property.name.text;
          } else {
            continue;
          }
          obj[key] = this.extractValue(property.initializer);
        }
      }
      return obj;
    }

    if (ts.isIdentifier(expression)) {
      return expression.text;
    }

    // For complex expressions, return a string representation
    return expression.getText();
  }

  /**
   * Extract component name from component reference
   */
  private extractComponentName(component: any): string {
    if (typeof component === 'string') {
      return component;
    }
    
    // Try to extract from identifier or property access
    const componentStr = String(component);
    const match = componentStr.match(/([A-Z][a-zA-Z0-9]*)/);
    return match ? match[1]! : 'UnknownComponent';
  }

  /**
   * Extract component path from dependencies
   */
  private extractComponentPath(dependencies: string[], componentName: string): string {
    // Look for relative imports that might contain the component
    const relativeDeps = dependencies.filter(dep => dep.startsWith('.'));
    
    for (const dep of relativeDeps) {
      if (dep.toLowerCase().includes(componentName.toLowerCase()) || 
          dep.includes('component')) {
        return dep;
      }
    }

    return relativeDeps[0] || '';
  }

  /**
   * Filter dependencies to only include relevant ones
   */
  private filterDependencies(dependencies: string[]): string[] {
    return dependencies.filter(dep => {
      // Exclude Storybook-specific imports
      if (dep.startsWith('@storybook/')) return false;
      if (dep === 'react' || dep === 'react-dom') return false;
      
      return true;
    });
  }

  /**
   * Load TypeScript configuration
   */
  private loadTsConfig(): ts.CompilerOptions {
    const defaultOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      skipLibCheck: true,
    };

    if (this.configPath) {
      try {
        const configFile = ts.readConfigFile(this.configPath, ts.sys.readFile);
        if (configFile.config) {
          const parsedConfig = ts.parseJsonConfigFileContent(
            configFile.config,
            ts.sys,
            path.dirname(this.configPath)
          );
          return { ...defaultOptions, ...parsedConfig.options };
        }
      } catch (error) {
        // Fall back to default options
      }
    }

    return defaultOptions;
  }
}

