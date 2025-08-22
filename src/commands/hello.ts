import { Command, Flags } from '@oclif/core';

export default class Hello extends Command {
  static description = 'Say hello to the world';

  static flags = {
    verbose: Flags.boolean({
      char: 'v',
      description: 'Enable verbose output',
    }),
    debug: Flags.boolean({
      char: 'd',
      description: 'Enable debug output (includes verbose)',
    }),
  };

  async run() {
    const { flags } = await this.parse(Hello);
    
    if (flags.debug) {
      console.log('🔧 Debug mode enabled');
      console.log('🔧 Command: Hello');
      console.log('🔧 Timestamp:', new Date().toISOString());
    }
    
    if (flags.verbose || flags.debug) {
      console.log('📝 Verbose mode enabled');
      console.log('🌍 Saying hello to the world...');
    }
    
    this.log('I am the CLI tool for Fxiaoke!');
    
    if (flags.debug) {
      console.log('🔧 Command completed successfully');
    }
  }
}
