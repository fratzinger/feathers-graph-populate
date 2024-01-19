# feathers-graph-populate

[![Github Actions](https://github.com/marshallswain/feathers-graph-populate/actions/workflows/node.js.yml/badge.svg)](https://github.com/marshallswain/feathers-graph-populate/actions)
[![libraries.io](https://img.shields.io/librariesio/release/npm/feathers-graph-populate)](https://libraries.io/npm/feathers-graph-populate)
[![Download Status](https://img.shields.io/npm/dm/feathers-graph-populate.svg?style=flat-square)](https://www.npmjs.com/package/feathers-graph-populate)

> NOTE: This is the version for Feathers v5. For Feathers v4 use [feathers-graph-populate v3](https://github.com/marshallswain/feathers-graph-populate/tree/crow)

<p align="center">
  <img 
    src="https://feathers-graph-populate.netlify.app/img/graph-populate-logo.png" 
    alt="Feathers Graph Populate"
    style="margin: 0 auto; max-width: 200px"
  />
</p>

Add lightning fast, GraphQL-like populates to your FeathersJS API.

This project is built for [FeathersJS](http://feathersjs.com). An open source web framework for building modern real-time applications. 

## Documentation

See https://feathers-graph-populate.netlify.app/ for full documentation

## Getting Started

### Define your relationships

The top-level keys in the `populates` represent the name of the relationship.

```js
const populates = {
  posts: {
    service: 'posts',
    nameAs: 'posts',
    keyHere: '_id',
    keyThere: 'authorId',
    asArray: true,
    params: {}
  },
  comments: {
    service: 'comments',
    nameAs: 'comments',
    keyHere: '_id',
    keyThere: 'userId',
    asArray: true,
    params: {}
  },
  openTasks: {
    service: 'tasks',
    nameAs: 'openTasks',
    keyHere: '_id',
    keyThere: 'ownerIds',
    asArray: true,
    params: {
      query: {
        completedAt: null
      }
    }
  },
  role: {
    service: 'roles',
    nameAs: 'role',
    keyHere: 'roleId',
    keyThere: '_id',
    asArray: false,
    params: {}
  }
}
```

### Options for each relationship

Each populate object must/can have the following properties:

| **Option** | **Description** |
|------------|-----------------|
| `service`  | The service for the relationship<br><br>**required**<br>**Type:** `{String}` |
| `nameAs`   | The property to be assigned to on this entry. It's recommended that you make the populate object key name match the `nameAs` property.<br><br>**required**<br>**Type:** `{String}` |
| `keyHere`  | The primary or secondary key for the current entry<br><br>**required**<br>**Type:** `{String}` |
| `keyThere` | The primary or secondary key for the referenced entry/entries<br><br>**required**<br>**Type:** `{String}` |
| `asArray`  | Is the referenced item a single entry or an array of entries?<br><br>**optional - default:** `true`<br>**Type:** `{Boolean}`
| `params`   | Additional params to be passed to the underlying service.<br>You can mutate the passed `params` object or return a newly created `params` object which gets merged deeply <br>Merged deeply after the params are generated internally.<br>**ProTip:** You can use this for adding a '$select' property or passing authentication and user data from 'context' to 'params' to restrict accesss<br><br>**optional - default:** `{}`<br>**Type:** `{Object | Function(params, context): undefined|params}` |

### Create named queries to use from connected clients.

The top-level keys in the `nameQueries` object are the query names. Nested keys under the query name refer to the name of the relationship, found in the `populates` object from the previous code snippet.

```js
const namedQueries = {
  withPosts: {
    posts: {}
  },
  postsWithComments: {
    posts: {
      comments: {}
    }
  },
  postsWithCommentsWithUser: {
    posts: {
      comments: {
        user:{}
      }
    }
  }
}
```

### Register the hook

```js
const { populate } = require('feathers-graph-populate')

const hooks = {
  after: {
    all: [
      populate({ populates, namedQueries })
    ]
  }
}
```

### Perform Queries

Use a named query from a connected client:

```js
feathersClient.service('users').find({
  query: {},
  $populateParams: {
    name: 'postsWithCommentsWithUser'
  }
})
```

Use a query object for internal requests. (named queries also work, internally):

```js
app.service('users').find({
  query: {},
  $populateParams: {
    query: {
      posts: {
        comments: {
          user:{}
        }
      }
    }
  }
})
```

### Handling Custom Client-Side Params

Since FeathersJS only supports passing `params.query` from client to server, by default, we need to let it know about the new `$populateParams` object.  We can do this using the `paramsForServer` and `paramsFromCLient` hooks:

```js
const { paramsForServer } = require('feathers-graph-populate')

feathersClient.hooks({
  before: {
    all: [
      paramsForServer('$populateParams')
    ]
  }
})
```

Now to allow the API server to receive the custom param:

```js
const { paramsFromClient } = require('feathers-graph-populate')

feathersClient.hooks({
  before: {
    all: [
      paramsFromClient('$populateParams')
    ]
  }
})
```

## Testing

Simply run `npm test` and all your tests in the `test/` directory will be run.


## Help

For more information on all the things you can do, visit [the generator](https://generator.feathers-plus.com/), [FeathersJS](http://docs.feathersjs.com) and [extensions](https://feathers-plus.github.io/).


## License

Licensed under the [MIT license](LICENSE).
