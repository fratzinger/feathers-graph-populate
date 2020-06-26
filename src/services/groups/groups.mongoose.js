/* eslint quotes: 0 */
// Defines Mongoose model for service `groups`.
const merge = require('lodash.merge');
/* eslint no-unused-vars:0 */
const mongoose = require('mongoose');

let moduleExports = merge(
  {},

  {
    name: String,
    orgId: mongoose.Schema.Types.ObjectId,
  }
);

module.exports = moduleExports;
