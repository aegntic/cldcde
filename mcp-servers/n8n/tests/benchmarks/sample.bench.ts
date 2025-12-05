import { bench, describe } from 'vitest';

/**
 * Sample benchmark to verify the setup works correctly
 */
describe('Sample Benchmarks', () => {
  bench('array sorting - small', () => {
    const arr = Array.from({ length: 100 }, () => Math.random());
    arr.sort((a, b) => a - b);
  }, {
    iterations: 1000,
    warmupIterations: 100
  });

  bench('array sorting - large', () => {
    const arr = Array.from({ length: 10000 }, () => Math.random());
    arr.sort((a, b) => a - b);
  }, {
    iterations: 100,
    warmupIterations: 10
  });

  bench('string concatenation', () => {
    let str = '';
    for (let i = 0; i < 1000; i++) {
      str += 'a';
    }
  }, {
    iterations: 1000,
    warmupIterations: 100
  });

  bench('object creation', () => {
    const objects = [];
    for (let i = 0; i < 1000; i++) {
      objects.push({
        id: i,
        name: `Object ${i}`,
        value: Math.random(),
        timestamp: Date.now()
      });
    }
  }, {
    iterations: 1000,
    warmupIterations: 100
  });
});