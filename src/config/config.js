const dbSettings = {
  url: process.env.DB_URL || 'mongodb://localhost:27017/tfg'
}

const serverSettings = {
  port: process.env.PORT || 3000
}

module.exports = Object.assign({}, { serverSettings, dbSettings });