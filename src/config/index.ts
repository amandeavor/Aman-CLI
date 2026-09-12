import fs from 'fs';
import Conf from 'conf';
import { AmanConfig } from '../types/index.js';
import { GLOBAL_CONFIG_DIR } from './paths.js';
import path from 'path';

const defaultConfig: AmanConfig = {
  theme: 'auto',
  defaultScope: 'global',
  environmentPath: undefined,
  storage: undefined,
  marketplaces: ['skills.sh'],
  animationMode: 'normal',
};

class ConfigManager {
  private globalConf!: Conf<AmanConfig>;

  private writable(): Conf<AmanConfig> {
    if (!this.globalConf) {
      this.globalConf = new Conf<AmanConfig>({
        projectName: 'aman', cwd: GLOBAL_CONFIG_DIR,
        configName: 'aman', defaults: defaultConfig,
      });
    }
    return this.globalConf;
  }

  load(): AmanConfig {
    // Reading help, theme, or diagnostics must never create or quarantine files.
    const file = path.join(GLOBAL_CONFIG_DIR, 'aman.json');
    if (!fs.existsSync(file)) return { ...defaultConfig };
    try {
      const value = JSON.parse(fs.readFileSync(file, 'utf8'));
      if (!value || typeof value !== 'object' || Array.isArray(value)) return { ...defaultConfig };
      return { ...defaultConfig, ...value };
    } catch { return { ...defaultConfig }; }
  }

  get<K extends keyof AmanConfig>(key: K): AmanConfig[K] {
    return this.load()[key];
  }

  set<K extends keyof AmanConfig>(key: K, value: AmanConfig[K]): void {
    this.writable().set(key, value);
  }

  reset(): void {
    this.writable().clear();
    this.writable().store = defaultConfig;
  }

  getTheme(): 'dark' | 'light' {
    const theme = this.get('theme');
    if (theme === 'auto') {
      const colorfgbg = process.env.COLORFGBG;
      if (colorfgbg) {
        const parts = colorfgbg.split(';');
        const bg = parts[parts.length - 1];
        const bgNum = parseInt(bg, 10);
        if (!isNaN(bgNum)) {
          return bgNum >= 7 && bgNum !== 8 ? 'light' : 'dark';
        }
      }
      return 'dark';
    }
    return theme;
  }

  onDidChange<K extends keyof AmanConfig>(key: K, callback: (value?: AmanConfig[K]) => void): () => void {
    return this.writable().onDidChange(key, callback);
  }
}

export const config = new ConfigManager();
