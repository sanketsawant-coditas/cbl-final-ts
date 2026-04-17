import * as fs from 'fs';
import * as path from 'path';

export function ensureDirectory(dirPath: string): void {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

export function getProjectRoot(): string {
  return process.cwd();
}