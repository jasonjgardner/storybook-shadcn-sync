import * as fs from 'fs-extra';
import * as path from 'path';
import { glob } from 'glob';

/**
 * File system utilities
 */
export async function ensureDir(dirPath: string): Promise<void> {
  await fs.ensureDir(dirPath);
}

export async function writeJsonFile(
  filePath: string,
  data: any,
  pretty = true
): Promise<void> {
  await ensureDir(path.dirname(filePath));
  const content = pretty ? JSON.stringify(data, null, 2) : JSON.stringify(data);
  await fs.writeFile(filePath, content, 'utf8');
}

export async function readJsonFile<T = any>(filePath: string): Promise<T> {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Path utilities
 */
export function normalizePath(filePath: string): string {
  return path.posix.normalize(filePath.replace(/\\/g, '/'));
}

export function getRelativePath(from: string, to: string): string {
  return normalizePath(path.relative(from, to));
}

export function resolveGlob(
  patterns: string[],
  options: { cwd?: string; ignore?: string[] } = {}
): Promise<string[]> {
  return glob(patterns, {
    cwd: options.cwd || process.cwd(),
    ignore: options.ignore || [],
    absolute: true,
  });
}

/**
 * String utilities
 */
export function kebabCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

export function camelCase(str: string): string {
  return str
    .replace(/[-_\s]+(.)?/g, (_, char) => (char ? char.toUpperCase() : ''))
    .replace(/^[A-Z]/, char => char.toLowerCase());
}

export function pascalCase(str: string): string {
  const camelCased = camelCase(str);
  return camelCased.charAt(0).toUpperCase() + camelCased.slice(1);
}

export function startCase(str: string): string {
  return str
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[-_\s]+/g, ' ')
    .replace(/\b\w/g, char => char.toUpperCase())
    .trim();
}

/**
 * Array utilities
 */
export function unique<T>(array: T[]): T[] {
  return [...new Set(array)];
}

export function groupBy<T, K extends string | number | symbol>(
  array: T[],
  keyFn: (item: T) => K
): Record<K, T[]> {
  return array.reduce((groups, item) => {
    const key = keyFn(item);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key]!.push(item);
    return groups;
  }, {} as Record<K, T[]>);
}

/**
 * Validation utilities
 */
export function isValidPackageName(name: string): boolean {
  return /^[@a-z0-9-~][a-z0-9-._~]*\/[a-z0-9-._~]*$|^[a-z0-9-~][a-z0-9-._~]*$/.test(
    name
  );
}

export function isValidComponentName(name: string): boolean {
  return /^[A-Z][a-zA-Z0-9]*$/.test(name);
}

/**
 * Error utilities
 */
export class SyncError extends Error {
  constructor(
    message: string,
    public code: string,
    public file?: string,
    public line?: number
  ) {
    super(message);
    this.name = 'SyncError';
  }
}

export function createError(
  message: string,
  code: string,
  file?: string,
  line?: number
): SyncError {
  return new SyncError(message, code, file, line);
}


// Re-export config utilities
export * from './config';

