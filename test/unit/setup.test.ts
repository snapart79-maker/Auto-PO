import { describe, it, expect } from 'vitest'

describe('Project Setup', () => {
  it('should have vitest working', () => {
    expect(1 + 1).toBe(2)
  })

  it('should be able to use TypeScript', () => {
    const testFn = (a: number, b: number): number => a + b
    expect(testFn(2, 3)).toBe(5)
  })
})
