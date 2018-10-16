import { visit } from 'graphql'
import { print } from 'graphql/language/printer'
import { ApolloLink, Observable } from 'apollo-link'

class LocalLinkError extends Error {
  constructor (message) {
    super(`[LocalLink] ${message}`)
  }
}

/**
 * Checks if the the storage is valid.
 */
const validStorage = storage =>
  storage &&
  storage.getItem &&
  storage.setItem &&
  storage.removeItem &&
  storage.clear

class LocalLink extends ApolloLink {
  /**
   * @property {(boolean|Function)} shouldCache - The cache policy. When set
   *  to `true` defaults to cache all. When set to a callback, will receive the
   *  operation as argument, and should return `true` or `false`.
   */
  shouldCache

  /**
   * @property {(Object|Function)} [storage] - The Storage in use. Will
   *  default to window.localStorage when available.
   *
   * @see https://www.w3.org/TR/webstorage/#storage
   */
  storage

  constructor ({
    shouldCache,
    storage = typeof localStorage !== 'undefined' ? localStorage : null
  } = {}) {
    super()

    if (typeof shouldCache === 'undefined') {
      throw new LocalLinkError('You must provide the `shouldCache` option')
    }

    if (!storage && typeof localStorage === 'undefined') {
      throw new LocalLinkError('Could not determine a storage to use')
    }
    else if (!validStorage(storage)) {
      throw new LocalLinkError('Must provide a valid storage')
    }

    this.shouldCache = shouldCache
    this.storage = storage
  }

  normalize = data => JSON.stringify(data)

  denormalize = data => JSON.parse(data)

  /**
   * Determines if an operation is cacheable or not.
   */
  isCacheable = operation =>
    typeof this.shouldCache === 'function'
      ? this.shouldCache(operation)
      : this.shouldCache

  /**
   * Link query requester.
   */
  request = (operation, forward) => {
    if (this.isCacheable(operation)) {
      const cached = this.storage.getItem('key')
      if (cached) {
        return Observable.of(this.denormalize(cached, operation))
      }

      return forward(operation).map(result => {
        this.storage.setItem('key', this.normalize(result, operation))
        return result
      })
    }

    return forward(operation)
  }
}

const createLocalLink = config => new LocalLink(config)

export { LocalLink, createLocalLink }
