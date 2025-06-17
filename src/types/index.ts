/**
 * Storybook Component Story Format (CSF) Types
 */

export interface StorybookMeta {
  title?: string;
  component?: any;
  decorators?: any[];
  parameters?: Record<string, any>;
  args?: Record<string, any>;
  argTypes?: Record<string, any>;
  tags?: string[];
}

export interface StorybookStory {
  name?: string;
  args?: Record<string, any>;
  parameters?: Record<string, any>;
  decorators?: any[];
  render?: any;
  play?: any;
  tags?: string[];
}

export interface ParsedStoryFile {
  filePath: string;
  meta: StorybookMeta;
  stories: Record<string, StorybookStory>;
  dependencies: string[];
  componentName: string;
  componentPath: string;
}

/**
 * shadcn/ui Registry Types
 */

export interface RegistryFile {
  path: string;
  type: RegistryFileType;
  target?: string;
}

export type RegistryFileType =
  | 'registry:component'
  | 'registry:ui'
  | 'registry:lib'
  | 'registry:hook'
  | 'registry:block'
  | 'registry:page'
  | 'registry:file'
  | 'registry:style'
  | 'registry:theme';

export type RegistryItemType =
  | 'registry:component'
  | 'registry:ui'
  | 'registry:lib'
  | 'registry:hook'
  | 'registry:block'
  | 'registry:page'
  | 'registry:file'
  | 'registry:style'
  | 'registry:theme';

export interface RegistryItem {
  $schema?: string;
  name: string;
  type: RegistryItemType;
  title: string;
  description: string;
  author?: string;
  dependencies?: string[];
  registryDependencies?: string[];
  files: RegistryFile[];
  cssVars?: {
    theme?: Record<string, string>;
    light?: Record<string, string>;
    dark?: Record<string, string>;
  };
  tailwind?: {
    config?: Record<string, any>;
  };
}

export interface Registry {
  $schema: string;
  name: string;
  homepage?: string;
  items: RegistryItem[];
}

/**
 * Tool Configuration Types
 */

export interface SyncConfigInput {
  storybookPath: string;
  storiesPattern: string;
  componentsPath: string;
  tsconfigPath?: string;
}

export interface SyncConfigOutput {
  registryPath: string;
  registryName: string;
  homepage?: string;
}

export interface SyncConfig {
  input: SyncConfigInput;
  output: SyncConfigOutput;
  mapping: {
    componentTypeRules: ComponentTypeRule[];
    dependencyMapping: Record<string, string>;
    excludePatterns: string[];
  };
  generation: {
    includeStoryExamples: boolean;
    generateIndividualItems: boolean;
    validateOutput: boolean;
  };
}

export interface ComponentTypeRule {
  pattern: string;
  type: RegistryItemType;
  condition?: 'fileCount' | 'complexity' | 'dependencies';
  threshold?: number;
}

/**
 * Analysis Types
 */

export interface ComponentAnalysis {
  name: string;
  type: RegistryItemType;
  complexity: ComponentComplexity;
  dependencies: DependencyInfo[];
  files: ComponentFile[];
  props: PropInfo[];
  stories: StoryInfo[];
  quality: QualityMetrics;
}

export interface ComponentComplexity {
  fileCount: number;
  lineCount: number;
  dependencyCount: number;
  propCount: number;
  storyCount: number;
  score: number;
}

export interface DependencyInfo {
  name: string;
  type: 'npm' | 'internal' | 'registry';
  version?: string;
  path?: string;
}

export interface ComponentFile {
  path: string;
  type: 'component' | 'story' | 'test' | 'style' | 'doc';
  size: number;
  exports: string[];
}

export interface PropInfo {
  name: string;
  type: string;
  required: boolean;
  defaultValue?: any;
  description?: string;
}

export interface StoryInfo {
  name: string;
  args: Record<string, any>;
  description?: string;
  tags: string[];
}

export interface QualityMetrics {
  documentationScore: number;
  testCoverage: number;
  storyCompleteness: number;
  typeDefinitions: number;
  overallScore: number;
  issues: QualityIssue[];
}

export interface QualityIssue {
  type: 'warning' | 'error' | 'info';
  message: string;
  file?: string;
  line?: number;
}

/**
 * CLI Types
 */

export interface CLIOptions {
  config?: string;
  verbose?: boolean;
  dryRun?: boolean;
  watch?: boolean;
  output?: string;
}

export interface InitOptions extends CLIOptions {
  force?: boolean;
  template?: string;
}

export interface SyncOptions extends CLIOptions {
  incremental?: boolean;
  validate?: boolean;
}

export interface ExportOptions extends CLIOptions {
  format?: 'registry' | 'individual';
  includeExamples?: boolean;
}

export interface ValidateOptions extends CLIOptions {
  fix?: boolean;
  reportFormat?: 'text' | 'json' | 'html';
}


// Re-export sync types
export * from './sync';

