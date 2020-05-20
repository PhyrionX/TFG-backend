module.exports = ({repo}, app) => {
  app.get('/test', (req, res, next) => {
    res.status(200).send('hi')
    
    console.log(repo);    
  });
}