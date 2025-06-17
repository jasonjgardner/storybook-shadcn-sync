import * as fs from 'fs-extra';
import * as path from 'path';
import { SyncConfig } from '../types';
import { createError } from './index';

/**
 * Load configuration from file or use defaults
 */
export async function loadConfig(configPath?: string): Promise<SyncConfig> {
  const defaultConfigPath = path.join(process.cwd(), 'storybook-sync.config.json');
  const finalConfigPath = configPath || defaultConfigPath;

  try {
    if (await fs.pathExists(finalConfigPath)) {
      const configContent = await fs.readJson(finalConfigPath);
      return validateAndMergeConfig(configContent);
    } else {
      console.warn(`⚠️  Configuration file not found at ${finalConfigPath}, using defaults`);
      return getDefaultConfig();
    }
  } catch (error) {
    throw createError(
      `Failed to load configuration: ${(error as Error).message}`,
      'CONFIG_LOAD_ERROR',
      finalConfigPath
    );
  }
}

/**
 * Get default configuration
 */
export function getDefaultConfig(): SyncConfig {
  return {
    input: {
      storybookPath: './src/stories',
      componentsPath: './src/components',
      storiesPattern: '**/*.stories.@(js|jsx|ts|tsx)',
      tsconfigPath: './tsconfig.json',
    },
    output: {
      registryPath: './registry',
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
}

/**
 * Validate and merge configuration with defaults
 */
function validateAndMergeConfig(userConfig: Partial<SyncConfig>): SyncConfig {
  const defaultConfig = getDefaultConfig();
  
  // Deep merge configuration
  const mergedConfig: SyncConfig = {
    input: {
      ...defaultConfig.input,
      ...userConfig.input,
    },
    output: {
      ...defaultConfig.output,
      ...userConfig.output,
    },
    mapping: {
      ...defaultConfig.mapping,
      ...userConfig.mapping,
      componentTypeRules: userConfig.mapping?.componentTypeRules || defaultConfig.mapping.componentTypeRules,
      dependencyMapping: {
        ...defaultConfig.mapping.dependencyMapping,
        ...userConfig.mapping?.dependencyMapping,
      },
      excludePatterns: userConfig.mapping?.excludePatterns || defaultConfig.mapping.excludePatterns,
    },
    generation: {
      ...defaultConfig.generation,
      ...userConfig.generation,
    },
  };

  // Validate required fields
  if (!mergedConfig.input.storybookPath) {
    throw createError('storybookPath is required in configuration', 'CONFIG_VALIDATION_ERROR');
  }

  if (!mergedConfig.input.componentsPath) {
    throw createError('componentsPath is required in configuration', 'CONFIG_VALIDATION_ERROR');
  }

  if (!mergedConfig.output.registryPath) {
    throw createError('registryPath is required in configuration', 'CONFIG_VALIDATION_ERROR');
  }

  if (!mergedConfig.output.registryName) {
    throw createError('registryName is required in configuration', 'CONFIG_VALIDATION_ERROR');
  }

  return mergedConfig;
}

/**
 * Save configuration to file
 */
export async function saveConfig(config: SyncConfig, configPath?: string): Promise<void> {
  const defaultConfigPath = path.join(process.cwd(), 'storybook-sync.config.json');
  const finalConfigPath = configPath || defaultConfigPath;

  try {
    await fs.writeJson(finalConfigPath, config, { spaces: 2 });
  } catch (error) {
    throw createError(
      `Failed to save configuration: ${(error as Error).message}`,
      'CONFIG_SAVE_ERROR',
      finalConfigPath
    );
  }
}

