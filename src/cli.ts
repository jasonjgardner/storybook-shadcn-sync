#!/usr/bin/env node

import { Command } from 'commander';
import { version } from '../package.json';
import { initCommand } from './cli/commands/init';
import { syncCommand } from './cli/commands/sync';
import { exportCommand } from './cli/commands/export';
import { validateCommand } from './cli/commands/validate';

const program = new Command();

program
  .name('storybook-sync')
  .description('A tool for syncing Storybook stories with shadcn/ui components')
  .version(version);

// Register commands
program.addCommand(initCommand);
program.addCommand(syncCommand);
program.addCommand(exportCommand);
program.addCommand(validateCommand);

// Parse command line arguments
program.parse();

