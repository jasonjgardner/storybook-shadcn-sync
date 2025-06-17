import { 
  StorybookParser, 
  FileDiscovery
} from '../parser';
import { 
  RegistryGenerator, 
  ComponentAnalyzer, 
  ExampleGenerator 
} from '../generator';
import { 
  SyncConfig, 
  ParsedStoryFile, 
  Registry, 
  RegistryItem,
  SyncResult,
  SyncStats 
} from '../types';
import { 
  loadConfig, 
  createError, 
  writeJsonFile, 
  ensureDir
} from '../utils';
import * as path from 'path';
import * as fs from 'fs-extra';

export class SyncOrchestrator {
  private parser: StorybookParser;
  private discovery: FileDiscovery;
  private registryGenerator: RegistryGenerator;
  private componentAnalyzer: ComponentAnalyzer;
  private exampleGenerator: ExampleGenerator;

  constructor(private config: SyncConfig) {
    this.parser = new StorybookParser(config.input.tsconfigPath);
    this.discovery = new FileDiscovery(config);
    this.registryGenerator = new RegistryGenerator(config);
    this.componentAnalyzer = new ComponentAnalyzer();
    this.exampleGenerator = new ExampleGenerator();
  }

  /**
   * Perform complete sync operation
   */
  async sync(options: {
    incremental?: boolean;
    validate?: boolean;
    generateExamples?: boolean;
    since?: Date;
  } = {}): Promise<SyncResult> {
    const startTime = Date.now();
    const stats: SyncStats = {
      filesProcessed: 0,
      componentsGenerated: 0,
      errorsCount: 0,
      warningsCount: 0,
      duration: 0,
    };

    try {
      // Step 1: Discover story files
      console.log('🔍 Discovering story files...');
      let storyFiles = await this.discovery.discoverStoryFiles();
      
      if (options.incremental && options.since) {
        storyFiles = await this.discovery.filterChangedFiles(storyFiles, options.since);
      }

      if (storyFiles.length === 0) {
        console.log('ℹ️  No story files found or no changes detected');
        return {
          success: true,
          registry: { $schema: '', name: '', items: [] },
          items: [],
          stats: { ...stats, duration: Date.now() - startTime },
        };
      }

      console.log(`📁 Found ${storyFiles.length} story files`);

      // Step 2: Parse story files
      console.log('📖 Parsing story files...');
      const parsedFiles: ParsedStoryFile[] = [];
      const parseErrors: Error[] = [];

      for (const filePath of storyFiles) {
        try {
          const parsed = await this.parser.parseStoryFile(filePath);
          parsedFiles.push(parsed);
          stats.filesProcessed++;
        } catch (error) {
          parseErrors.push(error as Error);
          stats.errorsCount++;
          console.warn(`⚠️  Failed to parse ${filePath}:`, (error as Error).message);
        }
      }

      if (parsedFiles.length === 0) {
        throw createError(
          'No story files could be parsed successfully',
          'PARSE_ALL_FAILED'
        );
      }

      console.log(`✅ Parsed ${parsedFiles.length} story files`);

      // Step 3: Analyze components
      console.log('🔬 Analyzing components...');
      const analyses = await this.componentAnalyzer.analyzeComponents(parsedFiles);
      
      // Count warnings from quality analysis
      for (const analysis of analyses) {
        stats.warningsCount += analysis.quality.issues.filter(i => i.type === 'warning').length;
        stats.errorsCount += analysis.quality.issues.filter(i => i.type === 'error').length;
      }

      // Step 4: Generate registry
      console.log('🏗️  Generating registry...');
      const { registry, items } = await this.registryGenerator.generateAndWrite(
        parsedFiles,
        analyses
      );

      stats.componentsGenerated = items.length;
      console.log(`📦 Generated ${items.length} registry items`);

      // Step 5: Generate examples if requested
      if (options.generateExamples) {
        console.log('📝 Generating examples...');
        await this.generateExamples(parsedFiles, items);
      }

      // Step 6: Validate if requested
      if (options.validate) {
        console.log('✅ Validating output...');
        await this.validateOutput(registry, items);
      }

      // Step 7: Generate summary
      const duration = Date.now() - startTime;
      stats.duration = duration;

      console.log(`🎉 Sync completed in ${this.formatDuration(duration)}`);
      console.log(`   Files processed: ${stats.filesProcessed}`);
      console.log(`   Components generated: ${stats.componentsGenerated}`);
      if (stats.errorsCount > 0) {
        console.log(`   Errors: ${stats.errorsCount}`);
      }
      if (stats.warningsCount > 0) {
        console.log(`   Warnings: ${stats.warningsCount}`);
      }

      return {
        success: true,
        registry,
        items,
        stats,
        errors: parseErrors,
      };

    } catch (error) {
      const duration = Date.now() - startTime;
      stats.duration = duration;
      stats.errorsCount++;

      console.error('❌ Sync failed:', (error as Error).message);

      return {
        success: false,
        registry: { $schema: '', name: '', items: [] },
        items: [],
        stats,
        errors: [error as Error],
      };
    }
  }

