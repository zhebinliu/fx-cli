import { Command } from '@oclif/core';

export default class Hello extends Command {
  static description = 'Say hello to the world';

  async run() {
    this.log('Hello world!');
  }
}
