/* eslint quotes: 0 */
// Defines Sequelize model for service `users`.
const merge = require('lodash.merge');
const Sequelize = require('sequelize');
/* eslint no-unused-vars:0 */
const DataTypes = Sequelize.DataTypes;

let moduleExports = merge(
  {},
  {
    firstName: {
      type: DataTypes.TEXT,
    },
    lastName: {
      type: DataTypes.TEXT,
    },
    email: {
      type: DataTypes.TEXT,
    },
    password: {
      type: DataTypes.TEXT,
    },
  }
);
module.exports = moduleExports;
