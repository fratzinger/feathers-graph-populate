// Hooks for service `tasks`.
const commonHooks = require('feathers-hooks-common');

const { populates } = require('./tasks.schema');
const { populate } = require('../../../lib/index');
const namedQueries = undefined;

/* eslint no-unused-vars:0 */
const { iff } = commonHooks;
/* eslint no-unused-vars:0 */
const {
  create,
  update,
  patch,
  validateCreate,
  validateUpdate,
  validatePatch,
} = require('./tasks.validate');

let moduleExports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  after: {
    all: [],
    find: [populate({ populates, namedQueries })],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
};

module.exports = moduleExports;
