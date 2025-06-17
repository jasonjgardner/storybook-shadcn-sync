/**
 * Additional type definitions for sync functionality
 */

import { Registry, RegistryItem } from './index';

export interface SyncResult {
  success: boolean;
  registry: Registry;
  items: RegistryItem[];
  stats: SyncStats;
  errors?: Error[];
}

export interface SyncStats {
  filesProcessed: number;
  componentsGenerated: number;
  errorsCount: number;
  warningsCount: number;
  duration: number;
}

