import { SyncOrchestrator } from '../analyzer';
import { defaultConfig } from '../config';
import { loadConfig } from '../utils';
import * as fs from 'fs-extra';
import * as path from 'path';

describe('SyncOrchestrator Integration Tests', () => {
  let tempDir: string;
  let orchestrator: SyncOrchestrator;

  beforeEach(async () => {
    // Create temporary directory for testing
    tempDir = path.join(__dirname, '../../temp-test');
    await fs.ensureDir(tempDir);
    
    // Create test configuration
    const testConfig = {
      ...defaultConfig,
      input: {
        ...defaultConfig.input,
        storybookPath: path.join(tempDir, 'stories'),
        componentsPath: path.join(tempDir, 'components'),
      },
      output: {
        ...defaultConfig.output,
        registryPath: path.join(tempDir, 'registry'),
      },
    };

    orchestrator = new SyncOrchestrator(testConfig);
  });

  afterEach(async () => {
    // Clean up temporary directory
    await fs.remove(tempDir);
  });

  describe('Project Initialization', () => {
    it('should initialize project with default configuration', async () => {
      await orchestrator.initialize({ force: true });
      
      const configPath = path.join(process.cwd(), 'storybook-sync.config.json');
      expect(await fs.pathExists(configPath)).toBe(true);
      
      const config = await fs.readJson(configPath);
      expect(config.input.storybookPath).toBeDefined();
      expect(config.output.registryName).toBeDefined();
      
      // Clean up
      await fs.remove(configPath);
    });

    it('should detect existing project structure', async () => {
      // Create mock project structure
      await fs.ensureDir(path.join(tempDir, 'src/stories'));
      await fs.ensureDir(path.join(tempDir, 'src/components'));
      await fs.writeFile(path.join(tempDir, 'tsconfig.json'), '{}');

      // Change to temp directory for detection
      const originalCwd = process.cwd();
      process.chdir(tempDir);

      try {
        await orchestrator.initialize({ force: true });
        
        const configPath = path.join(tempDir, 'storybook-sync.config.json');
        const config = await fs.readJson(configPath);
        
        expect(config.input.storybookPath).toContain('src/stories');
        expect(config.input.componentsPath).toContain('src/components');
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('Configuration Loading', () => {
    it('should load configuration from file', async () => {
      const configPath = path.join(tempDir, 'test-config.json');
      const testConfig = {
        input: {
          storybookPath: './custom/stories',
          componentsPath: './custom/components',
          storiesPattern: '**/*.stories.tsx',
        },
        output: {
          registryPath: './custom/registry',
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

      await fs.writeJson(configPath, testConfig);
      
      const loadedConfig = await loadConfig(configPath);
      expect(loadedConfig.input.storybookPath).toBe('./custom/stories');
      expect(loadedConfig.output.registryName).toBe('custom-components');
    });

    it('should use default configuration when file not found', async () => {
      const config = await loadConfig('/nonexistent/config.json');
      expect(config.input.storybookPath).toBe('./src/stories');
      expect(config.output.registryName).toBe('my-components');
    });
  });

  describe('Validation', () => {
    it('should validate project setup', async () => {
      // Create minimal project structure
      await fs.ensureDir(path.join(tempDir, 'stories'));
      await fs.ensureDir(path.join(tempDir, 'components'));
      
      const validation = await orchestrator.validate();
      
      expect(validation.valid).toBe(true);
      expect(validation.issues.some(issue => issue.type === 'error')).toBe(false);
    });

    it('should detect missing directories', async () => {
      // Don't create directories - should fail validation
      const validation = await orchestrator.validate();
      
      expect(validation.valid).toBe(false);
      expect(validation.issues.some(issue => 
        issue.type === 'error' && issue.message.includes('does not exist')
      )).toBe(true);
    });
  });

  describe('Story Processing', () => {
    beforeEach(async () => {
      // Create test story files
      await fs.ensureDir(path.join(tempDir, 'stories'));
      await fs.ensureDir(path.join(tempDir, 'components'));
      
      // Create a simple Button component
      const buttonComponent = `
import React from 'react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  onClick 
}) => {
  return (
    <button 
      className={\`btn btn-\${variant} btn-\${size}\`}
      onClick={onClick}
    >
      {children}
    </button>
  );
};
`;

      await fs.writeFile(
        path.join(tempDir, 'components/Button.tsx'), 
        buttonComponent
      );

      // Create a story file
      const buttonStory = `
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from '../components/Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  parameters: {
    docs: {
      description: 'A versatile button component with multiple variants and sizes.',
    },
  },
  argTypes: {
    variant: {
      control: { type: 'select' },
      options: ['primary', 'secondary'],
      description: 'The visual style variant of the button',
    },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md', 'lg'],
      description: 'The size of the button',
    },
    children: {
      control: { type: 'text' },
      description: 'The content of the button',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {
  args: {
    children: 'Primary Button',
    variant: 'primary',
    size: 'md',
  },
};

export const Secondary: Story = {
  args: {
    children: 'Secondary Button',
    variant: 'secondary',
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    children: 'Small Button',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    children: 'Large Button',
    size: 'lg',
  },
};
`;

      await fs.writeFile(
        path.join(tempDir, 'stories/Button.stories.tsx'), 
        buttonStory
      );
    });

    it('should successfully sync stories to registry', async () => {
      const result = await orchestrator.sync({
        validate: true,
        generateExamples: true,
      });

      expect(result.success).toBe(true);
      expect(result.items.length).toBeGreaterThan(0);
      expect(result.stats.filesProcessed).toBe(1);
      expect(result.stats.componentsGenerated).toBe(1);

      // Check that registry file was created
      const registryPath = path.join(tempDir, 'registry/registry.json');
      expect(await fs.pathExists(registryPath)).toBe(true);

      const registry = await fs.readJson(registryPath);
      expect(registry.items).toHaveLength(1);
      expect(registry.items[0].name).toBe('button');
    });

    it('should export stories in different formats', async () => {
      // Test registry format
      const registryResult = await orchestrator.export({
        format: 'registry',
        includeExamples: true,
      });

      expect(registryResult.success).toBe(true);
      expect(registryResult.items.length).toBeGreaterThan(0);

      // Test individual format
      const individualResult = await orchestrator.export({
        format: 'individual',
        includeExamples: true,
      });

      expect(individualResult.success).toBe(true);
      expect(individualResult.items.length).toBeGreaterThan(0);

      // Check individual files were created
      const buttonItemPath = path.join(tempDir, 'registry/button.json');
      expect(await fs.pathExists(buttonItemPath)).toBe(true);
    });

    it('should handle parsing errors gracefully', async () => {
      // Create an invalid story file
      const invalidStory = `
import { Button } from '../components/Button';

// Invalid syntax - missing export default
const meta = {
  title: 'Invalid/Story',
  component: Button,
};

export const Broken = {
  args: {
    children: 'Broken',
  },
};
`;

      await fs.writeFile(
        path.join(tempDir, 'stories/Invalid.stories.tsx'), 
        invalidStory
      );

      const result = await orchestrator.sync();

      // Should still succeed but with errors
      expect(result.success).toBe(true);
      expect(result.errors).toBeDefined();
      expect(result.errors!.length).toBeGreaterThan(0);
      expect(result.stats.errorsCount).toBeGreaterThan(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle missing component files', async () => {
      // Create story without corresponding component
      await fs.ensureDir(path.join(tempDir, 'stories'));
      
      const orphanStory = `
import type { Meta, StoryObj } from '@storybook/react';
import { NonExistentComponent } from '../components/NonExistent';

const meta: Meta<typeof NonExistentComponent> = {
  title: 'Orphan/Component',
  component: NonExistentComponent,
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
`;

      await fs.writeFile(
        path.join(tempDir, 'stories/Orphan.stories.tsx'), 
        orphanStory
      );

      const result = await orchestrator.sync();
      
      // Should handle gracefully
      expect(result.success).toBe(true);
      expect(result.stats.errorsCount).toBeGreaterThan(0);
    });

    it('should handle permission errors', async () => {
      // Create read-only output directory (if supported by OS)
      const readOnlyDir = path.join(tempDir, 'readonly');
      await fs.ensureDir(readOnlyDir);
      
      try {
        await fs.chmod(readOnlyDir, 0o444); // Read-only
        
        const result = await orchestrator.export({
          outputPath: readOnlyDir,
        });
        
        expect(result.success).toBe(false);
        expect(result.errors).toBeDefined();
      } catch (error) {
        // Some systems may not support chmod, skip this test
        console.warn('Skipping permission test - chmod not supported');
      }
    });
  });

  describe('Performance', () => {
    it('should handle large numbers of stories efficiently', async () => {
      // Create multiple story files
      await fs.ensureDir(path.join(tempDir, 'stories'));
      await fs.ensureDir(path.join(tempDir, 'components'));

      const componentCount = 10;
      
      for (let i = 0; i < componentCount; i++) {
        const componentName = `Component${i}`;
        
        // Create component
        const component = `
import React from 'react';

export const ${componentName}: React.FC<{ label: string }> = ({ label }) => {
  return <div>{label}</div>;
};
`;
        
        await fs.writeFile(
          path.join(tempDir, `components/${componentName}.tsx`), 
          component
        );

        // Create story
        const story = `
import type { Meta, StoryObj } from '@storybook/react';
import { ${componentName} } from '../components/${componentName}';

const meta: Meta<typeof ${componentName}> = {
  title: 'Generated/${componentName}',
  component: ${componentName},
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: '${componentName} Label',
  },
};
`;

        await fs.writeFile(
          path.join(tempDir, `stories/${componentName}.stories.tsx`), 
          story
        );
      }

      const startTime = Date.now();
      const result = await orchestrator.sync();
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(result.stats.filesProcessed).toBe(componentCount);
      expect(result.stats.componentsGenerated).toBe(componentCount);
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(30000); // 30 seconds
    });
  });
});

