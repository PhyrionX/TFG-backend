module.exports = ({repo}, app) => {
  app.get('/test', (res, req, next) => {
    console.log('aa');    
  });
}