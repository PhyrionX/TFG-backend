const { EventEmitter } = require('events');
const { asValue } = require('awilix');
const server =  require('./server/server');
const repository = require('./repository/repository');
const di = require('./config');
const mediator = new EventEmitter();

console.log('--- Twitter Service ---')

mediator.on('di.ready', (container) => {
  repository.connect(container)
    .then((repo) => {
      console.log('Connected. Starting Server');
      container.register({ repo : asValue(repo) });
      server.start(container);
    })
    .then((app) => {
      console.log(`Server started succesfully in port: ${container.cradle.serverSettings.port}.`);
      app.on('close', () => {
        container.resolve('repo').disconnect()
      })
    });
});

di.init(mediator);

mediator.emit('init');