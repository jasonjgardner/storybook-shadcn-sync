import { RegistryGenerator, ComponentAnalyzer, ExampleGenerator } from '../generator';
import { defaultConfig } from '../config';
import { ParsedStoryFile, StorybookMeta } from '../types';

describe('RegistryGenerator', () => {
  let generator: RegistryGenerator;

  beforeEach(() => {
    generator = new RegistryGenerator(defaultConfig);
  });

  describe('generateRegistry', () => {
    it('should generate empty registry for empty input', async () => {
      const registry = await generator.generateRegistry([]);
      expect(registry.items).toHaveLength(0);
      expect(registry.name).toBe(defaultConfig.output.registryName);
    });

    it('should generate registry item for valid story file', async () => {
      const mockStoryFile: ParsedStoryFile = {
        filePath: '/test/Button.stories.ts',
        meta: {
          title: 'Components/Button',
          component: 'Button',
        } as StorybookMeta,
        stories: {
          Default: {
            args: { children: 'Click me' },
          },
        },
        dependencies: [],
        componentName: 'Button',
        componentPath: '/test/Button.tsx',
      };

      const registry = await generator.generateRegistry([mockStoryFile]);
      expect(registry.items).toHaveLength(1);
      expect(registry.items[0]?.name).toBe('button');
    });
  });
});

describe('ComponentAnalyzer', () => {
  let analyzer: ComponentAnalyzer;

  beforeEach(() => {
    analyzer = new ComponentAnalyzer();
  });

  describe('analyzeComponent', () => {
    it('should analyze component complexity', async () => {
      const mockStoryFile: ParsedStoryFile = {
        filePath: '/test/Button.stories.ts',
        meta: {
          title: 'Components/Button',
          component: 'Button',
        } as StorybookMeta,
        stories: {
          Default: { args: { children: 'Click me' } },
          Primary: { args: { variant: 'primary' } },
        },
        dependencies: ['react', 'clsx'],
        componentName: 'Button',
        componentPath: '/test/Button.tsx',
      };

      const analysis = await analyzer.analyzeComponent(mockStoryFile);
      expect(analysis.name).toBe('Button');
      expect(analysis.complexity.storyCount).toBe(2);
      expect(analysis.complexity.dependencyCount).toBe(2);
    });
  });
});

describe('ExampleGenerator', () => {
  let generator: ExampleGenerator;

  beforeEach(() => {
    generator = new ExampleGenerator();
  });

  describe('generateExamples', () => {
    it('should generate basic usage example', () => {
      const mockStoryFile: ParsedStoryFile = {
        filePath: '/test/Button.stories.ts',
        meta: {
          title: 'Components/Button',
          component: 'Button',
          args: { children: 'Click me' },
        } as StorybookMeta,
        stories: {},
        dependencies: [],
        componentName: 'Button',
        componentPath: '/test/Button.tsx',
      };

      const examples = generator.generateExamples(mockStoryFile);
      expect(examples).toContain('<Button children="Click me" />');
    });
  });
});

