import { run } from '@oclif/core';

// Run the CLI
run().catch(console.error);

export { run } from '@oclif/core';
export { default as hello } from './commands/hello.js';
export { default as config } from './commands/config.js';
export { default as auth } from './commands/auth.js';
export { default as object } from './commands/object.js';