import { BUNDLED_SKILLS, BUNDLED_PROMPTS, BUNDLED_MCPS, LOCAL_DIR, GLOBAL_CONFIG_FILE } from '../config/paths.js';
import { exists } from '../storage/filesystem.js';
import { HealthCheck } from '../types/index.js';
import { execSync } from 'child_process';
import { inspectLockfile } from '../utils/inspect-lockfile.js';
import { environmentService } from './environment.service.js';
import path from 'path';
import { findLayoutViolations, assetDir, metadataFilePath, mcpLocalFilePath, contentFilePath } from '../storage/asset-layout.js';
import { promises as fs } from 'node:fs';
import { countEmptyMcpLocalValues, gitignoreIncludesMcpLocalAsync } from '../utils/mcp-local.js';

export class DoctorService {
  async runChecks(scope: 'global' | 'project' = 'global'): Promise<HealthCheck[]> {
    const checks: HealthCheck[] = [];

    if (exists(GLOBAL_CONFIG_FILE)) {
      try {
        const config = JSON.parse(await fs.readFile(GLOBAL_CONFIG_FILE, 'utf8'));
        if (!config || typeof config !== 'object' || Array.isArray(config) ||
          (config.environmentPath !== undefined && typeof config.environmentPath !== 'string')) throw new Error();
      } catch {
        checks.push({ name: 'CLI configuration', status: 'fail', message: 'CLI configuration is unreadable or invalid.', fix: 'Back up and repair ~/.aman/config/aman.json. The original file was left unchanged.' });
        return checks;
      }
    }

    const targetDir = scope === 'global' ? environmentService.getActiveEnvironmentDir() : LOCAL_DIR;
    const dirExists = exists(targetDir);
    checks.push({
      name: `${scope} directory exists`,
      status: dirExists ? 'pass' : 'fail',
      message: dirExists ? `Found ${targetDir}` : `Missing ${targetDir}`,
      fix: dirExists ? undefined : `Run 'aman init ${scope === 'project' ? '--project' : '--local'}' to create the environment.`,
    });

    const bundledSkills = exists(BUNDLED_SKILLS);
    const bundledPrompts = exists(BUNDLED_PROMPTS);
    const bundledMcps = exists(BUNDLED_MCPS);
    const bundledOk = bundledSkills && bundledPrompts && bundledMcps;
    const anyBundled = bundledSkills || bundledPrompts || bundledMcps;
    checks.push({
      name: `Bundled assets (optional)`,
      status: bundledOk ? 'pass' : anyBundled ? 'warn' : 'pass',
      message: bundledOk
        ? `Optional dev/catalog tree found beside the CLI package`
        : anyBundled
          ? `Partial catalog tree (skills: ${bundledSkills}, prompts: ${bundledPrompts}, mcps: ${bundledMcps})`
          : `No bundled assets ship with the CLI — install via registry or import`,
    });

    let gitAvailable = false;
    try {
      execSync('git --version', { stdio: 'ignore', timeout: 5000 });
      gitAvailable = true;
    } catch {
      // Ignore
    }
    checks.push({
      name: `Git installed`,
      status: gitAvailable ? 'pass' : 'warn',
      message: gitAvailable ? `Git is available` : `Git not found - install git for import/sync features`,
    });

    let ghAvailable = false;
    try {
      execSync('gh --version', { stdio: 'ignore', timeout: 5000 });
      ghAvailable = true;
    } catch {
      // Ignore
    }
    checks.push({
      name: `GitHub CLI`,
      status: ghAvailable ? 'pass' : 'warn',
      message: ghAvailable ? `GitHub CLI is available` : `GitHub CLI not found - install for sync/GitHub storage`,
      fix: ghAvailable ? undefined : `Install using winget/brew/apt or scoop`,
    });

    if (ghAvailable && scope === 'global' && environmentService.getStorage().type === 'github') {
      let ghAuth = false;
      try {
        execSync('gh auth status', { stdio: 'ignore', timeout: 10000 });
        ghAuth = true;
      } catch {
        // Ignore
      }
      checks.push({
        name: `GitHub auth`,
        status: ghAuth ? 'pass' : 'warn',
        message: ghAuth ? `Authenticated with GitHub` : `Not authenticated with GitHub`,
        fix: ghAuth ? undefined : `Run 'gh auth login' to authenticate`,
      });
    }

    const nodeVersion = process.version;
    const isV18 = parseInt(nodeVersion.slice(1).split('.')[0], 10) >= 22;
    checks.push({
      name: `Node.js version`,
      status: isV18 ? 'pass' : 'fail',
      message: `Running ${nodeVersion}`,
      fix: isV18 ? undefined : `Upgrade Node.js to v22 or newer.`,
    });

    if (dirExists) {
      let inspected;
      try {
        inspected = await inspectLockfile(path.join(targetDir, 'aman.lock'), scope);
        checks.push({
          name: `Lockfile valid`,
          status: inspected?.legacy ? 'warn' : 'pass',
          message: !inspected ? 'No lockfile yet — created when you install or import assets.' : inspected.legacy ? 'Legacy lockfile detected; left unchanged.' : 'Lockfile structure parsed successfully',
        });
      } catch (error) {
        checks.push({
          name: `Lockfile valid`,
          status: 'fail',
          message: error instanceof Error ? error.message : 'Could not inspect aman.lock.',
          fix: 'Back up aman.lock before repairing it. No files were changed.',
        });
      }

      try {
        const lock = inspected?.lock;
        let missingCount = 0;
        const allEntries = lock?.assets ?? [];

        for (const entry of allEntries) {
          const typeRoot =
            entry.type === 'skill'
              ? path.join(targetDir, 'skills')
              : entry.type === 'prompt'
                ? path.join(targetDir, 'prompts')
                : path.join(targetDir, 'mcps');
          const metaPath = metadataFilePath(assetDir(entry.type, typeRoot, entry.localName));
          const contentPath = contentFilePath(assetDir(entry.type, typeRoot, entry.localName), entry.type);
          if (!exists(metaPath) || !exists(contentPath)) {
            missingCount++;
          } else {
            try {
              const metadata = JSON.parse(await fs.readFile(metaPath, 'utf8'));
              if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) missingCount++;
            } catch { missingCount++; }
          }
        }

        checks.push({
          name: `Metadata integrity`,
          status: missingCount === 0 ? 'pass' : 'warn',
          message:
            missingCount === 0
              ? `Checked ${allEntries.length} locked asset(s) for content files and readable metadata`
              : `Found ${missingCount} assets with missing content or unreadable metadata`,
          fix: missingCount === 0 ? undefined : `Re-install missing assets to regenerate metadata.`,
        });

        const violations = await findLayoutViolations(targetDir);
        checks.push({
          name: `Canonical asset layout`,
          status: violations.length === 0 ? 'pass' : 'warn',
          message:
            violations.length === 0
              ? `All assets use directory layout (SKILL.md / PROMPT.md / mcp.json)`
              : `${violations.length} layout issue(s): e.g. ${violations[0].type} "${violations[0].localName}" — ${violations[0].issue}`,
          fix:
            violations.length === 0
              ? undefined
              : `Run any install command or open the dashboard to auto-migrate flat files to directories.`,
        });

        let mcpLocalMissing = 0;
        let mcpEmptyValues = 0;
        let mcpInvalid = 0;
        for (const entry of allEntries) {
          if (entry.type !== 'mcp' || !entry.requiresLocalConfig) continue;
          const mcpDir = assetDir('mcp', path.join(targetDir, 'mcps'), entry.localName);
          const localSecrets = mcpLocalFilePath(mcpDir);
          if (!exists(localSecrets)) {
            mcpLocalMissing++;
          } else {
            try {
              const values = JSON.parse(await fs.readFile(localSecrets, 'utf8'));
              if (!values || typeof values !== 'object' || Array.isArray(values)) throw new Error();
              mcpEmptyValues += await countEmptyMcpLocalValues(mcpDir);
            } catch { mcpInvalid++; }
          }
        }

        if (mcpInvalid) checks.push({ name: 'MCP local JSON', status: 'fail', message: `${mcpInvalid} local configuration file(s) contain invalid JSON.`, fix: 'Repair mcp.local.json syntax. Secret values are never printed by doctor.' });

        checks.push({
          name: `MCP local configuration`,
          status: mcpLocalMissing === 0 ? 'pass' : 'warn',
          message:
            mcpLocalMissing === 0
              ? `All MCPs requiring local config have mcp.local.json`
              : `${mcpLocalMissing} MCP(s) missing mcp.local.json`,
          fix:
            mcpLocalMissing === 0
              ? undefined
              : `Re-install the MCP or create mcp.local.json in the asset directory.`,
        });

        if (mcpEmptyValues > 0) {
          checks.push({
            name: `MCP local secrets filled`,
            status: 'warn',
            message: `${mcpEmptyValues} empty value(s) in mcp.local.json — fill in required secrets`,
            fix: `Edit mcps/{name}/mcp.local.json and set non-empty values for each key.`,
          });
        }

        const gitignoreOk = await gitignoreIncludesMcpLocalAsync(targetDir);
        checks.push({
          name: `mcp.local.json gitignored`,
          status: gitignoreOk ? 'pass' : 'fail',
          message: gitignoreOk
            ? `.gitignore excludes mcps/**/mcp.local.json`
            : `mcp.local.json is not listed in ${path.join(targetDir, '.gitignore')}`,
          fix: gitignoreOk ? undefined : `Add "mcps/**/mcp.local.json" to .gitignore at the scope root.`,
        });
      } catch {
        checks.push({ name: 'Asset inspection', status: 'fail', message: 'Could not inspect all asset files.', fix: 'Check environment file permissions and JSON syntax, then run doctor again.' });
      }
    }

    return checks;
  }
}

export const doctorService = new DoctorService();
