
/* eslint quotes: 0 */
// Defines Sequelize model for service `tasks`. (Can be re-generated.)
const merge = require('lodash.merge')
const Sequelize = require('sequelize')
// eslint-disable-next-line no-unused-vars
const DataTypes = Sequelize.DataTypes
// !code: imports // !end
// !code: init // !end

let moduleExports = merge({},
  // !<DEFAULT> code: sequelize_model
  {
    name: {
      type: DataTypes.TEXT
    },
    ownerIds: {
      type: DataTypes.JSONB
    },
    childTasksIds: {
      type: DataTypes.JSONB
    }
  },
  // !end
  // !code: moduleExports // !end
)

// !code: exports // !end
module.exports = moduleExports

// !code: funcs // !end
// !code: end // !end
