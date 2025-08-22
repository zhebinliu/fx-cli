import { Command, Flags } from '@oclif/core';
import { ConfigManager } from '../config/manager';

export default class Config extends Command {
  static description = 'Manage CLI configuration';

  static flags = {
    profile: Flags.string({
      char: 'p',
      description: 'Profile name to use',
    }),
    list: Flags.boolean({
      char: 'l',
      description: 'List all profiles',
    }),
    add: Flags.string({
      description: 'Add a new profile',
    }),
    remove: Flags.string({
      description: 'Remove a profile',
    }),
    set: Flags.string({
      description: 'Set a profile value (format: key=value)',
      char: 's',
    }),
    get: Flags.string({
      description: 'Get a profile value',
      char: 'g',
    }),
  };

  async run() {
    const { flags } = await this.parse(Config);
    const configManager = new ConfigManager();

    if (flags.set) {
      const [key, value] = flags.set.split('=');
      if (!key || !value) {
        this.error('Set format must be key=value (e.g., corpId=org-123)');
        return;
      }
      try {
        const currentProfile = configManager.getCurrentProfile();
        if (!currentProfile) {
          this.error('No current profile set');
          return;
        }
        configManager.setProfileValue(currentProfile.name, key, value);
        this.log(`Set ${key}=${value} for profile: ${currentProfile.name}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.error(errorMessage);
      }
      return;
    }

    if (flags.get) {
      try {
        const currentProfile = configManager.getCurrentProfile();
        if (!currentProfile) {
          this.error('No current profile set');
          return;
        }
        const value = configManager.getProfileValue(currentProfile.name, flags.get);
        if (value !== undefined) {
          this.log(value);
        } else {
          this.log(`Value for ${flags.get} is not set`);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.error(errorMessage);
      }
      return;
    }

    if (flags.add) {
      const config = configManager.load();
      if (config.profiles.find(p => p.name === flags.add)) {
        this.error(`Profile '${flags.add}' already exists`);
        return;
      }
      config.profiles.push({ name: flags.add });
      configManager.save(config);
      this.log(`Added profile: ${flags.add}`);
      return;
    }

    if (flags.remove) {
      const config = configManager.load();
      if (flags.remove === 'default') {
        this.error('Cannot remove the default profile');
        return;
      }
      const profileIndex = config.profiles.findIndex(p => p.name === flags.remove);
      if (profileIndex === -1) {
        this.error(`Profile '${flags.remove}' not found`);
        return;
      }
      config.profiles.splice(profileIndex, 1);
      if (config.currentProfile === flags.remove) {
        config.currentProfile = 'default';
      }
      configManager.save(config);
      this.log(`Removed profile: ${flags.remove}`);
      return;
    }

    if (flags.list) {
      const config = configManager.load();
      this.log('Available profiles:');
      config.profiles.forEach(profile => {
        const current = profile.name === config.currentProfile ? ' (current)' : '';
        this.log(`  ${profile.name}${current}`);
        // Show profile values if they exist
        if (profile.corpId || profile.baseUrl || profile.timeout) {
          if (profile.corpId) this.log(`    Corp ID: ${profile.corpId}`);
          if (profile.baseUrl) this.log(`    Base URL: ${profile.baseUrl}`);
          if (profile.timeout) this.log(`    Timeout: ${profile.timeout}ms`);
        }
      });
      return;
    }

    if (flags.profile) {
      try {
        configManager.setCurrentProfile(flags.profile);
        this.log(`Switched to profile: ${flags.profile}`);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        this.error(errorMessage);
      }
      return;
    }

    // Show current config
    const currentProfile = configManager.getCurrentProfile();
    this.log('Current configuration:');
    this.log(`  Profile: ${currentProfile?.name || 'default'}`);
    this.log(`  Corp ID: ${currentProfile?.corpId || 'Not set'}`);
    this.log(`  Base URL: ${currentProfile?.baseUrl || 'Not set'}`);
    this.log(`  Timeout: ${currentProfile?.timeout || 'Default'}ms`);
    this.log(`  Token: ${currentProfile?.corpAccessToken ? 'Set' : 'Not set'}`);
  }
}