import { Command } from 'commander';
import { SyncOrchestrator } from '../../analyzer';

export const validateCommand = new Command('validate')
  .description('Validate configuration and output files')
  .option('--fix', 'Automatically fix issues where possible')
  .option('-r, --report-format <type>', 'Report format (text|json|html)', 'text')
  .option('-c, --config <path>', 'Path to configuration file')
  .action(async (options) => {
    try {
      console.log('🔍 Validating configuration and setup...');
      
      const orchestrator = await SyncOrchestrator.fromConfig(options.config);
      
      const validation = await orchestrator.validate();
      
      if (options.reportFormat === 'json') {
        console.log(JSON.stringify(validation, null, 2));
        return;
      }

      // Text format output
      console.log('\n📋 Validation Results:');
      console.log('='.repeat(50));
      
      let errorCount = 0;
      let warningCount = 0;
      let infoCount = 0;

      for (const issue of validation.issues) {
        const icon = issue.type === 'error' ? '❌' : 
                    issue.type === 'warning' ? '⚠️' : 'ℹ️';
        
        console.log(`${icon} ${issue.message}`);
        if (issue.file) {
          console.log(`   File: ${issue.file}`);
        }
        
        if (issue.type === 'error') errorCount++;
        else if (issue.type === 'warning') warningCount++;
        else infoCount++;
      }

      console.log('\n📊 Summary:');
      console.log(`   Errors: ${errorCount}`);
      console.log(`   Warnings: ${warningCount}`);
      console.log(`   Info: ${infoCount}`);

      if (validation.valid) {
        console.log('\n✅ Configuration is valid and ready to use');
      } else {
        console.log('\n❌ Configuration has errors that need to be fixed');
        process.exit(1);
      }

      if (options.fix && (errorCount > 0 || warningCount > 0)) {
        console.log('\n🔧 Auto-fix functionality not yet implemented');
        // TODO: Implement auto-fix functionality
      }

    } catch (error) {
      console.error('❌ Validation failed:', (error as Error).message);
      process.exit(1);
    }
  });

