import { afterEach, expect, it } from 'vitest';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { inspectLockfile } from '../src/utils/inspect-lockfile.js';
const dirs: string[] = [];
afterEach(async () => { await Promise.all(dirs.splice(0).map(dir => fs.rm(dir, { recursive: true, force: true }))); });
it.each([null, [], {}, { assets: 'oops' }, { schemaVersion: 2, assets: [] }, { assets: [{ localName: '../outside', type: 'skill', version: '1' }] }, { assets: [null] }])('rejects malformed lock data without rewriting it: %j', async raw => {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'aman-lock-')); dirs.push(dir);
  const file = path.join(dir, 'aman.lock');
  const text = JSON.stringify(raw); await fs.writeFile(file, text);
  await expect(inspectLockfile(file, 'project')).rejects.toThrow();
  expect(await fs.readFile(file, 'utf8')).toBe(text);
  expect(await fs.readdir(dir)).toEqual(['aman.lock']);
});
