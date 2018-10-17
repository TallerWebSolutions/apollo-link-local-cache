import { hasLocalDirective } from 'apollo-link-local'

import { operations } from './fixtures'

describe.only('hasLocalDirective', () => {
  it('should identify @local queries', () => {
    expect(hasLocalDirective(operations.simple)).toBe(false)
    expect(hasLocalDirective(operations.localDirective)).toBe(true)
    expect(hasLocalDirective(operations.otherDirective)).toBe(false)
  })
})
