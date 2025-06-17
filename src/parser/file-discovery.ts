import { glob } from 'glob';
import * as path from 'path';
import { SyncConfig } from '../types';
import { createError, normalizePath } from '../utils';

export class FileDiscovery {
  constructor(private config: SyncConfig) {}

  /**
   * Discover all story files based on configuration patterns
   */
  async discoverStoryFiles(): Promise<string[]> {
    try {
      const { storybookPath, storiesPattern } = this.config.input;
      const { excludePatterns } = this.config.mapping;

      const files = await glob(storiesPattern, {
        cwd: storybookPath,
        absolute: true,
        ignore: excludePatterns,
      });

      return files.map(file => normalizePath(file));
    } catch (error) {
      throw createError(
        `Failed to discover story files: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'DISCOVERY_ERROR'
      );
    }
  }

  /**
   * Discover component files related to stories
   */
  async discoverComponentFiles(storyFiles: string[]): Promise<string[]> {
    const componentFiles: Set<string> = new Set();
    const { componentsPath } = this.config.input;

    for (const storyFile of storyFiles) {
      // Try to find corresponding component file
      const componentFile = this.findComponentFile(storyFile, componentsPath);
      if (componentFile) {
        componentFiles.add(componentFile);
      }
    }

    return Array.from(componentFiles);
  }

  /**
   * Find component file for a given story file
   */
  private findComponentFile(storyFile: string, componentsPath: string): string | null {
    const storyDir = path.dirname(storyFile);
    const storyBasename = path.basename(storyFile, path.extname(storyFile));
    
    // Remove .stories suffix
    const componentBasename = storyBasename.replace(/\.stories$/, '');
    
    // Common component file extensions
    const extensions = ['.tsx', '.ts', '.jsx', '.js'];
    
    // Look in the same directory first
    for (const ext of extensions) {
      const componentFile = path.join(storyDir, componentBasename + ext);
      if (this.fileExists(componentFile)) {
        return normalizePath(componentFile);
      }
    }

    // Look in components directory
    for (const ext of extensions) {
      const componentFile = path.join(componentsPath, componentBasename + ext);
      if (this.fileExists(componentFile)) {
        return normalizePath(componentFile);
      }
    }

    return null;
  }

  /**
   * Check if file exists (synchronous for performance)
   */
  private fileExists(filePath: string): boolean {
    try {
      require('fs').accessSync(filePath);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate story file format
   */
  async validateStoryFile(filePath: string): Promise<boolean> {
    try {
      const fs = require('fs-extra');
      const content = await fs.readFile(filePath, 'utf8');
      
      // Basic validation - check for CSF patterns
      const hasDefaultExport = /export\s+default\s+/.test(content);
      const hasNamedExports = /export\s+(const|let|var)\s+\w+/.test(content);
      const hasStorybookImports = /@storybook\//.test(content);
      
      return hasDefaultExport && (hasNamedExports || hasStorybookImports);
    } catch {
      return false;
    }
  }

  /**
   * Get file modification time for incremental processing
   */
  async getFileModTime(filePath: string): Promise<Date> {
    try {
      const fs = require('fs-extra');
      const stats = await fs.stat(filePath);
      return stats.mtime;
    } catch (error) {
      throw createError(
        `Failed to get file modification time: ${error instanceof Error ? error.message : 'Unknown error'}`,
        'STAT_ERROR',
        filePath
      );
    }
  }

  /**
   * Filter files based on modification time for incremental processing
   */
  async filterChangedFiles(files: string[], since: Date): Promise<string[]> {
    const changedFiles: string[] = [];

    for (const file of files) {
      try {
        const modTime = await this.getFileModTime(file);
        if (modTime > since) {
          changedFiles.push(file);
        }
      } catch {
        // If we can't get mod time, include the file to be safe
        changedFiles.push(file);
      }
    }

    return changedFiles;
  }
}

