const repository = (container) => {
  const { database: db } = container.cradle;

  
  const testDB = () => {
    return new Promise((resolve, reject) => {
      const payload = {
        test: 'ok',
        count: 3
      }

      db.collection('test').insertOne(payload, (err, tested) => {
        if (err) {
          reject(new Error('An error ocurred testing'));
        }
        
        resolve(tested);
      })
    })

  }
  
  return {
    testDB
  }
}

const connect = (container) => {
  return new Promise((resolve, reject) => {
    if (!container.resolve('database')) {
      reject(new Error('connection db not supplied!'))
    }
    resolve(repository(container))
  })
}

module.exports = Object.assign({}, {connect})
