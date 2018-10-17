import { hasLocalDirective } from 'apollo-link-local-cache'
import fixtures from './fixtures'

describe('hasLocalDirective', () => {
  let operations

  beforeEach(() => {
    operations = fixtures().operations
  })

  it('should identify @local queries', () => {
    expect(hasLocalDirective(operations.simple)).toBe(false)
    expect(hasLocalDirective(operations.localDirective)).toBe(true)
    expect(hasLocalDirective(operations.otherDirective)).toBe(false)
  })

  it('should be possible to prevent mutating query', () => {
    const query = operations.localDirective.query
    hasLocalDirective(operations.localDirective, false)
    expect(operations.localDirective.query).toBe(query)
  })
})
