var Tweets = require('./models').Tweets;

module.exports = {

  add: function (_newTweet) {
    var newTweet = new Tweets(_newTweet);
    return new Promise((resolve, reject) => {
      newTweet.save(function (err) {
        if (err) reject(err);
        resolve(newTweet);
      })
    });
  }
}