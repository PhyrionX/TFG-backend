const MongoClient = require('mongodb');

const connect = (options, mediator) => {
  mediator.once('boot.ready', () => {
    MongoClient.connect(options.url, (err, db) => {
      if (err) {
        mediator.mediator('db.error', err);
      }

      mediator.emit('db.ready', db);
    });
  });
}

module.exports = Object.assign({}, { connect })
