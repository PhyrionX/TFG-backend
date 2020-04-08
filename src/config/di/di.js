const { createContainer, asValue } = require('awilix');

function initDI ({ serverSettings, dbSettings, database }, mediator) {
  mediator.once('init', () => {
    mediator.on('db.ready', (db) => {
      const container = createContainer();
  
      container.register({
        database: asValue(db),
        serverSettings: asValue(serverSettings),
        dbSettings: asValue(dbSettings)
      });
  
      mediator.emit('di.ready', container);
    });

    database.connect(dbSettings, mediator);

    mediator.emit('boot.ready');
  });
}

module.exports.initDI = initDI;