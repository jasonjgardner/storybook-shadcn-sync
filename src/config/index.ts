import { SyncConfig } from '../types';

export const defaultConfig: SyncConfig = {
  input: {
    storybookPath: './src',
    storiesPattern: '**/*.stories.@(js|jsx|ts|tsx|mdx)',
    componentsPath: './src/components',
  },
  output: {
    registryPath: './registry',
    registryName: 'my-components',
  },
  mapping: {
    componentTypeRules: [
      {
        pattern: '**/ui/**',
        type: 'registry:ui',
      },
      {
        pattern: '**/blocks/**',
        type: 'registry:block',
      },
      {
        pattern: '**/hooks/**',
        type: 'registry:hook',
      },
      {
        pattern: '**/lib/**',
        type: 'registry:lib',
      },
      {
        pattern: '**',
        type: 'registry:component',
      },
    ],
    dependencyMapping: {
      '@radix-ui/react-accordion': '@radix-ui/react-accordion',
      '@radix-ui/react-alert-dialog': '@radix-ui/react-alert-dialog',
      '@radix-ui/react-avatar': '@radix-ui/react-avatar',
      '@radix-ui/react-button': '@radix-ui/react-button',
      'lucide-react': 'lucide-react',
      'class-variance-authority': 'class-variance-authority',
      clsx: 'clsx',
      'tailwind-merge': 'tailwind-merge',
    },
    excludePatterns: [
      '**/*.test.*',
      '**/*.spec.*',
      '**/node_modules/**',
      '**/dist/**',
      '**/build/**',
    ],
  },
  generation: {
    includeStoryExamples: true,
    generateIndividualItems: true,
    validateOutput: true,
  },
};

export * from './schemas';

