import { ApolloLink, execute, toPromise, Observable } from 'apollo-link'

import localStorage from 'localStorage'

import { LocalLink, hasLocalDirective } from 'apollo-link-local'

import fixtures from './fixtures'

describe('LocalLink', () => {
  let called
  let operations
  let results

  beforeEach(() => {
    called = 0
    localStorage.clear()
    global.localStorage = localStorage

    const newFixtures = fixtures()
    operations = newFixtures.operations
    results = newFixtures.results
  })

  describe('construct', () => {
    it('should construct with minimal config', () => {
      // eslint-disable-next-line no-new
      new LocalLink()
    })

    it('should throw when no storage can be determined', () => {
      delete global.localStorage
      expect(() => new LocalLink()).toThrow(/storage to use/)
    })

    it('should throw when invalid storage provided', () => {
      const link = new LocalLink({ storage: {} })
      expect(() => execute(link, operations.simple)).toThrow(/valid storage/)
    })
  })

  it('passes a query forward on', async () => {
    const link = ApolloLink.from([
      new LocalLink({ shouldCache: false }),
      new ApolloLink(() => Observable.of(results.simple))
    ])

    const result = await toPromise(execute(link, operations.simple))

    expect(result).toEqual(results.simple)
  })

  it('should cache the results of a query', async () => {
    const link = ApolloLink.from([
      new LocalLink({ shouldCache: true }),
      new ApolloLink(() => Observable.of(results.simple))
    ])

    const result = await toPromise(execute(link, operations.simple))

    expect(result).toEqual(results.simple)
    expect(localStorage.getItem(operations.simple.toKey())).not.toBeNull()
  })

  it('should reuse previous results of a query', async () => {
    const link = ApolloLink.from([
      new LocalLink({ shouldCache: true }),
      new ApolloLink(() => {
        called++
        return Observable.of(results.simple)
      })
    ])

    const result1 = await toPromise(execute(link, operations.simple))
    const result2 = await toPromise(execute(link, operations.simple))

    expect(result1).toEqual(results.simple)
    expect(result2).toEqual(results.simple)
    expect(called).toBe(1)
  })

  it('should cache the results of multiple queries', async () => {
    const link = ApolloLink.from([
      new LocalLink({ shouldCache: true }),
      new ApolloLink(({ operationName }) => {
        called++

        if (operationName === 'Simple') return Observable.of(results.simple)
        if (operationName === 'Other') return Observable.of(results.other)
      })
    ])

    const simple = await toPromise(execute(link, operations.simple))
    const other = await toPromise(execute(link, operations.other))

    expect(simple).toEqual(results.simple)
    expect(other).toEqual(results.other)
    expect(called).toBe(2)
  })

  it('should reuse previous results of multiple queries', async () => {
    const link = ApolloLink.from([
      new LocalLink({ shouldCache: true }),
      new ApolloLink(({ operationName }) => {
        called++

        if (operationName === 'Simple') return Observable.of(results.simple)
        if (operationName === 'Other') return Observable.of(results.other)
      })
    ])

    const simple1 = await toPromise(execute(link, operations.simple))
    const other1 = await toPromise(execute(link, operations.other))

    const simple2 = await toPromise(execute(link, operations.simple))
    const other2 = await toPromise(execute(link, operations.other))

    expect(simple1).toEqual(results.simple)
    expect(simple2).toEqual(results.simple)
    expect(other1).toEqual(results.other)
    expect(other2).toEqual(results.other)
    expect(called).toBe(2)
  })

  describe('shouldCache', () => {
    it('should be possible to provide custom callback on shouldCache', async () => {
      // Only cache operation Other
      const shouldCache = ({ operationName }) => operationName === 'Other'

      const link = ApolloLink.from([
        new LocalLink({ shouldCache }),
        new ApolloLink(() => {
          called++
          return Observable.of(results.simple)
        })
      ])

      await toPromise(execute(link, operations.simple))
      await toPromise(execute(link, operations.other))

      expect(localStorage.getItem(operations.other.toKey())).not.toBeNull()
      expect(localStorage.getItem(operations.simple.toKey())).toBeNull()
      expect(called).toBe(2)
    })

    it('should identify queries using hasLocalDirective', async () => {
      const link = ApolloLink.from([
        new LocalLink({ shouldCache: hasLocalDirective }),
        new ApolloLink(() => Observable.of(results.simple))
      ])

      const { simple, localDirective, otherDirective } = operations

      await toPromise(execute(link, simple))
      await toPromise(execute(link, otherDirective))
      await toPromise(execute(link, localDirective))

      // Test smartly because keys diffeer after directive extraction.
      Object.keys(localStorage).forEach(key => {
        expect(key).not.toContain(simple.operationName)
        expect(key).not.toContain(otherDirective.operationName)
        expect(key).toContain(localDirective.operationName)
      })
    })
  })

  describe('storage', () => {
    const generateStorage = () => {
      const cache = {}
      const storage = {
        getItem: jest.fn(key => cache[key]),
        setItem: jest.fn((key, value) => (cache[key] = value)),
        removeItem: jest.fn(key => delete cache[key]),
        clear: jest.fn(() => Object.keys(cache).forEach(storage.removeItem))
      }
      return storage
    }

    it('should be possible to provide a custom storage', async () => {
      const storage = generateStorage()

      const link = ApolloLink.from([
        new LocalLink({ storage }),
        new ApolloLink(() => {
          called++
          return Observable.of(results.simple)
        })
      ])

      await toPromise(execute(link, operations.simple))
      const result = await toPromise(execute(link, operations.simple))

      expect(result).toEqual(results.simple)
      expect(storage.setItem).toHaveBeenCalledTimes(1)
      expect(storage.getItem).toHaveBeenCalledTimes(2)
      expect(storage.getItem(operations.other.toKey())).not.toBeNull()
      expect(called).toBe(1)
    })

    it('should be possible to provide a factory as storage', async () => {
      const storage = generateStorage()
      const factory = jest.fn(operation => storage)

      const link = ApolloLink.from([
        new LocalLink({ storage: factory }),
        new ApolloLink(() => {
          called++
          return Observable.of(results.simple)
        })
      ])

      await toPromise(execute(link, operations.simple))
      const result = await toPromise(execute(link, operations.simple))

      expect(result).toEqual(results.simple)
      expect(storage.setItem).toHaveBeenCalledTimes(1)
      expect(storage.getItem).toHaveBeenCalledTimes(2)
      expect(storage.getItem(operations.other.toKey())).not.toBeNull()
      expect(called).toBe(1)
    })

    it('should provide a factory storage with the operation', async () => {
      const storage = generateStorage()
      const factory = jest.fn(operation => storage)

      const link = ApolloLink.from([
        new LocalLink({ storage: factory }),
        new ApolloLink(() => Observable.of(results.simple))
      ])

      await toPromise(execute(link, operations.simple))

      expect(storage.setItem).toHaveBeenCalledTimes(1)
      expect(storage.getItem).toHaveBeenCalledTimes(1)
      expect(factory).toHaveBeenCalledWith(operations.simple)
    })
  })

  describe('normalization/denormalization', () => {
    it('should be possible to provide a custom normalizer/denormalizer', async () => {
      const config = {
        normalize: jest.fn(data => JSON.stringify(data)),
        denormalize: jest.fn(data => JSON.parse(data))
      }

      const link = ApolloLink.from([
        new LocalLink(config),
        new ApolloLink(() => Observable.of(results.simple))
      ])

      await toPromise(execute(link, operations.simple))
      await toPromise(execute(link, operations.simple))

      expect(config.normalize).toHaveBeenCalledWith(
        results.simple,
        operations.simple
      )

      expect(config.denormalize).toHaveBeenCalledWith(
        JSON.stringify(results.simple),
        operations.simple
      )
    })
  })
})
