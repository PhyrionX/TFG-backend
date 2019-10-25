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
  },
  getTweetById: function(_id) {
    return new Promise((resolve, reject) => {
      Tweets.findById(_id, function(err, tweet) {
        if (err) reject(err);
        resolve(tweet);  
      }) 
    })
  },
  getTweetByIdOfAnalityc: function(_id) {
    return new Promise((resolve, reject) => {
      Tweets.findOne({id_of_analityc: _id}, function(err, tweet) {
        if (err) reject(err);
        resolve(tweet);  
      }) 
    })
  },
  updateStatusOfSearching: function(_id, state, tweets) {
    return new Promise((resolve, reject) => {
      this.getTweetById(_id)
        .then((tweet) => {
          console.log("Update => ",tweet);
          tweet.state = state

          if (tweets && tweets.length > 0) {
            tweet.tweets = tweets;
          }

          tweet.save();
          resolve(tweet);
        })
        .catch((err) => {
          reject(err);
        })
    })
  }
}