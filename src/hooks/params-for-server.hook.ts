import type { GraphPopulateHookFunction } from '../types.js'

/**
 * paramsForServer('$populateParams')
 *
 * In the request, the provided keys will be prepended with an underscore to prevent
 * requiring to add them to the feathers whitelist.
 */
export function paramsForServer(
  ...whitelist: string[]
): GraphPopulateHookFunction {
  return async (context, next) => {
    // Deep-clone so we never mutate the caller's params object directly —
    // Feathers' find getters can rely on it.
    const params = JSON.parse(JSON.stringify(context.params))

    params.query = params.query || {}
    params.query._$client = params.query._$client || {}

    for (const key of Object.keys(params)) {
      if (key !== 'query' && whitelist.includes(key)) {
        params.query._$client[`_${key}`] = params[key]
        delete params[key]
      }
    }
    context.params = params

    if (next) await next()
    return context
  }
}
