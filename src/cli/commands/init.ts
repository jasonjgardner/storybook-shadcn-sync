import { Command } from 'commander';
import { SyncOrchestrator } from '../../analyzer';

export const initCommand = new Command('init')
  .description('Initialize storybook-sync configuration')
  .option('-f, --force', 'Overwrite existing configuration')
  .option('-t, --template <n>', 'Use a specific template')
  .option('--storybook-path <path>', 'Path to Storybook files')
  .option('--components-path <path>', 'Path to component files')
  .option('--output-path <path>', 'Path for registry output')
  .action(async (options) => {
    try {
      console.log('🚀 Initializing storybook-sync configuration...');
      
      // Create orchestrator with default config for initialization
      const orchestrator = new SyncOrchestrator({
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
          componentTypeRules: [],
          dependencyMapping: {},
          excludePatterns: [],
        },
        generation: {
          generateIndividualItems: true,
          includeStoryExamples: true,
          validateOutput: true,
        },
      });

      await orchestrator.initialize({
        force: options.force,
        template: options.template,
        storybookPath: options.storybookPath,
        componentsPath: options.componentsPath,
        outputPath: options.outputPath,
      });

    } catch (error) {
      console.error('❌ Initialization failed:', (error as Error).message);
      process.exit(1);
    }
  });