  /**
   * Export stories to registry format without full sync
   */
  async export(options: {
    format?: 'registry' | 'individual';
    includeExamples?: boolean;
    outputPath?: string;
  } = {}): Promise<SyncResult> {
    const { format = 'registry', includeExamples = false, outputPath } = options;

    try {
      // Discover and parse files
      const storyFiles = await this.discovery.discoverStoryFiles();
      const parsedFiles = await this.parser.parseStoryFiles(storyFiles);
      
      // Analyze components
      const analyses = await this.componentAnalyzer.analyzeComponents(parsedFiles);
      
      // Generate registry
      const registry = await this.registryGenerator.generateRegistry(parsedFiles, analyses);

      // Write output
      const outputDir = outputPath || this.config.output.registryPath;
      await ensureDir(outputDir);

      if (format === 'registry') {
        const registryPath = path.join(outputDir, 'registry.json');
        await writeJsonFile(registryPath, registry);
        console.log(`📄 Registry exported to ${registryPath}`);
      } else {
        // Export individual items
        for (const item of registry.items) {
          const itemPath = path.join(outputDir, `${item.name}.json`);
          await writeJsonFile(itemPath, item);
        }
        console.log(`📄 ${registry.items.length} individual items exported to ${outputDir}`);
      }

      // Generate examples if requested
      if (includeExamples) {
        await this.generateExamples(parsedFiles, registry.items, outputDir);
      }

      return {
        success: true,
        registry,
        items: registry.items,
        stats: {
          filesProcessed: parsedFiles.length,
          componentsGenerated: registry.items.length,
          errorsCount: 0,
          warningsCount: 0,
          duration: 0,
        },
      };

    } catch (error) {
      throw createError(
        `Export failed: ${(error as Error).message}`,
        'EXPORT_FAILED'
      );
    }
  }

