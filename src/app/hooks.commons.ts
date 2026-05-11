import { _ } from '@feathersjs/commons'
const { each } = _
import _get from 'lodash/get.js'

import type {
  AnyData,
  GraphPopulateHook,
  GraphPopulateHookMap,
  SingleGraphPopulateParams,
} from '../types.js'

type HookMapKey = keyof GraphPopulateHookMap

export function convertHookData(
  obj: GraphPopulateHook | AnyData | unknown[],
): Partial<GraphPopulateHookMap> {
  const hook: Partial<GraphPopulateHookMap> = {}

  if (Array.isArray(obj)) {
    hook.all = obj as SingleGraphPopulateParams[]
  } else if (typeof obj !== 'object') {
    hook.all = [obj as SingleGraphPopulateParams]
  } else {
    each(obj, function (value, key) {
      hook[key as HookMapKey] = (
        !Array.isArray(value) ? [value] : value
      ) as SingleGraphPopulateParams[]
    })
  }

  return hook
}

export function getHooks(
  app: any,

  service: any,
  type: string,
  method: string,
  appLast = false,
): any[] {
  const appHooks = _get(app, ['__hooks', type, method]) || []
  const serviceHooks = _get(service, ['__hooks', type, method]) || []

  return appLast
    ? [...serviceHooks, ...appHooks]
    : [...appHooks, ...serviceHooks]
}

type HookData = Partial<{
  before: Partial<GraphPopulateHookMap>
  after: Partial<GraphPopulateHookMap>
  error: Partial<GraphPopulateHookMap>
}>
type HookDataKey = keyof HookData

// eslint-disable-next-line
export function enableHooks(obj: any, methods: string[], types: string[]): AnyData {
  if (typeof obj.hooks === 'function') {
    return obj
  }

  const hookData: HookData = {}

  types.forEach((type) => {
    // Initialize properties where hook functions are stored
    hookData[type as HookDataKey] = {}
  })

  // Add non-enumerable `__hooks` property to the object
  Object.defineProperty(obj, '__hooks', {
    configurable: true,
    value: hookData,
    writable: true,
  })

  return Object.assign(obj, {
    hooks(
      this: { __hooks: HookData },
      allHooks: HookData | GraphPopulateHook | GraphPopulateHook[],
    ) {
      each(
        allHooks,
        (current: GraphPopulateHook | AnyData | unknown[], type) => {
          const typeKey = type as HookDataKey
          if (!this.__hooks[typeKey]) {
            throw new Error(`'${type}' is not a valid hook type`)
          }

          const hooks = convertHookData(current)

          methods.forEach((method) => {
            const methodKey = method as HookMapKey
            const map = this.__hooks[typeKey]!
            const currentHooks = map[methodKey] || (map[methodKey] = [])

            if (hooks.all) {
              currentHooks.push(...hooks.all)
            }

            if (hooks[methodKey]) {
              currentHooks.push(...hooks[methodKey]!)
            }
          })
        },
      )

      return this
    },
  })
}
