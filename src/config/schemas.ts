import { z } from 'zod';

// Registry file schema
const RegistryFileSchema = z.object({
  path: z.string(),
  type: z.enum([
    'registry:component',
    'registry:ui',
    'registry:lib',
    'registry:hook',
    'registry:block',
    'registry:page',
    'registry:file',
    'registry:style',
    'registry:theme',
  ]),
  target: z.string().optional(),
});

// Registry item schema
const RegistryItemSchema = z.object({
  $schema: z.string().optional(),
  name: z.string(),
  type: z.enum([
    'registry:component',
    'registry:ui',
    'registry:lib',
    'registry:hook',
    'registry:block',
    'registry:page',
    'registry:file',
    'registry:style',
    'registry:theme',
  ]),
  title: z.string(),
  description: z.string(),
  author: z.string().optional(),
  dependencies: z.array(z.string()).optional(),
  registryDependencies: z.array(z.string()).optional(),
  files: z.array(RegistryFileSchema),
  cssVars: z
    .object({
      theme: z.record(z.string()).optional(),
      light: z.record(z.string()).optional(),
      dark: z.record(z.string()).optional(),
    })
    .optional(),
  tailwind: z
    .object({
      config: z.record(z.any()).optional(),
    })
    .optional(),
});

// Registry schema
const RegistrySchema = z.object({
  $schema: z.string(),
  name: z.string(),
  homepage: z.string().optional(),
  items: z.array(RegistryItemSchema),
});

// Component type rule schema
const ComponentTypeRuleSchema = z.object({
  pattern: z.string(),
  type: z.enum([
    'registry:component',
    'registry:ui',
    'registry:lib',
    'registry:hook',
    'registry:block',
    'registry:page',
    'registry:file',
    'registry:style',
    'registry:theme',
  ]),
  condition: z.enum(['fileCount', 'complexity', 'dependencies']).optional(),
  threshold: z.number().optional(),
});

// Configuration schema
const SyncConfigSchema = z.object({
  input: z.object({
    storybookPath: z.string(),
    storiesPattern: z.array(z.string()),
    componentsPath: z.string(),
  }),
  output: z.object({
    registryPath: z.string(),
    registryName: z.string(),
    homepage: z.string().optional(),
  }),
  mapping: z.object({
    componentTypeRules: z.array(ComponentTypeRuleSchema),
    dependencyMapping: z.record(z.string()),
    excludePatterns: z.array(z.string()),
  }),
  generation: z.object({
    includeStoryExamples: z.boolean(),
    generateIndividualItems: z.boolean(),
    validateOutput: z.boolean(),
  }),
});

export {
  RegistryFileSchema,
  RegistryItemSchema,
  RegistrySchema,
  ComponentTypeRuleSchema,
  SyncConfigSchema,
};