  /**
   * Validate configuration and setup
   */
  async validate(): Promise<{
    valid: boolean;
    issues: Array<{ type: 'error' | 'warning' | 'info'; message: string; file?: string }>;
  }> {
    const issues: Array<{ type: 'error' | 'warning' | 'info'; message: string; file?: string }> = [];

    try {
      // Check if Storybook directory exists
      if (!await fs.pathExists(this.config.input.storybookPath)) {
        issues.push({
          type: 'error',
          message: `Storybook path does not exist: ${this.config.input.storybookPath}`,
        });
      }

      // Check if components directory exists
      if (!await fs.pathExists(this.config.input.componentsPath)) {
        issues.push({
          type: 'warning',
          message: `Components path does not exist: ${this.config.input.componentsPath}`,
        });
      }

      // Check if TypeScript config exists
      if (this.config.input.tsconfigPath && !await fs.pathExists(this.config.input.tsconfigPath)) {
        issues.push({
          type: 'warning',
          message: `TypeScript config not found: ${this.config.input.tsconfigPath}`,
        });
      }

      // Try to discover story files
      try {
        const storyFiles = await this.discovery.discoverStoryFiles();
        if (storyFiles.length === 0) {
          issues.push({
            type: 'warning',
            message: 'No story files found with current pattern',
          });
        } else {
          issues.push({
            type: 'info',
            message: `Found ${storyFiles.length} story files`,
          });
        }

        // Validate a sample of story files
        const sampleSize = Math.min(5, storyFiles.length);
        for (let i = 0; i < sampleSize; i++) {
          const filePath = storyFiles[i]!;
          const isValid = await this.discovery.validateStoryFile(filePath);
          if (!isValid) {
            issues.push({
              type: 'warning',
              message: 'Story file may not be in valid CSF format',
              file: filePath,
            });
          }
        }
      } catch (error) {
        issues.push({
          type: 'error',
          message: `Failed to discover story files: ${(error as Error).message}`,
        });
      }

      // Check output directory permissions
      try {
        await ensureDir(this.config.output.registryPath);
        issues.push({
          type: 'info',
          message: `Output directory is writable: ${this.config.output.registryPath}`,
        });
      } catch (error) {
        issues.push({
          type: 'error',
          message: `Cannot write to output directory: ${this.config.output.registryPath}`,
        });
      }

      const hasErrors = issues.some(issue => issue.type === 'error');
      return {
        valid: !hasErrors,
        issues,
      };

    } catch (error) {
      issues.push({
        type: 'error',
        message: `Validation failed: ${(error as Error).message}`,
      });

      return {
        valid: false,
        issues,
      };
    }
  }

  /**
   * Initialize configuration for a project
   */
  async initialize(options: {
    force?: boolean;
    template?: string;
    storybookPath?: string;
    componentsPath?: string;
    outputPath?: string;
  } = {}): Promise<void> {
    const configPath = path.join(process.cwd(), 'storybook-sync.config.json');

    // Check if config already exists
    if (!options.force && await fs.pathExists(configPath)) {
      throw createError(
        'Configuration file already exists. Use --force to overwrite.',
        'CONFIG_EXISTS'
      );
    }

    // Detect project structure
    const detectedPaths = await this.detectProjectStructure();
    
    // Create configuration
    const config: SyncConfig = {
      input: {
        storybookPath: options.storybookPath || detectedPaths.storybook || './src/stories',
        componentsPath: options.componentsPath || detectedPaths.components || './src/components',
        storiesPattern: '**/*.stories.@(js|jsx|ts|tsx)',
        tsconfigPath: detectedPaths.tsconfig || './tsconfig.json',
      },
      output: {
        registryPath: options.outputPath || './registry',
        registryName: 'my-components',
      },
      mapping: {
        componentTypeRules: [
          {
            pattern: '**/ui/**',
            type: 'registry:ui',
          },
          {
            pattern: '**/blocks/**',
            type: 'registry:block',
          },
          {
            pattern: '**/hooks/**',
            type: 'registry:hook',
          },
        ],
        dependencyMapping: {},
        excludePatterns: ['**/node_modules/**', '**/dist/**'],
      },
      generation: {
        generateIndividualItems: true,
        includeStoryExamples: true,
        validateOutput: true,
      },
    };

    // Write configuration
    await writeJsonFile(configPath, config);
    console.log(`✅ Configuration created at ${configPath}`);

    // Show detected paths
    console.log('\n📁 Detected project structure:');
    console.log(`   Storybook: ${config.input.storybookPath}`);
    console.log(`   Components: ${config.input.componentsPath}`);
    console.log(`   Output: ${config.output.registryPath}`);
    
    if (detectedPaths.tsconfig) {
      console.log(`   TypeScript config: ${detectedPaths.tsconfig}`);
    }

    console.log('\n🎯 Next steps:');
    console.log('   1. Review and customize the configuration file');
    console.log('   2. Run "storybook-sync validate" to check your setup');
    console.log('   3. Run "storybook-sync sync" to generate your registry');
  }

