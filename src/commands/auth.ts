import { Command, Flags } from '@oclif/core';
import { AuthService } from '../services/auth';

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
  };

  async run() {
    const { flags } = await this.parse(Auth);
    const authService = new AuthService();

    if (flags.login) {
      this.log('🔐 Starting authentication...');
      const result = await authService.authenticate();
      
      if (result.success) {
        this.log('✅ Authentication successful!');
        this.log(`   Access Token: ${result.accessToken}`);
        this.log(`   Corp ID: ${result.corpId}`);
        this.log('   Token has been saved to your profile');
      } else {
        this.error(`❌ Authentication failed: ${result.error}`);
      }
      return;
    }

    if (flags.status) {
      const token = await authService.getToken();
      const corpId = await authService.getCorpId();
      
      this.log('🔍 Authentication Status:');
      if (token) {
        this.log(`   ✅ Token: ${token}`);
        this.log(`   ✅ Corp ID: ${corpId}`);
      } else {
        this.log('   ❌ No token found');
        this.log('   💡 Run "fx auth --login" to authenticate');
      }
      return;
    }

    if (flags.logout) {
      // For now, we'll just show a message
      // In a real implementation, this would clear the tokens
      this.log('🚪 Logout functionality will be implemented in the next phase');
      this.log('   For now, you can manually clear tokens using:');
      this.log('   fx config --set corpAccessToken=""');
      this.log('   fx config --set corpId=""');
      return;
    }

    // Default: show help
    this.log('🔐 Authentication Commands:');
    this.log('   fx auth --login     Authenticate and get access token');
    this.log('   fx auth --status    Show authentication status');
    this.log('   fx auth --logout    Clear cached tokens');
  }
}
