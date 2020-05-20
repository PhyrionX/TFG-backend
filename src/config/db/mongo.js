const MongoClient = require('mongodb');

const connect = (options, mediator) => {
  mediator.once('boot.ready', () => {
    MongoClient.connect(options.url, (err, db) => {
      if (err) {
        mediator.emit('db.error', err);
      }

      mediator.emit('db.ready', db);
    });
  });
}

module.exports = Object.assign({}, { connect })
