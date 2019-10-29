var AnalitycsInfo = require('./models').AnalitycsInfo;

module.exports = {

  add: function (_analitycInfo) {
    var newAnalyticInfo = new AnalitycsInfo(_analitycInfo);
    return new Promise((resolve, reject) => {
      newAnalyticInfo.save(function (err) {
        if (err) reject(err);
        resolve(newAnalyticInfo);
      })
    });
  },
  getAnalitycInfoById: function(_id) {
    return new Promise((resolve, reject) => {
      AnalitycsInfo.findById(_id, function(err, AnalitycsInfo) {
        if (err) reject(err);
        resolve(AnalitycsInfo);  
      }) 
    })
  },
  getAnalitycInfoByIdOfAnalityco: function(_id) {
    return new Promise((resolve, reject) => {
      AnalitycsInfo.findOne({id_of_analityc: _id}, function(err, tweet) {
        if (err) reject(err);
        resolve(tweet);  
      }) 
    })
  },
  updateStatusOfAnalisys: function(_id, data) {
    return new Promise((resolve, reject) => {
      this.getAnalitycInfoById(_id)
        .then((analitycInfo) => {
          console.log("Update => ",analitycInfo);

          analitycInfo.state = data.state;

          if (data.replies) {
            analitycInfo.repliesTotal = data.repliesTotal,
            analitycInfo.mediasTotal = data.mediasTotal,
            analitycInfo.urlsTotal = data.urlsTotal,
            analitycInfo.userMentions = data.userMentions,
            analitycInfo.userMentionsTotal = data.userMentionsTotal,
            analitycInfo.hashtags = data.hashtags,
            analitycInfo.hashtagsTotal = data.hashtagsTotal,
            analitycInfo.favoritesTotal = data.favoritesTotal,
            analitycInfo.retweetsTotal = data.retweetsTotal,
            analitycInfo.dateInit = data.dateInit,
            analitycInfo.dateEnd = data.dateEnd,
            analitycInfo.ownPosts = data.ownPosts,
            analitycInfo.sharePosts = data.sharePosts,
            analitycInfo.postsInDay = data.postsInDay,
            analitycInfo.postsInMonth = data.postsInMonth,
            analitycInfo.userMentionsGrouped = data.userMentionsGrouped,
            analitycInfo.hashtagsGrouped = data.hashtagsGrouped,
            analitycInfo.replies = data.replies
          }
 
          analitycInfo.save()
          .catch(err => console.log('err', err));
          resolve(analitycInfo);
        })
        .catch((err) => {
          reject(err);
        })
    })
  }
}