// tasks-model.js - An nedb model
const NeDB = require('nedb');
const path = require('path');

let moduleExports = function (app) {
  const dbPath = app.get('nedb');

  let Model = new NeDB({
    filename: path.join(dbPath, 'tasks.db'),
    autoload: true,
  });

  return Model;
};

module.exports = moduleExports;
