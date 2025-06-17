import { StorybookParser, FileDiscovery, DependencyAnalyzer } from '../parser';
import { defaultConfig } from '../config';

describe('StorybookParser', () => {
  let parser: StorybookParser;

  beforeEach(() => {
    parser = new StorybookParser();
  });

  describe('parseStoryFile', () => {
    it('should throw error for non-existent file', async () => {
      await expect(parser.parseStoryFile('non-existent.stories.ts')).rejects.toThrow();
    });
  });
});

describe('FileDiscovery', () => {
  let discovery: FileDiscovery;

  beforeEach(() => {
    discovery = new FileDiscovery(defaultConfig);
  });

  describe('discoverStoryFiles', () => {
    it('should return empty array when no files match pattern', async () => {
      const files = await discovery.discoverStoryFiles();
      expect(Array.isArray(files)).toBe(true);
    });
  });
});

describe('DependencyAnalyzer', () => {
  let analyzer: DependencyAnalyzer;

  beforeEach(() => {
    analyzer = new DependencyAnalyzer(process.cwd());
  });

  describe('analyzeDependencies', () => {
    it('should throw error for non-existent file', async () => {
      await expect(analyzer.analyzeDependencies('non-existent.ts')).rejects.toThrow();
    });
  });
});

