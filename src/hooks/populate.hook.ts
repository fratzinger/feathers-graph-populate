import { graphPopulate as makeGraphPopulate } from './graph-populate.hook.js'
import type { GetPopulateQueryOptions } from '../utils/get-query.js'
import { getQuery } from '../utils/get-query.js'

import type { GraphPopulateHookFunction, Populates } from '../types.js'

export type PopulateHookOptions<S = string> = Pick<
  GetPopulateQueryOptions,
  'namedQueries' | 'defaultQueryName'
> & {
  populates: Populates<S>
  /**
   * @default: false
   */
  allowUnnamedQueryForExternal?: boolean
}

/**
 * $populateParams.name can be passed from the outside.
 * $populateParams.query can be directly used, internally.
 */
export function populate(
  options: PopulateHookOptions,
): GraphPopulateHookFunction {
  const {
    namedQueries,
    defaultQueryName,
    populates,
    allowUnnamedQueryForExternal,
  } = options

  const graphPopulate = makeGraphPopulate({ populates })

  return async (context, next) => {
    // Skip this hook if there are no $populateParams or defaultQueryName
    if (!context.params.$populateParams && !defaultQueryName) {
      if (next) await next()
      return context
    }
    /**
     * The `getQuery` function sets up params.$populateParams.query.
     */
    const query = getQuery({
      context,
      namedQueries,
      defaultQueryName,
      allowUnnamedQueryForExternal,
    })

    if (!query) {
      if (next) await next()
      return context
    }

    // Set the query at params.$populateParams.query
    if (!context.params.$populateParams) context.params.$populateParams = {}

    context.params.$populateParams.query = query

    /**
     * The graphPopulate hook expects to find a query at params.$populateParams.query
     */
    return graphPopulate(context, next)
  }
}
