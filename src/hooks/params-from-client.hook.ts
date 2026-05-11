import type { GraphPopulateHookFunction } from '../types.js'

export function paramsFromClient(
  ...whitelist: string[]
): GraphPopulateHookFunction {
  return async (context, next) => {
    const params = context.params

    if (
      params &&
      params.query &&
      params.query._$client &&
      typeof params.query._$client === 'object'
    ) {
      const client = params.query._$client

      whitelist.forEach((key) => {
        if (`_${key}` in client) {
          params[key] = client[`_${key}`]
        }
      })

      params.query = Object.assign({}, params.query)
      delete params.query._$client
    }

    if (next) await next()
    return context
  }
}
