const { dbSettings, serverSettings } = require('./config');
const database = require('./db/mongo');
const { initDI } = require('./di');

const init = initDI.bind(null, { serverSettings, dbSettings, database });

module.exports = Object.assign({}, { init });
