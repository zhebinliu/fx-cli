import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import { Config, Profile } from './types';

export class ConfigManager {
  private configPath: string;
  private defaultConfig: Config;

  constructor() {
    this.configPath = join(homedir(), '.fxk', 'config.json');
    this.defaultConfig = {
      profiles: [{ name: 'default' }],
      currentProfile: 'default',
      defaultTimeout: 30000,
      userAgent: 'fx-cli/1.0.0'
    };
  }

  load(): Config {
    try {
      if (existsSync(this.configPath)) {
        const data = readFileSync(this.configPath, 'utf8');
        return { ...this.defaultConfig, ...JSON.parse(data) };
      }
      return this.defaultConfig;
    } catch {
      return this.defaultConfig;
    }
  }

  save(config: Config): void {
    try {
      const dir = dirname(this.configPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }
      writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to save config: ${errorMessage}`);
    }
  }

  getCurrentProfile(): Profile | undefined {
    const config = this.load();
    return config.profiles.find(p => p.name === config.currentProfile);
  }

  setCurrentProfile(profileName: string): void {
    const config = this.load();
    if (!config.profiles.find(p => p.name === profileName)) {
      throw new Error(`Profile '${profileName}' not found`);
    }
    config.currentProfile = profileName;
    this.save(config);
  }

  setProfileValue(profileName: string, key: string, value: string): void {
    const config = this.load();
    const profile = config.profiles.find(p => p.name === profileName);
    if (!profile) {
      throw new Error(`Profile '${profileName}' not found`);
    }

    // Handle numeric values
    if (key === 'timeout') {
      const numValue = parseInt(value, 10);
      if (isNaN(numValue) || numValue < 0) {
        throw new Error('Timeout must be a positive number');
      }
      profile[key] = numValue;
    } else {
      profile[key] = value;
    }

    this.save(config);
  }

  getProfileValue(profileName: string, key: string): string | undefined {
    const config = this.load();
    const profile = config.profiles.find(p => p.name === profileName);
    if (!profile) {
      throw new Error(`Profile '${profileName}' not found`);
    }

    const value = profile[key];
    return value !== undefined ? String(value) : undefined;
  }

  getProfile(profileName: string): Profile | undefined {
    const config = this.load();
    return config.profiles.find(p => p.name === profileName);
  }
}