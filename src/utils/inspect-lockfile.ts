import { promises as fs } from 'node:fs';
import { Lockfile, Scope } from '../types/index.js';
import { normalizeLockfile, isLegacyLockfile } from './lock-migrate.js';

/** Diagnose without migrating, quarantining, or silently dropping invalid entries. */
export async function inspectLockfile(file: string, scope: Scope): Promise<{ lock: Lockfile; legacy: boolean } | null> {
  let text: string;
  try { text = await fs.readFile(file, 'utf8'); }
  catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
    throw new Error('Cannot read aman.lock. Check file permissions.');
  }
  let raw;
  try { raw = JSON.parse(text); }
  catch { throw new Error('aman.lock contains invalid JSON. Restore a known-good copy or repair its syntax.'); }
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('aman.lock must be a JSON object.');
  if (raw.schemaVersion !== undefined && raw.schemaVersion !== 1) throw new Error('Unsupported aman.lock schema version.');
  if (raw.scope !== undefined && raw.scope !== scope) throw new Error('aman.lock scope does not match the selected environment.');
  for (const key of ['assets', 'skills', 'prompts', 'mcps']) {
    if (raw[key] !== undefined && !Array.isArray(raw[key])) throw new Error(`aman.lock ${key} must be an array.`);
  }
  const legacy = isLegacyLockfile(raw);
  if (!Array.isArray(raw.assets) && !legacy) throw new Error('aman.lock is missing its assets array.');
  const entries = raw.assets ?? [...(raw.skills ?? []), ...(raw.prompts ?? []), ...(raw.mcps ?? [])];
  for (const entry of entries) {
    const name = Array.isArray(raw.assets) ? entry?.localName : entry?.name;
    if (!entry || typeof name !== 'string' || !name.trim() || /[\\/\x00-\x1f]/.test(name) || name === '.' || name === '..' || name.includes(':') ||
        !['skill', 'prompt', 'mcp'].includes(entry.type) ||
        (Array.isArray(raw.assets) && typeof entry.version !== 'string')) {
      throw new Error('aman.lock contains an invalid asset entry. Check its name, type, and version.');
    }
    if (!Array.isArray(raw.assets) && typeof entry.source !== 'string') throw new Error('Legacy asset entry is missing its source.');
  }
  return { lock: normalizeLockfile(raw, scope), legacy };
}
