import { Command } from 'commander';
import { SyncOrchestrator } from '../../analyzer';

export const exportCommand = new Command('export')
  .description('Export Storybook stories to registry JSON format')
  .option('-f, --format <type>', 'Output format (registry|individual)', 'registry')
  .option('--include-examples', 'Include story examples in output')
  .option('-o, --output <path>', 'Output directory path')
  .option('-c, --config <path>', 'Path to configuration file')
  .action(async (options) => {
    try {
      console.log('📤 Starting export operation...');
      
      const orchestrator = await SyncOrchestrator.fromConfig(options.config);
      
      const result = await orchestrator.export({
        format: options.format as 'registry' | 'individual',
        includeExamples: options.includeExamples,
        outputPath: options.output,
      });

      if (result.success) {
        console.log('✅ Export completed successfully');
        console.log(`📦 Generated ${result.items.length} registry items`);
        
        if (options.format === 'registry') {
          console.log('📄 Registry file: registry.json');
        } else {
          console.log(`📄 Individual files: ${result.items.length} JSON files`);
        }
      } else {
        console.error('❌ Export failed');
        if (result.errors) {
          for (const error of result.errors) {
            console.error(`   ${error.message}`);
          }
        }
        process.exit(1);
      }

    } catch (error) {
      console.error('❌ Export failed:', (error as Error).message);
      process.exit(1);
    }
  });

