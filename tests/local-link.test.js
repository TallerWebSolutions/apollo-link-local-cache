import {
  ApolloLink,
  execute,
  toPromise,
  Observable,
  createOperation
} from 'apollo-link'

import gql from 'graphql-tag'
import localStorage from 'localStorage'

import { LocalLink } from 'apollo-link-local'

const queries = {
  simple: gql`
    query Simple {
      field
    }
  `,

  other: gql`
    query Other {
      other
    }
  `,

  directive: gql`
    query LocalDirective @local {
      field
    }
  `
}

const requests = {
  simple: createOperation({}, { query: queries.simple, variables: {} }),
  other: createOperation({}, { query: queries.other, variables: {} }),
  directive: createOperation({}, { query: queries.directive, variables: {} })
}

// Fulfil operation names.
for (let i in requests) {
  requests[i].operationName = requests[i].query.definitions.find(
    ({ kind }) => kind === 'OperationDefinition'
  ).name.value
}

const results = {
  simple: { data: { field: 'simple value' } },
  other: { data: { other: 'other value' } },
  directive: { data: { field: 'directive value' } }
}

describe('LocalLink', () => {
  let called

  beforeEach(() => {
    called = 0
    localStorage.clear()
    global.localStorage = localStorage
  })

  it('passes a query forward on', async () => {
    const link = ApolloLink.from([
      new LocalLink({ shouldCache: false }),
      new ApolloLink(() => Observable.of(results.simple))
    ])

    const result = await toPromise(execute(link, requests.simple))

    expect(result).toEqual(results.simple)
  })

  it('should cache the results of a query', async () => {
    const link = ApolloLink.from([
      new LocalLink({ shouldCache: true }),
      new ApolloLink(() => Observable.of(results.simple))
    ])

    const result = await toPromise(execute(link, requests.simple))

    expect(result).toEqual(results.simple)
    expect(localStorage.getItem(requests.simple.toKey())).not.toBeNull()
  })

  it('should reuse previous results of a query', async () => {
    const link = ApolloLink.from([
      new LocalLink({ shouldCache: true }),
      new ApolloLink(() => {
        called++
        return Observable.of(results.simple)
      })
    ])

    const result1 = await toPromise(execute(link, requests.simple))
    const result2 = await toPromise(execute(link, requests.simple))

    expect(result1).toEqual(results.simple)
    expect(result2).toEqual(results.simple)
    expect(called).toBe(1)
  })

  it('should cache multiple query results', async () => {
    const link = ApolloLink.from([
      new LocalLink({ shouldCache: true }),
      new ApolloLink(({ operationName }) => {
        called++

        if (operationName === 'Simple') return Observable.of(results.simple)
        if (operationName === 'Other') return Observable.of(results.other)
      })
    ])

    const result1 = await toPromise(execute(link, requests.simple))
    const result2 = await toPromise(execute(link, requests.other))

    expect(result1).toEqual(results.simple)
    expect(result2).toEqual(results.other)
    expect(called).toBe(2)
  })
})
