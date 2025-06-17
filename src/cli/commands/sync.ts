import { Command } from 'commander';
import { SyncOrchestrator } from '../../analyzer';

export const syncCommand = new Command('sync')
  .description('Synchronize Storybook stories with registry format')
  .option('-w, --watch', 'Watch for file changes')
  .option('-i, --incremental', 'Only process changed files')
  .option('--validate', 'Validate output after sync')
  .option('--examples', 'Generate usage examples')
  .option('-c, --config <path>', 'Path to configuration file')
  .action(async (options) => {
    try {
      console.log('🔄 Starting sync operation...');
      
      const orchestrator = await SyncOrchestrator.fromConfig(options.config);
      
      if (options.watch) {
        console.log('👀 Watch mode not yet implemented');
        // TODO: Implement watch mode with chokidar
        return;
      }

      const result = await orchestrator.sync({
        incremental: options.incremental,
        validate: options.validate,
        generateExamples: options.examples,
        ...(options.incremental && { since: new Date(Date.now() - 24 * 60 * 60 * 1000) }), // Last 24 hours
      });

      if (result.success) {
        console.log('✅ Sync completed successfully');
        
        if (result.errors && result.errors.length > 0) {
          console.log(`⚠️  ${result.errors.length} files had errors but sync continued`);
        }
      } else {
        console.error('❌ Sync failed');
        if (result.errors) {
          for (const error of result.errors) {
            console.error(`   ${error.message}`);
          }
        }
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Sync failed:', (error as Error).message);
      process.exit(1);
    }
  });

