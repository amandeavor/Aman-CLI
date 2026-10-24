import { afterEach, describe, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { getAdapter, zedAdapter } from '../src/import/adapters.js';
import { importDiscoveryService } from '../src/import/discovery.service.js';

const tempDirs: string[] = [];

afterEach(async () => {
  await Promise.all(
    tempDirs.splice(0).map((dir) => fs.rm(dir, { recursive: true, force: true }))
  );
});

describe('Zed import adapter', () => {
  it('registers zed in IMPORT_ADAPTERS and discovery service', () => {
    const adapter = getAdapter('zed');
    expect(adapter).toBeDefined();
    expect(adapter?.id).toBe('zed');
    expect(adapter?.label).toBe('Zed');
    expect(adapter?.unavailableReason()).toContain('No Zed prompt configuration found');

    const descriptors = importDiscoveryService.listAdapters();
    expect(descriptors.some((d) => d.id === 'zed')).toBe(true);
  });

  it('discovers prompt templates and .rules from a Zed workspace', async () => {
    const rootDir = await fs.mkdtemp(path.join(os.tmpdir(), 'aman-zed-test-'));
    tempDirs.push(rootDir);

    const zedPromptsDir = path.join(rootDir, '.zed', 'prompts');
    await fs.mkdir(zedPromptsDir, { recursive: true });
    await fs.writeFile(
      path.join(zedPromptsDir, 'refactor-clean.md'),
      '# Refactor Clean\n\nRefactor the selected code for clarity.\n',
      'utf8'
    );
    await fs.writeFile(
      path.join(rootDir, '.rules'),
      'Always prefer explicit types and small functions.\n',
      'utf8'
    );

    const discovered = await zedAdapter.scan({ rootPath: rootDir });
    expect(discovered.length).toBe(2);
    expect(discovered.map((d) => d.name).sort()).toEqual([
      'refactor-clean',
      'zed-project-rules',
    ]);
    expect(discovered.every((d) => d.type === 'prompt' && d.adapterId === 'zed')).toBe(true);
  });
});
