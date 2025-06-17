import { 
  ParsedStoryFile, 
  ComponentAnalysis, 
  ComponentComplexity,
  ComponentFile,
  PropInfo,
  StoryInfo,
  QualityMetrics,
  QualityIssue,
  DependencyInfo,
  RegistryItemType 
} from '../types';
import * as path from 'path';
import * as fs from 'fs-extra';

export class ComponentAnalyzer {
  /**
   * Analyze a component from its story file
   */
  async analyzeComponent(storyFile: ParsedStoryFile): Promise<ComponentAnalysis> {
    const name = storyFile.componentName;
    const complexity = await this.analyzeComplexity(storyFile);
    const dependencies = this.analyzeDependencies(storyFile);
    const files = await this.analyzeFiles(storyFile);
    const props = this.analyzeProps(storyFile);
    const stories = this.analyzeStories(storyFile);
    const quality = this.analyzeQuality(storyFile, complexity, stories);
    const type = this.determineComponentType(complexity, dependencies, files);

    return {
      name,
      type,
      complexity,
      dependencies,
      files,
      props,
      stories,
      quality,
    };
  }

  /**
   * Analyze multiple components
   */
  async analyzeComponents(storyFiles: ParsedStoryFile[]): Promise<ComponentAnalysis[]> {
    const analyses: ComponentAnalysis[] = [];

    for (const storyFile of storyFiles) {
      try {
        const analysis = await this.analyzeComponent(storyFile);
        analyses.push(analysis);
      } catch (error) {
        console.warn(`Failed to analyze component ${storyFile.componentName}:`, error);
        // Create minimal analysis for failed components
        analyses.push(this.createMinimalAnalysis(storyFile));
      }
    }

    return analyses;
  }

  /**
   * Analyze component complexity
   */
  private async analyzeComplexity(storyFile: ParsedStoryFile): Promise<ComponentComplexity> {
    let fileCount = 1; // At least the story file
    let lineCount = 0;
    let dependencyCount = storyFile.dependencies.length;
    let propCount = 0;
    let storyCount = Object.keys(storyFile.stories).length;

    // Count lines in story file
    try {
      const content = await fs.readFile(storyFile.filePath, 'utf8');
      lineCount = content.split('\n').length;
    } catch {
      lineCount = 100; // Default estimate
    }

    // Count component files if component path exists
    if (storyFile.componentPath) {
      try {
        const componentContent = await fs.readFile(storyFile.componentPath, 'utf8');
        lineCount += componentContent.split('\n').length;
        fileCount++;

        // Try to count props from component file
        const propMatches = componentContent.match(/(\w+):\s*\w+/g);
        propCount = propMatches ? propMatches.length : 0;
      } catch {
        // Component file not accessible
      }
    }

    // Calculate complexity score (0-100)
    const score = Math.min(100, 
      (fileCount * 10) + 
      (Math.min(lineCount, 1000) / 10) + 
      (dependencyCount * 5) + 
      (propCount * 2) + 
      (storyCount * 3)
    );

    return {
      fileCount,
      lineCount,
      dependencyCount,
      propCount,
      storyCount,
      score: Math.round(score),
    };
  }

  /**
   * Analyze component dependencies
   */
  private analyzeDependencies(storyFile: ParsedStoryFile): DependencyInfo[] {
    const dependencies: DependencyInfo[] = [];

    for (const dep of storyFile.dependencies) {
      if (dep.startsWith('.')) {
        // Internal dependency
        dependencies.push({
          name: dep,
          type: 'internal',
          path: this.resolveRelativePath(dep, storyFile.filePath),
        });
      } else if (dep.startsWith('@') || !dep.includes('/')) {
        // NPM package
        dependencies.push({
          name: dep,
          type: 'npm',
        });
      } else {
        // Registry or other external dependency
        dependencies.push({
          name: dep,
          type: 'registry',
        });
      }
    }

    return dependencies;
  }

  /**
   * Analyze component files
   */
  private async analyzeFiles(storyFile: ParsedStoryFile): Promise<ComponentFile[]> {
    const files: ComponentFile[] = [];

    // Add story file
    files.push({
      path: storyFile.filePath,
      type: 'story',
      size: await this.getFileSize(storyFile.filePath),
      exports: Object.keys(storyFile.stories),
    });

    // Add component file if exists
    if (storyFile.componentPath) {
      files.push({
        path: storyFile.componentPath,
        type: 'component',
        size: await this.getFileSize(storyFile.componentPath),
        exports: [storyFile.componentName],
      });
    }

    return files;
  }