  /**
   * Generate examples for components
   */
  private async generateExamples(
    parsedFiles: ParsedStoryFile[],
    items: RegistryItem[],
    outputDir?: string
  ): Promise<void> {
    const examplesDir = path.join(outputDir || this.config.output.registryPath, 'examples');
    await ensureDir(examplesDir);

    for (let i = 0; i < parsedFiles.length; i++) {
      const storyFile = parsedFiles[i]!;
      const item = items[i];
      
      if (item) {
        const documentation = this.exampleGenerator.generateDocumentation(storyFile, item);
        const examplePath = path.join(examplesDir, `${item.name}.md`);
        
        const markdown = this.formatDocumentationAsMarkdown(documentation);
        await fs.writeFile(examplePath, markdown, 'utf8');
      }
    }

    console.log(`📝 Generated examples in ${examplesDir}`);
  }

  /**
   * Validate generated output
   */
  private async validateOutput(registry: Registry, items: RegistryItem[]): Promise<void> {
    // Validate registry schema
    const { RegistrySchema } = await import('../config/schemas');
    const registryValidation = RegistrySchema.safeParse(registry);
    
    if (!registryValidation.success) {
      throw createError(
        `Registry validation failed: ${registryValidation.error.message}`,
        'REGISTRY_VALIDATION_ERROR'
      );
    }

    // Validate individual items
    const { RegistryItemSchema } = await import('../config/schemas');
    for (const item of items) {
      const itemValidation = RegistryItemSchema.safeParse(item);
      if (!itemValidation.success) {
        console.warn(`⚠️  Item validation failed for ${item.name}:`, itemValidation.error.message);
      }
    }

    console.log('✅ Output validation passed');
  }

  /**
   * Detect project structure
   */
  private async detectProjectStructure(): Promise<{
    storybook?: string;
    components?: string;
    tsconfig?: string;
  }> {
    const result: { storybook?: string; components?: string; tsconfig?: string } = {};

    // Common Storybook paths
    const storybookPaths = [
      './src/stories',
      './stories',
      './.storybook',
      './src',
    ];

    for (const storybookPath of storybookPaths) {
      if (await fs.pathExists(storybookPath)) {
        result.storybook = storybookPath;
        break;
      }
    }

    // Common component paths
    const componentPaths = [
      './src/components',
      './components',
      './src/ui',
      './ui',
      './src',
    ];

    for (const componentPath of componentPaths) {
      if (await fs.pathExists(componentPath)) {
        result.components = componentPath;
        break;
      }
    }

    // TypeScript config
    const tsconfigPaths = [
      './tsconfig.json',
      './tsconfig.app.json',
      './tsconfig.base.json',
    ];

    for (const tsconfigPath of tsconfigPaths) {
      if (await fs.pathExists(tsconfigPath)) {
        result.tsconfig = tsconfigPath;
        break;
      }
    }

    return result;
  }

  /**
   * Format documentation as Markdown
   */
  private formatDocumentationAsMarkdown(doc: {
    title: string;
    description: string;
    installation: string[];
    imports: string[];
    examples: string[];
  }): string {
    const sections = [
      `# ${doc.title}`,
      '',
      doc.description,
      '',
      '## Installation',
      '',
      ...doc.installation.map(cmd => `\`\`\`bash\n${cmd}\n\`\`\``),
      '',
      '## Usage',
      '',
      ...doc.imports.map(imp => `\`\`\`tsx\n${imp}\n\`\`\``),
      '',
      '## Examples',
      '',
      ...doc.examples.map(example => `\`\`\`tsx\n${example}\n\`\`\``),
    ];

    return sections.join('\n');
  }

  /**
   * Create orchestrator from config file
   */
  static async fromConfig(configPath?: string): Promise<SyncOrchestrator> {
    const config = await loadConfig(configPath);
    return new SyncOrchestrator(config);
  }

  /**
   * Format duration in human readable format
   */
  private formatDuration(ms: number): string {
    if (ms < 1000) {
      return `${ms}ms`;
    } else if (ms < 60000) {
      return `${(ms / 1000).toFixed(1)}s`;
    } else {
      const minutes = Math.floor(ms / 60000);
      const seconds = ((ms % 60000) / 1000).toFixed(0);
      return `${minutes}m ${seconds}s`;
    }
  }
}

