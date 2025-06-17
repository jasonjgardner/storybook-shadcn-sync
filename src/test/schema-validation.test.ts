import { SyncConfigSchema, RegistrySchema, RegistryItemSchema } from '../config/schemas';
import { defaultConfig } from '../config';

describe('Schema Validation Tests', () => {
  describe('SyncConfigSchema', () => {
    it('should validate default configuration', () => {
      const result = SyncConfigSchema.safeParse(defaultConfig);
      expect(result.success).toBe(true);
    });

    it('should reject invalid configuration', () => {
      const invalidConfig = {
        input: {
          storybookPath: '', // Empty path should be invalid
          storiesPattern: '**/*.stories.tsx',
          componentsPath: './components',
        },
        output: {
          registryPath: './registry',
          registryName: '', // Empty name should be invalid
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

      const result = SyncConfigSchema.safeParse(invalidConfig);
      expect(result.success).toBe(false);
    });

    it('should validate partial configuration with defaults', () => {
      const partialConfig = {
        input: {
          storybookPath: './stories',
          storiesPattern: '**/*.stories.tsx',
          componentsPath: './components',
        },
        output: {
          registryPath: './registry',
          registryName: 'test-components',
        },
      };

      // Should be valid even without mapping and generation sections
      const result = SyncConfigSchema.safeParse({
        ...partialConfig,
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
      
      expect(result.success).toBe(true);
    });
  });

  describe('RegistrySchema', () => {
    it('should validate minimal registry', () => {
      const registry = {
        $schema: 'https://ui.shadcn.com/schema/registry.json',
        name: 'test-registry',
        items: [],
      };

      const result = RegistrySchema.safeParse(registry);
      expect(result.success).toBe(true);
    });

    it('should validate registry with items', () => {
      const registry = {
        $schema: 'https://ui.shadcn.com/schema/registry.json',
        name: 'test-registry',
        homepage: 'https://example.com',
        items: [
          {
            name: 'button',
            type: 'registry:ui',
            description: 'A button component',
            files: [
              {
                name: 'button.tsx',
                content: 'export const Button = () => <button />;',
              },
            ],
          },
        ],
      };

      const result = RegistrySchema.safeParse(registry);
      expect(result.success).toBe(true);
    });

    it('should reject invalid registry', () => {
      const invalidRegistry = {
        // Missing required fields
        items: [],
      };

      const result = RegistrySchema.safeParse(invalidRegistry);
      expect(result.success).toBe(false);
    });
  });

  describe('RegistryItemSchema', () => {
    it('should validate minimal registry item', () => {
      const item = {
        name: 'button',
        type: 'registry:ui',
        files: [
          {
            name: 'button.tsx',
            content: 'export const Button = () => <button />;',
          },
        ],
      };

      const result = RegistryItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should validate complete registry item', () => {
      const item = {
        name: 'button',
        type: 'registry:ui',
        description: 'A versatile button component',
        dependencies: ['react', 'clsx'],
        registryDependencies: ['utils'],
        files: [
          {
            name: 'button.tsx',
            content: 'export const Button = () => <button />;',
            type: 'registry:ui',
            target: 'components/ui/button.tsx',
          },
        ],
        tailwind: {
          config: {
            theme: {
              extend: {
                colors: {
                  primary: '#000',
                },
              },
            },
          },
        },
        cssVars: {
          light: {
            primary: '0 0% 0%',
          },
          dark: {
            primary: '0 0% 100%',
          },
        },
        meta: {
          importMap: {
            'components/ui/button': './button.tsx',
          },
        },
      };

      const result = RegistryItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should reject invalid registry item', () => {
      const invalidItem = {
        name: '', // Empty name
        type: 'invalid-type', // Invalid type
        files: [], // Empty files array
      };

      const result = RegistryItemSchema.safeParse(invalidItem);
      expect(result.success).toBe(false);
    });

    it('should validate different registry item types', () => {
      const types = [
        'registry:ui',
        'registry:component',
        'registry:block',
        'registry:hook',
        'registry:lib',
      ];

      for (const type of types) {
        const item = {
          name: 'test-item',
          type,
          files: [
            {
              name: 'test.tsx',
              content: 'export const Test = () => null;',
            },
          ],
        };

        const result = RegistryItemSchema.safeParse(item);
        expect(result.success).toBe(true);
      }
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in names', () => {
      const item = {
        name: 'my-component-v2',
        type: 'registry:ui',
        files: [
          {
            name: 'my-component-v2.tsx',
            content: 'export const MyComponentV2 = () => null;',
          },
        ],
      };

      const result = RegistryItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should validate complex dependency structures', () => {
      const item = {
        name: 'complex-component',
        type: 'registry:component',
        dependencies: [
          'react',
          '@radix-ui/react-dialog',
          'lucide-react',
          'class-variance-authority',
        ],
        registryDependencies: [
          'button',
          'input',
          'label',
          'utils',
        ],
        files: [
          {
            name: 'complex-component.tsx',
            content: 'export const ComplexComponent = () => null;',
          },
        ],
      };

      const result = RegistryItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });

    it('should validate CSS variables with different formats', () => {
      const item = {
        name: 'themed-component',
        type: 'registry:ui',
        files: [
          {
            name: 'themed-component.tsx',
            content: 'export const ThemedComponent = () => null;',
          },
        ],
        cssVars: {
          light: {
            'primary': '222.2 84% 4.9%',
            'primary-foreground': '210 40% 98%',
            'secondary': '210 40% 96%',
          },
          dark: {
            'primary': '210 40% 98%',
            'primary-foreground': '222.2 84% 4.9%',
            'secondary': '222.2 84% 4.9%',
          },
        },
      };

      const result = RegistryItemSchema.safeParse(item);
      expect(result.success).toBe(true);
    });
  });
});

