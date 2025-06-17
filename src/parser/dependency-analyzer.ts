import * as ts from 'typescript';
import * as fs from 'fs-extra';
import * as path from 'path';
import { DependencyInfo } from '../types';
import { createError, normalizePath } from '../utils';

export class DependencyAnalyzer {
  constructor(private rootDir: string, configPath?: string) {
    // Load TypeScript configuration for better module resolution
    this.loadTsConfig(configPath);
  }

  /**
   * Analyze dependencies for a given file
   */
  async analyzeDependencies(filePath: string): Promise<DependencyInfo[]> {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true
      );

      const dependencies: DependencyInfo[] = [];
      const imports = this.extractImports(sourceFile);

      for (const importPath of imports) {
        const depInfo = await this.analyzeDependency(importPath, filePath);
        if (depInfo) {
          dependencies.push(depInfo);
        }
      }

      return dependencies;
    } catch (error) {
      throw createError(
        `Failed to analyze dependencies: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DEPENDENCY_ANALYSIS_ERROR',
        filePath
      );
    }
  }

  /**
   * Extract import statements from source file
   */
  private extractImports(sourceFile: ts.SourceFile): string[] {
    const imports: string[] = [];

    const visit = (node: ts.Node) => {
      if (ts.isImportDeclaration(node)) {
        const moduleSpecifier = node.moduleSpecifier;
        if (ts.isStringLiteral(moduleSpecifier)) {
          imports.push(moduleSpecifier.text);
        }
      }

      // Also check for dynamic imports
      if (ts.isCallExpression(node)) {
        if (node.expression.kind === ts.SyntaxKind.ImportKeyword) {
          const arg = node.arguments[0];
          if (arg && ts.isStringLiteral(arg)) {
            imports.push(arg.text);
          }
        }
      }

      ts.forEachChild(node, visit);
    };

    visit(sourceFile);
    return imports;
  }

  /**
   * Analyze a single dependency
   */
  private async analyzeDependency(
    importPath: string,
    fromFile: string
  ): Promise<DependencyInfo | null> {
    // Skip Storybook-specific imports
    if (importPath.startsWith('@storybook/')) {
      return null;
    }

    // Determine dependency type
    if (importPath.startsWith('.')) {
      // Relative import - internal dependency
      const resolvedPath = this.resolveRelativePath(importPath, fromFile);
      return {
        name: importPath,
        type: 'internal',
        path: resolvedPath,
      };
    } else if (importPath.startsWith('@') || !importPath.includes('/')) {
      // NPM package
      const packageInfo = await this.getPackageInfo(importPath);
      return {
        name: importPath,
        type: 'npm',
        ...(packageInfo?.version && { version: packageInfo.version }),
      };
    } else {
      // Could be a registry dependency or other external dependency
      return {
        name: importPath,
        type: 'registry',
      };
    }
  }

  /**
   * Resolve relative import path
   */
  private resolveRelativePath(importPath: string, fromFile: string): string {
    const fromDir = path.dirname(fromFile);
    const resolved = path.resolve(fromDir, importPath);
    
    // Try common extensions if file doesn't exist
    const extensions = ['.ts', '.tsx', '.js', '.jsx', '.json'];
    
    for (const ext of extensions) {
      const withExt = resolved + ext;
      if (fs.existsSync(withExt)) {
        return normalizePath(withExt);
      }
    }

    // Try index files
    for (const ext of extensions) {
      const indexFile = path.join(resolved, 'index' + ext);
      if (fs.existsSync(indexFile)) {
        return normalizePath(indexFile);
      }
    }

    return normalizePath(resolved);
  }

  /**
   * Get package information from package.json
   */
  private async getPackageInfo(packageName: string): Promise<{ version?: string } | null> {
    try {
      // Look for package.json in node_modules
      const packageJsonPath = this.findPackageJson(packageName);
      if (packageJsonPath) {
        const packageJson = await fs.readJson(packageJsonPath);
        return {
          version: packageJson.version,
        };
      }
    } catch {
      // Ignore errors, return null
    }
    return null;
  }

  /**
   * Find package.json for a given package
   */
  private findPackageJson(packageName: string): string | null {
    let currentDir = this.rootDir;
    
    while (currentDir !== path.dirname(currentDir)) {
      const nodeModulesPath = path.join(currentDir, 'node_modules', packageName, 'package.json');
      if (fs.existsSync(nodeModulesPath)) {
        return nodeModulesPath;
      }
      
      currentDir = path.dirname(currentDir);
    }
    
    return null;
  }

  /**
   * Build dependency graph for multiple files
   */
  async buildDependencyGraph(filePaths: string[]): Promise<Map<string, DependencyInfo[]>> {
    const graph = new Map<string, DependencyInfo[]>();

    for (const filePath of filePaths) {
      try {
        const dependencies = await this.analyzeDependencies(filePath);
        graph.set(normalizePath(filePath), dependencies);
      } catch (error) {
        // Log error but continue with other files
        console.warn(`Failed to analyze dependencies for ${filePath}:`, error);
        graph.set(normalizePath(filePath), []);
      }
    }

    return graph;
  }

  /**
   * Find circular dependencies
   */
  findCircularDependencies(graph: Map<string, DependencyInfo[]>): string[][] {
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    const cycles: string[][] = [];

    const dfs = (file: string, path: string[]): void => {
      if (recursionStack.has(file)) {
        // Found a cycle
        const cycleStart = path.indexOf(file);
        if (cycleStart !== -1) {
          cycles.push(path.slice(cycleStart));
        }
        return;
      }

      if (visited.has(file)) {
        return;
      }

      visited.add(file);
      recursionStack.add(file);

      const dependencies = graph.get(file) || [];
      for (const dep of dependencies) {
        if (dep.type === 'internal' && dep.path) {
          dfs(dep.path, [...path, file]);
        }
      }

      recursionStack.delete(file);
    };

    for (const file of graph.keys()) {
      if (!visited.has(file)) {
        dfs(file, []);
      }
    }

    return cycles;
  }

  /**
   * Load TypeScript configuration
   */
  private loadTsConfig(configPath?: string): ts.CompilerOptions {
    const defaultOptions: ts.CompilerOptions = {
      target: ts.ScriptTarget.ES2020,
      module: ts.ModuleKind.CommonJS,
      moduleResolution: ts.ModuleResolutionKind.NodeJs,
      esModuleInterop: true,
      allowSyntheticDefaultImports: true,
      strict: true,
      skipLibCheck: true,
    };

    if (configPath && fs.existsSync(configPath)) {
      try {
        const configFile = ts.readConfigFile(configPath, ts.sys.readFile);
        if (configFile.config) {
          const parsedConfig = ts.parseJsonConfigFileContent(
            configFile.config,
            ts.sys,
            path.dirname(configPath)
          );
          return { ...defaultOptions, ...parsedConfig.options };
        }
      } catch (error) {
        console.warn('Failed to load TypeScript config, using defaults:', error);
      }
    }

    return defaultOptions;
  }
}

