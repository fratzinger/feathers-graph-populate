import assert from 'node:assert'
import type { Params } from '@feathersjs/feathers'
import { feathers } from '@feathersjs/feathers'
import { MemoryService } from '@feathersjs/memory'

import configureGraphPopulate, {
  paramsForServer,
  paramsFromClient,
  populate,
} from '../../src/index.js'

type GraphPopulateParams = Params & { $populateParams?: any; test?: any }

const mockApp = () => {
  const app = feathers<{
    users: MemoryService<any, any, GraphPopulateParams> & {
      graphPopulate: any
    }
    companies: MemoryService<any, any, GraphPopulateParams> & {
      graphPopulate: any
    }
    posts: MemoryService<any, any, GraphPopulateParams> & {
      graphPopulate: any
    }
  }>()
  app.configure(configureGraphPopulate())

  app.use('users', new MemoryService({ multi: true, startId: 1 }) as any)
  app.use('companies', new MemoryService({ multi: true, startId: 1 }) as any)
  app.use('posts', new MemoryService({ multi: true, startId: 1 }) as any)

  const usersService = app.service('users')

  usersService.hooks({
    around: {
      all: [
        populate({
          populates: {
            company: {
              service: 'companies',
              nameAs: 'company',
              keyHere: 'companyId',
              keyThere: 'id',
              asArray: false,
            },
            posts: {
              service: 'posts',
              nameAs: 'posts',
              keyHere: 'id',
              keyThere: 'userId',
              asArray: true,
            },
          },
          namedQueries: {
            complete: {
              company: {
                users: {},
              },
              posts: {},
            },
          },
        }),
      ],
    },
  })

  const companiesService = app.service('companies')

  companiesService.hooks({
    around: {
      all: [
        populate({
          populates: {
            users: {
              service: 'users',
              nameAs: 'users',
              keyHere: 'id',
              keyThere: 'companyId',
              asArray: true,
            },
          },
        }),
      ],
    },
  })

  return {
    app,
    usersService,
    companiesService,
    postsService: app.service('posts'),
  }
}

describe('graph-populate.around.test.ts', () => {
  it('populates on find via around-hook', async () => {
    const { usersService, companiesService, postsService } = mockApp()

    const company = await companiesService.create({ name: 'company' })
    const user = await usersService.create({ companyId: company.id })
    await postsService.create([{ userId: user.id }, { userId: user.id }])

    const [result] = (await usersService.find({
      query: {},
      $populateParams: { name: 'complete' },
    })) as any

    assert.deepStrictEqual(result, {
      id: 1,
      companyId: 1,
      company: {
        id: 1,
        name: 'company',
        users: [{ id: 1, companyId: 1 }],
      },
      posts: [
        { id: 1, userId: 1 },
        { id: 2, userId: 1 },
      ],
    })
  })

  it('populates on get via around-hook', async () => {
    const { usersService, companiesService, postsService } = mockApp()

    const company = await companiesService.create({ name: 'company' })
    const user = await usersService.create({ companyId: company.id })
    await postsService.create([{ userId: user.id }])

    const result = (await usersService.get(user.id, {
      $populateParams: { query: { company: {}, posts: {} } },
    })) as any

    assert.strictEqual(result.company.id, company.id)
    assert.strictEqual(result.posts.length, 1)
    assert.strictEqual(result.posts[0].userId, user.id)
  })

  it('populates on create via around-hook (post-next result)', async () => {
    const { usersService, companiesService, postsService } = mockApp()

    const company = await companiesService.create({ name: 'company' })
    // create a posts-row that should NOT exist for the new user
    await postsService.create({ userId: 99 })

    const result = (await usersService.create(
      { companyId: company.id },
      { $populateParams: { query: { company: {}, posts: {} } } },
    )) as any

    assert.strictEqual(result.company.id, company.id)
    assert.deepStrictEqual(
      result.posts,
      [],
      'no posts since user was just created',
    )
  })

  it('skips population when no $populateParams provided', async () => {
    const { usersService, companiesService } = mockApp()

    const company = await companiesService.create({ name: 'company' })
    const user = await usersService.create({ companyId: company.id })

    const fetched = (await usersService.get(user.id)) as any
    assert.strictEqual(fetched.company, undefined)
    assert.strictEqual(fetched.posts, undefined)
  })

  it('paramsForServer + paramsFromClient round-trip as around-hooks', async () => {
    const app = feathers<{
      items: MemoryService<any, any, GraphPopulateParams>
    }>()
    app.use('items', new MemoryService({ multi: true, startId: 1 }) as any)
    const items = app.service('items')

    let observed: any
    items.hooks({
      around: {
        all: [
          paramsFromClient('$populateParams'),
          async (context, next) => {
            observed = {
              $populateParams: context.params.$populateParams,
              hasUnderscore: !!(context.params.query as any)?._$client,
            }
            await next()
          },
        ],
      },
    })

    // Simulate a client that runs paramsForServer before the request.
    const clientCtx: any = {
      params: { $populateParams: { name: 'complete' }, query: {} },
    }
    await paramsForServer('$populateParams')(clientCtx)
    assert.deepStrictEqual(
      clientCtx.params.query._$client._$populateParams,
      { name: 'complete' },
      'paramsForServer moved $populateParams under query._$client',
    )

    // Send only query — the wire payload after a real client would only carry
    // params.query — so we drop the top-level $populateParams that the legacy
    // void-returning hook leaves behind on the local context.
    const wireParams = { query: clientCtx.params.query }
    await items.create({ name: 'x' }, wireParams)

    assert.deepStrictEqual(
      observed.$populateParams,
      { name: 'complete' },
      'paramsFromClient restored $populateParams on the server',
    )
    assert.strictEqual(
      observed.hasUnderscore,
      false,
      'paramsFromClient stripped _$client from query',
    )
  })
})
