import { Command, Flags } from '@oclif/core';
import { AuthService } from '../services/auth';
import { ConfigManager } from '../config/manager';

export default class Auth extends Command {
  static description = 'Authenticate and manage access tokens';

  static flags = {
    login: Flags.boolean({
      char: 'l',
      description: 'Authenticate and get access token',
    }),
    status: Flags.boolean({
      char: 's',
      description: 'Show authentication status',
    }),
    logout: Flags.boolean({
      description: 'Clear cached tokens',
    }),
    verbose: Flags.boolean({
      char: 'v',
      description: 'Enable verbose output',
    }),
    debug: Flags.boolean({
      char: 'd',
      description: 'Enable debug output (includes verbose)',
    }),
  };



  async run(): Promise<void> {
    const { flags } = await this.parse(Auth);
    const authService = new AuthService();
    const configManager = new ConfigManager();
    
    // Set logging level for services
    const isVerbose = flags.verbose || flags.debug;
    const isDebug = flags.debug;
    
    if (flags.login) {
      console.log('🔐 Authenticating...');
      const result = await authService.authenticate({ verbose: isVerbose, debug: isDebug });
      
      if (result.success) {
        console.log('✅ Authentication successful!');
        console.log(`   Token: ${result.accessToken}`);
        console.log(`   Corp ID: ${result.corpId}`);
        console.log('   Token has been saved to your profile');
      } else {
        this.error(`❌ Authentication failed: ${result.error}`);
      }
    } else if (flags.status) {
      const token = await authService.getToken();
      const corpId = await authService.getCorpId();
      
      if (token && corpId) {
        console.log('🔍 Authentication Status:   ✅ Authenticated');
        console.log(`   Token: ${token}`);
        console.log(`   Corp ID: ${corpId}`);
      } else {
        console.log('🔍 Authentication Status:   ❌ Not authenticated');
        console.log('   Run "fx auth --login" to authenticate');
      }
    } else if (flags.logout) {
      // Clear tokens from current profile
      const currentProfile = configManager.getCurrentProfile();
      if (currentProfile) {
        configManager.setProfileValue(currentProfile.name, 'corpAccessToken', '');
        configManager.setProfileValue(currentProfile.name, 'corpId', '');
        console.log('✅ Logged out successfully');
        console.log('   Tokens have been cleared from your profile');
      } else {
        console.log('ℹ️  No active profile to logout from');
      }
    } else {
      // Show help if no flags provided
      console.log('🔐 Fxiaoke Authentication');
      console.log('');
      console.log('Usage:');
      console.log('  fx auth --login     Authenticate with Fxiaoke API');
      console.log('  fx auth --status    Show current authentication status');
      console.log('  fx auth --logout    Clear stored authentication tokens');
      console.log('');
      console.log('Options:');
      console.log('  -v, --verbose      Enable verbose output');
      console.log('  -d, --debug        Enable debug output (includes verbose)');
      console.log('');
      console.log('Examples:');
      console.log('  fx auth --login --verbose    Authenticate with detailed logging');
      console.log('  fx auth --login --debug      Authenticate with full debug info');
    }
  }
}