  /**
   * Analyze component props from stories
   */
  private analyzeProps(storyFile: ParsedStoryFile): PropInfo[] {
    const propMap = new Map<string, PropInfo>();

    // Extract props from meta args
    if (storyFile.meta.args) {
      for (const [name, value] of Object.entries(storyFile.meta.args)) {
        propMap.set(name, {
          name,
          type: typeof value,
          required: false,
          defaultValue: value,
        });
      }
    }

    // Extract props from story args
    for (const story of Object.values(storyFile.stories)) {
      if (story.args) {
        for (const [name, value] of Object.entries(story.args)) {
          if (!propMap.has(name)) {
            propMap.set(name, {
              name,
              type: typeof value,
              required: false,
              defaultValue: value,
            });
          }
        }
      }
    }

    // Extract props from argTypes
    if (storyFile.meta.argTypes) {
      for (const [name, argType] of Object.entries(storyFile.meta.argTypes)) {
        const existing = propMap.get(name);
        if (existing) {
          // Update with argType information
          if (typeof argType === 'object' && argType !== null) {
            const argTypeObj = argType as any;
            existing.type = argTypeObj.type || existing.type;
            existing.description = argTypeObj.description;
            existing.required = argTypeObj.required || false;
          }
        } else {
          // Create new prop from argType
          const argTypeObj = typeof argType === 'object' && argType !== null ? argType as any : {};
          propMap.set(name, {
            name,
            type: argTypeObj.type || 'unknown',
            required: argTypeObj.required || false,
            description: argTypeObj.description,
          });
        }
      }
    }

    return Array.from(propMap.values());
  }

  /**
   * Analyze stories
   */
  private analyzeStories(storyFile: ParsedStoryFile): StoryInfo[] {
    const stories: StoryInfo[] = [];

    for (const [name, story] of Object.entries(storyFile.stories)) {
      stories.push({
        name: story.name || name,
        args: story.args || {},
        description: story.parameters?.['docs']?.description,
        tags: story.tags || [],
      });
    }

    return stories;
  }

  /**
   * Analyze component quality
   */
  private analyzeQuality(
    storyFile: ParsedStoryFile,
    complexity: ComponentComplexity,
    stories: StoryInfo[]
  ): QualityMetrics {
    const issues: QualityIssue[] = [];
    
    // Documentation score (0-100)
    let documentationScore = 0;
    if (storyFile.meta.title) documentationScore += 20;
    if (storyFile.meta.parameters?.['docs']?.description) documentationScore += 30;
    if (stories.some(s => s.description)) documentationScore += 25;
    if (storyFile.meta.argTypes && Object.keys(storyFile.meta.argTypes).length > 0) documentationScore += 25;

    // Test coverage (estimated based on story count)
    const testCoverage = Math.min(100, stories.length * 25);

    // Story completeness (based on prop coverage)
    const storyCompleteness = stories.length > 0 ? Math.min(100, stories.length * 20) : 0;

    // Type definitions (based on argTypes presence)
    const typeDefinitions = storyFile.meta.argTypes ? 100 : 0;

    // Overall score
    const overallScore = Math.round(
      (documentationScore + testCoverage + storyCompleteness + typeDefinitions) / 4
    );

    // Generate quality issues
    if (documentationScore < 50) {
      issues.push({
        type: 'warning',
        message: 'Component lacks sufficient documentation',
        file: storyFile.filePath,
      });
    }

    if (stories.length === 0) {
      issues.push({
        type: 'error',
        message: 'No stories found for component',
        file: storyFile.filePath,
      });
    }

    if (!storyFile.meta.argTypes) {
      issues.push({
        type: 'info',
        message: 'Consider adding argTypes for better prop documentation',
        file: storyFile.filePath,
      });
    }

    if (complexity.score > 80) {
      issues.push({
        type: 'warning',
        message: 'Component has high complexity, consider breaking it down',
        file: storyFile.filePath,
      });
    }

    return {
      documentationScore,
      testCoverage,
      storyCompleteness,
      typeDefinitions,
      overallScore,
      issues,
    };
  }

  /**
   * Determine component type based on analysis
   */
  private determineComponentType(
    complexity: ComponentComplexity,
    _dependencies: DependencyInfo[],
    files: ComponentFile[]
  ): RegistryItemType {
    // High complexity or multiple files = block
    if (complexity.score > 70 || files.length > 3) {
      return 'registry:block';
    }

    // Hook pattern
    if (files.some(f => f.path.includes('use') || f.path.includes('hook'))) {
      return 'registry:hook';
    }

    // Utility/lib pattern
    if (files.some(f => f.path.includes('lib') || f.path.includes('util'))) {
      return 'registry:lib';
    }

    // UI component pattern
    if (files.some(f => f.path.includes('ui'))) {
      return 'registry:ui';
    }

    // Default to component
    return 'registry:component';
  }

  /**
   * Create minimal analysis for failed components
   */
  private createMinimalAnalysis(storyFile: ParsedStoryFile): ComponentAnalysis {
    return {
      name: storyFile.componentName,
      type: 'registry:component',
      complexity: {
        fileCount: 1,
        lineCount: 0,
        dependencyCount: storyFile.dependencies.length,
        propCount: 0,
        storyCount: Object.keys(storyFile.stories).length,
        score: 0,
      },
      dependencies: [],
      files: [],
      props: [],
      stories: [],
      quality: {
        documentationScore: 0,
        testCoverage: 0,
        storyCompleteness: 0,
        typeDefinitions: 0,
        overallScore: 0,
        issues: [{
          type: 'error',
          message: 'Failed to analyze component',
          file: storyFile.filePath,
        }],
      },
    };
  }

  /**
   * Resolve relative path
   */
  private resolveRelativePath(relativePath: string, fromFile: string): string {
    const fromDir = path.dirname(fromFile);
    return path.resolve(fromDir, relativePath);
  }

  /**
   * Get file size
   */
  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }
}

