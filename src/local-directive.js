import { visit } from 'graphql'

const extractDirectives = (originalQuery, directive) => {
  let hasDirective = false

  const query = visit(originalQuery, {
    Directive: ({ name: { value: name } }) => {
      if (name === directive) {
        hasDirective = true
        return null
      }
    }
  })

  return { query, hasDirective }
}

const createHasLocalDirective = directive => (operation, mutate = true) => {
  const { query, hasDirective } = extractDirectives(operation.query, directive)

  if (mutate) {
    operation.query = query
  }

  return hasDirective
}

/**
 * Checks if a given operation uses @local directive.
 *
 * @param {Object} operation The GraphQL operation.
 * @param {boolean} [mutate] Wheter or not the operation's query should
 *  get it's @local directives extracted.
 */
const hasLocalDirective = createHasLocalDirective('local')

export { hasLocalDirective, createHasLocalDirective }
