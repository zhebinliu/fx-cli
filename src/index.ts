import { run } from '@oclif/core';

// Run the CLI
run().catch(console.error);

export { run } from '@oclif/core';
export * from './commands/hello';
export * from './commands/config';
export * from './commands/auth';