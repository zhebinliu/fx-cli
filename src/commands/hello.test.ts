import { describe, it, expect } from 'vitest';
import Hello from './hello';

describe('Hello Command', () => {
  it('should have correct description', () => {
    expect(Hello.description).toBe('Say hello to the world');
  });

  it('should be a class', () => {
    expect(typeof Hello).toBe('function');
  });
});
