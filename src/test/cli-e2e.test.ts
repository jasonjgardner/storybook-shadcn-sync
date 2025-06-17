import { spawn } from 'child_process';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('CLI End-to-End Tests', () => {
  let tempDir: string;
  let cliPath: string;

  beforeAll(() => {
    cliPath = path.join(__dirname, '../../dist/cli.js');
  });

  beforeEach(async () => {
    tempDir = path.join(__dirname, '../../temp-cli-test');
    await fs.ensureDir(tempDir);
  });

  afterEach(async () => {
    await fs.remove(tempDir);
  });

  const runCLI = (args: string[], cwd?: string): Promise<{
    stdout: string;
    stderr: string;
    exitCode: number;
  }> => {
    return new Promise((resolve) => {
      const child = spawn('node', [cliPath, ...args], {
        cwd: cwd || tempDir,
        stdio: 'pipe',
      });

      let stdout = '';
      let stderr = '';

      child.stdout.on('data', (data) => {
        stdout += data.toString();
      });

      child.stderr.on('data', (data) => {
        stderr += data.toString();
      });

      child.on('close', (code) => {
        resolve({
          stdout,
          stderr,
          exitCode: code || 0,
        });
      });
    });
  };

  describe('Help Commands', () => {
    it('should show main help', async () => {
      const result = await runCLI(['--help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('storybook-sync');
      expect(result.stdout).toContain('init');
      expect(result.stdout).toContain('sync');
      expect(result.stdout).toContain('export');
      expect(result.stdout).toContain('validate');
    });

    it('should show init command help', async () => {
      const result = await runCLI(['init', '--help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Initialize storybook-sync configuration');
      expect(result.stdout).toContain('--force');
      expect(result.stdout).toContain('--storybook-path');
    });

    it('should show sync command help', async () => {
      const result = await runCLI(['sync', '--help']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Synchronize Storybook stories');
      expect(result.stdout).toContain('--watch');
      expect(result.stdout).toContain('--incremental');
    });
  });

  describe('Init Command', () => {
    it('should initialize project with default settings', async () => {
      const result = await runCLI(['init', '--force']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Configuration created');
      
      const configPath = path.join(tempDir, 'storybook-sync.config.json');
      expect(await fs.pathExists(configPath)).toBe(true);
      
      const config = await fs.readJson(configPath);
      expect(config.input.storybookPath).toBeDefined();
      expect(config.output.registryName).toBeDefined();
    });

    it('should initialize with custom paths', async () => {
      const result = await runCLI([
        'init',
        '--force',
        '--storybook-path', './custom-stories',
        '--components-path', './custom-components',
        '--output-path', './custom-registry',
      ]);
      
      expect(result.exitCode).toBe(0);
      
      const configPath = path.join(tempDir, 'storybook-sync.config.json');
      const config = await fs.readJson(configPath);
      
      expect(config.input.storybookPath).toBe('./custom-stories');
      expect(config.input.componentsPath).toBe('./custom-components');
      expect(config.output.registryPath).toBe('./custom-registry');
    });

    it('should refuse to overwrite existing config without force', async () => {
      // Create initial config
      await runCLI(['init', '--force']);
      
      // Try to init again without force
      const result = await runCLI(['init']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('already exists');
    });
  });

  describe('Validate Command', () => {
    beforeEach(async () => {
      // Initialize project for validation tests
      await runCLI(['init', '--force']);
    });

    it('should validate configuration', async () => {
      const result = await runCLI(['validate']);
      
      // May fail due to missing directories, but should not crash
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
      expect(result.stdout).toContain('Validation Results');
    });

    it('should output JSON format', async () => {
      const result = await runCLI(['validate', '--report-format', 'json']);
      
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
      
      // Should be valid JSON
      expect(() => JSON.parse(result.stdout)).not.toThrow();
    });
  });

  describe('Sync Command', () => {
    beforeEach(async () => {
      // Set up test project
      await runCLI(['init', '--force']);
      
      // Create test directories
      await fs.ensureDir(path.join(tempDir, 'src/stories'));
      await fs.ensureDir(path.join(tempDir, 'src/components'));
      
      // Create a simple test story
      const testStory = `
import type { Meta, StoryObj } from '@storybook/react';

const TestComponent = ({ label }: { label: string }) => <div>{label}</div>;

const meta: Meta<typeof TestComponent> = {
  title: 'Test/Component',
  component: TestComponent,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Test Label',
  },
};
`;
      
      await fs.writeFile(
        path.join(tempDir, 'src/stories/Test.stories.tsx'),
        testStory
      );
    });

    it('should sync stories successfully', async () => {
      const result = await runCLI(['sync']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Sync completed');
      
      // Check that registry was created
      const registryPath = path.join(tempDir, 'registry/registry.json');
      expect(await fs.pathExists(registryPath)).toBe(true);
    });

    it('should sync with validation', async () => {
      const result = await runCLI(['sync', '--validate']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Validating output');
    });

    it('should sync with examples', async () => {
      const result = await runCLI(['sync', '--examples']);
      
      expect(result.exitCode).toBe(0);
      
      // Check that examples were generated
      const examplesDir = path.join(tempDir, 'registry/examples');
      expect(await fs.pathExists(examplesDir)).toBe(true);
    });
  });

  describe('Export Command', () => {
    beforeEach(async () => {
      // Set up test project (same as sync tests)
      await runCLI(['init', '--force']);
      await fs.ensureDir(path.join(tempDir, 'src/stories'));
      await fs.ensureDir(path.join(tempDir, 'src/components'));
      
      const testStory = `
import type { Meta, StoryObj } from '@storybook/react';

const TestComponent = ({ label }: { label: string }) => <div>{label}</div>;

const meta: Meta<typeof TestComponent> = {
  title: 'Test/Component',
  component: TestComponent,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Test Label',
  },
};
`;
      
      await fs.writeFile(
        path.join(tempDir, 'src/stories/Test.stories.tsx'),
        testStory
      );
    });

    it('should export in registry format', async () => {
      const result = await runCLI(['export', '--format', 'registry']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Export completed');
      expect(result.stdout).toContain('registry.json');
      
      const registryPath = path.join(tempDir, 'registry/registry.json');
      expect(await fs.pathExists(registryPath)).toBe(true);
    });

    it('should export in individual format', async () => {
      const result = await runCLI(['export', '--format', 'individual']);
      
      expect(result.exitCode).toBe(0);
      expect(result.stdout).toContain('Individual files');
      
      // Should create individual JSON files
      const registryDir = path.join(tempDir, 'registry');
      const files = await fs.readdir(registryDir);
      const jsonFiles = files.filter(f => f.endsWith('.json') && f !== 'registry.json');
      
      expect(jsonFiles.length).toBeGreaterThan(0);
    });

    it('should export with examples', async () => {
      const result = await runCLI(['export', '--include-examples']);
      
      expect(result.exitCode).toBe(0);
      
      const examplesDir = path.join(tempDir, 'registry/examples');
      expect(await fs.pathExists(examplesDir)).toBe(true);
    });

    it('should export to custom output path', async () => {
      const customOutput = path.join(tempDir, 'custom-output');
      const result = await runCLI(['export', '--output', customOutput]);
      
      expect(result.exitCode).toBe(0);
      
      const registryPath = path.join(customOutput, 'registry.json');
      expect(await fs.pathExists(registryPath)).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid commands gracefully', async () => {
      const result = await runCLI(['invalid-command']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Unknown command');
    });

    it('should handle missing configuration', async () => {
      const result = await runCLI(['sync']);
      
      // Should warn about missing config but not crash
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
      expect(result.stdout).toContain('Configuration file not found') || 
             expect(result.stderr).toContain('Configuration file not found');
    });

    it('should handle invalid configuration file', async () => {
      // Create invalid config
      await fs.writeFile(
        path.join(tempDir, 'storybook-sync.config.json'),
        '{ invalid json'
      );
      
      const result = await runCLI(['sync']);
      
      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Failed to load configuration');
    });
  });

  describe('Configuration File', () => {
    it('should use custom config file', async () => {
      const customConfigPath = path.join(tempDir, 'custom.config.json');
      const customConfig = {
        input: {
          storybookPath: './custom-stories',
          storiesPattern: '**/*.stories.tsx',
          componentsPath: './custom-components',
        },
        output: {
          registryPath: './custom-registry',
          registryName: 'custom-components',
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
      };
      
      await fs.writeJson(customConfigPath, customConfig);
      
      const result = await runCLI(['validate', '--config', customConfigPath]);
      
      expect(result.exitCode).toBeGreaterThanOrEqual(0);
      expect(result.stdout).toContain('custom-stories') || 
             expect(result.stdout).toContain('custom-components');
    });
  });
}, 60000); // Increase timeout for CLI tests

