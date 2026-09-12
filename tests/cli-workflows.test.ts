import { afterEach, describe, expect, it } from 'vitest';
import { mkdtempSync, mkdirSync, readFileSync, readdirSync, writeFileSync, rmSync, existsSync, cpSync } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const entry = path.resolve('dist/bin/aman.js');
const example = path.resolve('examples/review-checklist');
const roots: string[] = [];
function sandbox() {
  const root = mkdtempSync(path.join(os.tmpdir(), 'aman-cli-test-'));
  roots.push(root);
  const home = path.join(root, 'home');
  const cwd = path.join(root, 'project');
  mkdirSync(home); mkdirSync(cwd);
  // Tests must not contact GitHub or touch the developer's real environment.
  const env = { ...process.env, HOME: home, USERPROFILE: home, PATH: '', Path: '', AMAN_REGISTRY_BACKEND: 'local' };
  const run = (...args: string[]) => spawnSync(process.execPath, [entry, ...args], { cwd, env, encoding: 'utf8', timeout: 15000 });
  return { root, home, cwd, run };
}
afterEach(() => { for (const root of roots.splice(0)) rmSync(root, { recursive: true, force: true }); });

describe('real CLI workflows', () => {
  it('shows help and version without creating configuration or starting an installer', () => {
    const s = sandbox();
    for (const args of [[], ['--help'], ['doctor', '--help'], ['--version']]) {
      const result = s.run(...args);
      expect(result.status, result.stderr).toBe(0);
      expect(result.stdout.length).toBeGreaterThan(0);
    }
    expect(readdirSync(s.home)).toEqual([]);
    expect(readdirSync(s.cwd)).toEqual([]);
  });

  it('reports a missing project as JSON without initializing it', () => {
    const s = sandbox();
    const result = s.run('doctor', '--project', '--json');
    expect(result.status, result.stderr).toBe(1);
    const report = JSON.parse(result.stdout);
    expect(report.scope).toBe('project');
    expect(report.summary.failed).toBeGreaterThan(0);
    expect(report.checks[0].fix).toContain('aman init --project');
    expect(readdirSync(s.cwd)).toEqual([]);
    expect(readdirSync(s.home)).toEqual([]);
  });

  it('initializes a project, protects local secrets, and diagnoses it successfully', () => {
    const s = sandbox();
    expect(s.run('init', '--project').status).toBe(0);
    const project = path.join(s.cwd, '.aman');
    expect(existsSync(path.join(project, 'aman.json'))).toBe(true);
    expect(readFileSync(path.join(project, '.gitignore'), 'utf8')).toContain('mcps/**/mcp.local.json');
    const result = s.run('doctor', '--project', '--json');
    expect(result.status, result.stderr).toBe(0);
    expect(JSON.parse(result.stdout).summary.failed).toBe(0);
    expect(existsSync(path.join(s.home, '.aman', 'config', 'aman.json'))).toBe(false);
  });

  it('preserves corrupt lockfiles and flat assets byte-for-byte', () => {
    const s = sandbox();
    const project = path.join(s.cwd, '.aman');
    mkdirSync(path.join(project, 'prompts'), { recursive: true });
    writeFileSync(path.join(project, 'aman.lock'), '{broken');
    writeFileSync(path.join(project, 'prompts', 'review.md'), 'Keep this exact text.');
    const before = readdirSync(project);
    const result = s.run('doctor', '--project', '--json');
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).checks.some((c: { name: string; status: string }) => c.name === 'Lockfile valid' && c.status === 'fail')).toBe(true);
    expect(readFileSync(path.join(project, 'aman.lock'), 'utf8')).toBe('{broken');
    expect(readFileSync(path.join(project, 'prompts', 'review.md'), 'utf8')).toBe('Keep this exact text.');
    expect(readdirSync(project)).toEqual(before);
    expect(readdirSync(s.home)).toEqual([]);
  });

  it('reports corrupt global config without replacing it or polluting JSON output', () => {
    const s = sandbox();
    const config = path.join(s.home, '.aman', 'config');
    mkdirSync(config, { recursive: true });
    writeFileSync(path.join(config, 'aman.json'), '{secret-value-do-not-print');
    const result = s.run('doctor', '--json');
    expect(result.status).toBe(1);
    expect(JSON.parse(result.stdout).checks[0].name).toBe('CLI configuration');
    expect(result.stdout).not.toContain('secret-value');
    expect(readFileSync(path.join(config, 'aman.json'), 'utf8')).toBe('{secret-value-do-not-print');
    expect(readdirSync(config)).toEqual(['aman.json']);
  });

  it('rejects contradictory scope flags', () => {
    const s = sandbox();
    const result = s.run('init', '--global', '--project');
    expect(result.status).toBe(1);
    expect(result.stderr).toContain('Choose --global or --project');
    expect(readdirSync(s.home)).toEqual([]);
  });

  it('publishes and installs a local skill with its own version flag', () => {
    const s = sandbox();
    const asset = path.join(s.cwd, 'review'); cpSync(example, asset, { recursive: true });
    expect(s.run('init', '--project').status).toBe(0);
    const published = s.run('registry', 'publish', asset, '--slug', '@demo/review', '--version', '1.0.0', '--type', 'skill');
    expect(published.status, published.stdout + published.stderr).toBe(0);
    expect(published.stdout).toContain('@demo/review');
    const installed = s.run('install', '@demo/review@1.0.0', '--project');
    expect(installed.status, installed.stdout + installed.stderr).toBe(0);
    const lock = JSON.parse(readFileSync(path.join(s.cwd, '.aman', 'aman.lock'), 'utf8'));
    expect(lock.assets).toHaveLength(1);
    expect(lock.assets[0].slug).toBe('@demo/review');
    expect(s.run('doctor', '--project', '--json').status).toBe(0);
  });
});
