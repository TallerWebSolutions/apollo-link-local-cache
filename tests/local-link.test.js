import { ApolloLink, execute, toPromise, Observable } from 'apollo-link'
import gql from 'graphql-tag'
import persistor from 'node-persist'

import { LocalLink } from 'apollo-link-local'

const queries = {
  simple: gql`
    query SimpleQuery {
      field
    }
  `,

  directive: gql`
    query LocalQuery @local {
      field
    }
  `
}

const requests = {
  simple: { query: queries.simple },
  directive: { query: queries.directive }
}

// Fulfil operation names.
for (let i in requests) {
  requests[i].operationName = requests[i].query.definitions.find(
    ({ kind }) => kind === 'OperationDefinition'
  ).name.value
}

const results = {
  simple: { data: { field: 'simple value' } },
  directive: { data: { field: 'directive value' } }
}

describe('LocalLink', () => {
  let called

  beforeEach(() => {
    called = 0
    global.localStorage = persistor.create()
  })

  it('passes a query forward on', async () => {
    const link = ApolloLink.from([
      new LocalLink({ shouldCache: false }),
      new ApolloLink(() => Observable.of(results.simple))
    ])

    const result = await toPromise(execute(link, requests.simple))

    expect(result).toEqual(results.simple)
  })
})
