import assert from 'node:assert'
import { populateUtil } from '../src/index.js'
import _omit from 'lodash/omit.js'
import _orderBy from 'lodash/orderBy.js'
import { populates as userPopulates } from './testapp/populates.users.js'
import { makeApp } from './testapp/app.js'

declare module '@feathersjs/feathers' {
  interface Params {
    $populateParams?: any
    paginate?: boolean
  }
}

describe('users.service.server.test.ts', () => {
  describe('Populate Hook', () => {
    describe('One Level Deep', () => {
      it('populates external, by name', async () => {
        const { app } = await makeApp()
        const users = await app.service('users').find({
          query: {},
          $populateParams: {
            name: 'withPosts',
          },
          paginate: false,
          provider: 'socketio',
        })

        const user = users[0]

        assert.ok(user.posts.length, 'user has posts')
        user.posts.forEach((post) => {
          assert.strictEqual(
            post.authorId,
            user.id,
            'post was added to the correct user',
          )
          assert.ok(
            !post.author,
            'no author was populated, since we did not request one.',
          )
          assert.ok(
            !post.comments,
            'no comments were populated, since we did not request any.',
          )
        })
      })

      it('populates nothing external, by query', async () => {
        const { app } = await makeApp()

        const users = await app.service('users').find({
          query: {},
          $populateParams: {
            query: {
              posts: {},
            },
          },
          paginate: false,
          provider: 'socketio',
        })

        const user = users[0]

        assert.ok(!user.posts, 'posts were not populated')
      })

      it('populates external, by query with option allowUnnamedQueryForExternal', async () => {
        const { app } = await makeApp({ allowUnnamedQueryForExternal: true })

        const users = await app.service('users').find({
          query: {},
          $populateParams: {
            query: {
              posts: {},
            },
          },
          paginate: false,
        })

        const user = users[0]

        assert.ok(user.posts.length, 'user has posts')
        user.posts.forEach((post) => {
          assert.strictEqual(
            post.authorId,
            user.id,
            'post was added to the correct user',
          )
          assert.ok(
            !post.author,
            'no author was populated, since we did not request one.',
          )
          assert.ok(
            !post.comments,
            'no comments were populated, since we did not request any.',
          )
        })
      })

      it('populates internal, by query', async () => {
        const { app } = await makeApp()

        const users = await app.service('users').find({
          query: {},
          $populateParams: {
            query: {
              posts: {},
            },
          },
          paginate: false,
        })

        const user = users[0]

        assert.ok(user.posts.length, 'user has posts')
        user.posts.forEach((post) => {
          assert.strictEqual(
            post.authorId,
            user.id,
            'post was added to the correct user',
          )
          assert.ok(
            !post.author,
            'no author was populated, since we did not request one.',
          )
          assert.ok(
            !post.comments,
            'no comments were populated, since we did not request any.',
          )
        })
      })

      it('populates supports `$limit` in $populateParams by default', async () => {
        const { app } = await makeApp()

        const user1 = (
          await app.service('users').find({
            query: {},
            $populateParams: {
              query: {
                posts: {},
              },
            },
            paginate: false,
          })
        )[0]

        const user2 = (
          await app.service('users').find({
            query: {},
            $populateParams: {
              query: {
                posts: {
                  $limit: 1,
                },
              },
            },
            paginate: false,
          })
        )[0]

        assert.ok(user1.posts.length > 1, 'reference user has more than 1 post')
        assert.strictEqual(user2.posts.length, 1, 'user has only one post')
      })

      it('populates supports `$select` in $populateParams by default', async () => {
        const { app } = await makeApp()

        const users = await app.service('users').find({
          query: {},
          $populateParams: {
            query: {
              posts: {
                $select: ['id', 'authorId'],
              },
            },
          },
          paginate: false,
        })

        const user = users[0]

        assert.ok(user.posts.length, 'user has posts')
        user.posts.forEach((post) => {
          assert.deepStrictEqual(
            _omit(post, ['id', 'authorId']),
            {},
            'post only has `id` and `authorId`',
          )
          assert.strictEqual(
            post.authorId,
            user.id,
            'post was added to the correct user',
          )
        })
      })

      it('populates supports `$skip` in $populateParams by default', async () => {
        const { app } = await makeApp()

        const user1 = (
          await app.service('users').find({
            query: {},
            $populateParams: {
              query: {
                posts: {},
              },
            },
            paginate: false,
          })
        )[0]

        const user2 = (
          await app.service('users').find({
            query: {},
            $populateParams: {
              query: {
                posts: {
                  $skip: 1,
                },
              },
            },
            paginate: false,
          })
        )[0]

        assert.strictEqual(
          user1.posts.length - 1,
          user2.posts.length,
          'skipped one post for second user',
        )
      })

      it('populates supports `$sort` in $populateParams by default', async () => {
        const { app } = await makeApp()

        const user1 = (
          await app.service('users').find({
            query: {},
            $populateParams: {
              query: {
                posts: {
                  $sort: {
                    title: 1,
                  },
                },
              },
            },
            paginate: false,
          })
        )[0]

        const user2 = (
          await app.service('users').find({
            query: {},
            $populateParams: {
              query: {
                posts: {
                  $sort: {
                    title: -1,
                  },
                },
              },
            },
            paginate: false,
          })
        )[0]

        const posts1 = user1.posts
        const posts2 = user2.posts

        assert.ok(posts1.length > 1, 'has at least some posts')
        assert.notDeepStrictEqual(posts1, posts2, 'arrays differ')
        assert.deepStrictEqual(
          _orderBy(posts1, 'title'),
          _orderBy(posts2, 'title'),
          'same entries',
        )
        assert.deepStrictEqual(
          posts1,
          _orderBy(posts1, 'title', 'asc'),
          'sorted alphabetically ascending',
        )
        assert.deepStrictEqual(
          posts2,
          _orderBy(posts2, 'title', 'desc'),
          'sorted alphabetically descending',
        )
      })

      it('ignore custom query for $populateParams', async () => {
        const { app } = await makeApp()

        const users1 = await app.service('users').find({
          query: {},
          $populateParams: {
            query: {
              posts: {},
            },
          },
          paginate: false,
        })

        const users2 = await app.service('users').find({
          query: {},
          $populateParams: {
            query: {
              posts: {
                test: {},
              },
            },
          },
          paginate: false,
        })

        assert.deepStrictEqual(users1, users2, 'custom query doesnt matter')
      })

      it('custom query in `service.options.graphPopulate.whitelist` for $populateParams', async () => {
        const { app } = await makeApp()

        const title = 'ipsam modi minima'

        const user1 = (
          await app.service('users').find({
            query: {},
            $populateParams: {
              query: {
                posts: {},
              },
            },
            paginate: false,
          })
        )[0]

        const user2 = (
          await app.service('users').find({
            query: {},
            $populateParams: {
              query: {
                posts: {
                  title,
                  $select: ['title'],
                },
              },
            },
            paginate: false,
          })
        )[0]

        assert.ok(
          user1.posts.some((post) => post.title !== title),
          'reference user has other posts',
        )
        assert.ok(
          user2.posts.length > 0 &&
            user2.posts.every((post) => post.title === title),
          'only posts with given title',
        )
      })

      it('custom query in $populateParams works with complex relation defined by `requestPerItem`', async () => {
        const { app } = await makeApp()

        const usersWithOrgNames = await app.service('users').find({
          query: {},
          $populateParams: {
            query: {
              organizations: {
                $select: ['name'],
              },
            },
          },
          paginate: false,
        })

        const everyUserHasOrganizations = usersWithOrgNames.every(
          (user) => user.organizations.length !== undefined,
        )

        assert.ok(everyUserHasOrganizations, 'populated organizations')
        usersWithOrgNames.forEach((user) => {
          user.organizations.forEach((org) => {
            assert.deepStrictEqual(
              Object.keys(org).sort(),
              ['id', 'name'].sort(),
              'org only has `name` property',
            )
          })
        })
      })
    })
    describe('Two Levels Deep', () => {
      it('populates external, by name', async () => {
        const { app } = await makeApp()

        const users = await app.service('users').find({
          query: {},
          $populateParams: {
            name: 'postsWithComments',
          },
          paginate: false,
          provider: 'socketio',
        })

        const user = users[0]

        assert.ok(user.posts.length, 'user has posts')
        user.posts.forEach((post) => {
          assert.strictEqual(
            post.authorId,
            user.id,
            'post was added to the correct user',
          )
          assert.ok(
            !post.author,
            'no author was populated, since we did not request one.',
          )
          assert.ok(post.comments.length, 'comments were populated')
          post.comments.forEach((comment) => {
            assert.strictEqual(
              post.id,
              comment.postId,
              'the comment was populated on the correct post.',
            )
          })
        })
      })

      it('populates nothing external, by query', async () => {
        const { app } = await makeApp()

        const users = await app.service('users').find({
          query: {},
          $populateParams: {
            query: {
              posts: {
                comments: {},
              },
            },
          },
          paginate: false,
          provider: 'socketio',
        })

        const user = users[0]

        assert.ok(!user.posts, 'posts were not populated')
      })

      it('populates internal, by query', async () => {
        const { app } = await makeApp()

        const users = await app.service('users').find({
          query: {},
          $populateParams: {
            query: {
              posts: {
                comments: {},
              },
            },
          },
          paginate: false,
        })

        const user = users[0]

        assert.ok(user.posts.length, 'user has posts')
        user.posts.forEach((post) => {
          assert.strictEqual(
            post.authorId,
            user.id,
            'post was added to the correct user',
          )
          assert.ok(
            !post.author,
            'no author was populated, since we did not request one.',
          )
          assert.ok(post.comments.length, 'comments were populated')
          post.comments.forEach((comment) => {
            assert.strictEqual(
              post.id,
              comment.postId,
              'the comment was populated on the correct post.',
            )
          })
        })
      })
    })

    describe('Three Levels Deep', () => {
      it('populates external, by name', async () => {
        const { app } = await makeApp()

        const users = await app.service('users').find({
          query: {},
          $populateParams: {
            name: 'postsWithCommentsWithUser',
          },
          paginate: false,
          provider: 'socketio',
        })

        const user = users[0]

        assert.ok(user.posts.length, 'user has posts')
        user.posts.forEach((post) => {
          assert.strictEqual(
            post.authorId,
            user.id,
            'post was added to the correct user',
          )
          assert.ok(
            !post.author,
            'no author was populated, since we did not request one.',
          )
          assert.ok(post.comments.length, 'comments were populated')
          post.comments.forEach((comment) => {
            assert.strictEqual(
              post.id,
              comment.postId,
              'the comment was populated on the correct post.',
            )
            assert.ok(comment.user, 'populated the user object')
          })
        })
      })

      it('populates nothing external, by query', async () => {
        const { app } = await makeApp()

        const users = await app.service('users').find({
          query: {},
          $populateParams: {
            query: {
              posts: {
                comments: {},
              },
            },
          },
          paginate: false,
          provider: 'socketio',
        })

        const user = users[0]

        assert.ok(!user.posts, 'posts were not populated')
      })

      it('populates internal, by query', async () => {
        const { app } = await makeApp()

        const users = await app.service('users').find({
          query: {},
          $populateParams: {
            query: {
              posts: {
                comments: {
                  user: {},
                },
              },
            },
          },
          paginate: false,
        })

        const user = users[0]

        assert.ok(user.posts.length, 'user has posts')
        user.posts.forEach((post) => {
          assert.strictEqual(
            post.authorId,
            user.id,
            'post was added to the correct user',
          )
          assert.ok(
            !post.author,
            'no author was populated, since we did not request one.',
          )
          assert.ok(post.comments.length, 'comments were populated')
          post.comments.forEach((comment) => {
            assert.strictEqual(
              post.id,
              comment.postId,
              'the comment was populated on the correct post.',
            )
            assert.ok(comment.user, 'populated the user object')
          })
        })
      })
    })

    describe('Multiple Populates Per Level', () => {
      it('populates multiple relationships at multiple levels', async () => {
        const { app } = await makeApp()

        const users = await app.service('users').find({
          query: {},
          $populateParams: {
            query: {
              orgMemberships: {
                org: {},
                user: {},
              },
              groupMemberships: {
                group: {},
                org: {},
                user: {},
              },
              posts: {
                comments: {},
              },
              comments: {
                post: {},
              },
              tasks: {},
            },
          },
          paginate: false,
        })
        const user = users[0]

        assert.ok(user.orgMemberships.length, 'user has orgMemberships')
        user.orgMemberships.forEach((orgMembership) => {
          assert.ok(orgMembership.org, 'got orgMembership with nested org')
          assert.ok(orgMembership.user, 'got orgMembership with nested user')
        })

        user.groupMemberships.forEach((groupMembership) => {
          assert.ok(groupMembership.org, 'got groupMembership with nested org')
          assert.ok(
            groupMembership.group,
            'got groupMembership with nested group',
          )
          assert.ok(
            groupMembership.user,
            'got groupMembership with nested user',
          )
        })

        assert.ok(user.posts.length, 'user has posts')
        user.posts.forEach((post) => {
          assert.strictEqual(
            post.authorId,
            user.id,
            'post was added to the correct user',
          )
          assert.ok(
            !post.author,
            'no author was populated, since we did not request one.',
          )
          assert.ok(post.comments.length, 'comments were populated')
          post.comments.forEach((comment) => {
            assert.strictEqual(
              post.id,
              comment.postId,
              'the comment was populated on the correct post.',
            )
          })
        })

        assert.ok(user.comments.length, 'got all of the user comments')
        user.comments.forEach((comment) => {
          assert.ok(comment.post, 'got the post nested in the coment')
        })

        const tasks = await app.service('tasks').find({
          query: {
            ownerIds: user.id,
          },
          paginate: false,
        })

        assert.strictEqual(
          user.tasks.length,
          tasks.length,
          'got all of the user tasks',
        )
      })
    })

    describe('Recursive Populates', () => {
      it('can handle recursive populates', async () => {
        const { app } = await makeApp()

        const users = await app.service('users').find({
          query: {},
          $populateParams: {
            query: {
              tasks: {
                childTasks: {
                  childTasks: {
                    childTasks: {},
                  },
                },
              },
            },
          },
          paginate: false,
        })
        const user = users[0]

        assert.ok(user.tasks.length)
        user.tasks.forEach((task) => {
          assert.ok(task.childTasks.length, 'got the childTasks')

          task.childTasks.forEach((task) => {
            assert.ok(task.childTasks.length, 'got the childTasks')

            task.childTasks.forEach((task) => {
              assert.ok(task.childTasks.length, 'got the childTasks')

              task.childTasks.forEach((task) => {
                assert.ok(!task.ChildTasks, 'no tasks populated at this level')
              })
            })
          })
        })
      })
    })
  })
  describe('Populate Utility', () => {
    it('populates on a single record', async () => {
      const { app } = await makeApp()

      const users = await app.service('users').find({
        query: {
          $limit: 1,
        },
        paginate: false,
      })
      const user = users[0]

      await populateUtil(user, {
        app,
        params: {
          $populateParams: {
            query: {
              posts: {
                comments: {},
              },
            },
          },
        },
        populates: userPopulates,
      })

      assert.ok(user.posts.length, 'user has posts')
      user.posts.forEach((post) => {
        assert.strictEqual(
          post.authorId,
          user.id,
          'post was added to the correct user',
        )
        assert.ok(
          !post.author,
          'no author was populated, since we did not request one.',
        )
        assert.ok(post.comments.length, 'comments were populated')
        post.comments.forEach((comment) => {
          assert.strictEqual(
            post.id,
            comment.postId,
            'the comment was populated on the correct post.',
          )
        })
      })
    })
  })
})
