var crypto = require('crypto'),
  oauth = require('oauth'),
  async = require('async'),
    twitter = require('../config/twitterConnection'),
    user = require('../model/users'),
    moment = require('moment'),
    analytics = require('../model/analytics'),
    analitycsInfo = require('../model/analitycsInfo'),
    sentiment = require('multilang-sentiment'),
    strint = require('../utils/strint'),
    tweets = require('../model/tweets');
var jwt = require('jwt-simple');
var config = require('../config/config');

var OAuth = require('oauth').OAuth,
  oauth = new OAuth(
    twitter.uri_request_token,
    twitter.uri_access_token,
    twitter.consumer_key,
    twitter.consumer_secret_key,
    twitter.oauth_v,
    process.env.TCALLBACK || twitter.uri_callback,
    twitter.signature
  );

async function getStatuses(searchParameter, idOfAnalityc, accessToken, accessTokenSecret) {
  let statuses = [];
  let result = []
  let maxId = 0;
  let dateSevenDays = moment(Date.now() - 7 * 24 * 3600 * 1000);
  let replaysForTweet = {};

  const analitycsObject = {
    id_of_analityc: idOfAnalityc,
    state: 'init'
  }
  let savedAnlitycObject = await analitycsInfo.add(analitycsObject);

  
  let twww = await tweets.getTweetByScreenName(searchParameter)


  // const allTweetsOfScreenName = twww.reduce((acc, curr) => {
  //   return [...curr.tweets, ...acc]
  // }, []);

  // console.log(twww && twww.tweets && twww.tweets.length);
  
  const allTweetsOfScreenName = twww && twww.tweets ? twww.tweets : [];

  console.log('aaaa_> ', allTweetsOfScreenName.length);
  
  
  // allTweetsOfScreenName.map(el => console.log(el.id))
  const idSince = allTweetsOfScreenName.length > 0 && allTweetsOfScreenName[0].id;

  console.log('idSince -> ', idSince);
  

  
  const lastAnalitycsInfo = await analitycsInfo.getAnalitycInfoByName(searchParameter);

  analitycsInfo.updateStatusOfAnalisys(savedAnlitycObject._id, {
      state: 'Getting Statuses'
    })
    .catch((err) => console.log(err))

  do {
    console.log(`Getting statuses -> ${ statuses.length }`);

    result = (await getStat(searchParameter, accessToken, accessTokenSecret, maxId /*,idSince*/));
    // if (idSince && result.length === 1) {
    //   result = [];
    // }

    console.log(result.length);

    statuses = [...statuses, ...result]

    console.log(statuses.length);


    if (statuses.length > 0) {
      //   console.log(result[0].id === maxId);
      
      maxId = statuses[statuses.length - 1].id;
    }
  } while (result.length > 1);

  // statuses = statuses.slice(0, 500);
  const lastStatuseId = statuses.length > 0 ?   statuses[statuses.length - 1].id : -1;
  const firstStatuseIdFromMongo = allTweetsOfScreenName.length > 0 ? allTweetsOfScreenName[0].id : -1;
  const newTuits = statuses.filter((tuit) => Number(firstStatuseIdFromMongo) < Number(tuit.id));

  console.log("MongoID -> " + newTuits.length);
  

  statuses = [...statuses, ...allTweetsOfScreenName.filter((tuit) => Number(lastStatuseId) > Number(tuit.id))];
  // allTweetsOfScreenName
  const ownPosts = statuses.filter(el => !el.retweeted_status);
  
  console.log(allTweetsOfScreenName.length, ownPosts.length);
  const sharePosts = statuses.filter(el => !!el.retweeted_status);
  const analitycsORM = ownPosts.reduce((acc, curr) => ({
    ...acc,
    hashtagsTotal: acc.hashtagsTotal + curr.entities.hashtags.length,
    hashtags: [...acc.hashtags, ...curr.entities.hashtags.map(el => el.text)],
    mediasTotal: curr.entities.media ? acc.mediasTotal + curr.entities.media.length : acc.mediasTotal,
    urlsTotal: acc.urlsTotal + curr.entities.urls.length,
    userMentionsTotal: acc.userMentionsTotal + curr.entities.user_mentions.length,
    userMentions: [...acc.userMentions, ...curr.entities.user_mentions.map(el => el.screen_name)],
    favoritesTotal: acc.favoritesTotal + curr.favorite_count,
    retweetsTotal: acc.retweetsTotal + curr.retweet_count
  }), {
    mediasTotal: 0,
    urlsTotal: 0,
    userMentions: [],
    userMentionsTotal: 0,
    hashtags: [],
    hashtagsTotal: 0,
    favoritesTotal: 0,
    retweetsTotal: 0,
    dateInit: ownPosts.length > 0 && ownPosts[ownPosts.length - 1].created_at,
    dateEnd: ownPosts.length > 0 && ownPosts[0].created_at,
    ownPosts: ownPosts.length,
    sharePosts: sharePosts.length,
    postsInDay: getTweetsPerTime(ownPosts, 'DAYS'),
    postsInMonth: getTweetsPerTime(ownPosts, 'MONTHS'),
    totals: getTotalsType(ownPosts),
    screen_name: searchParameter,
  });

  analitycsORM.userMentionsGrouped = analitycsORM.userMentions.reduce(groupCount2, []);
  analitycsORM.hashtagsGrouped = analitycsORM.hashtags.reduce(groupCount2, []);

  // console.log(analitycs);

  if (ownPosts.length > 0) {
    let lastId = null,
      iterator = 0;

    analitycsInfo.updateStatusOfAnalisys(savedAnlitycObject._id, {
        state: 'Getting Replies'
      })
      .catch((err) => console.log(err))



    const lastDaysStatuses = allTweetsOfScreenName.length === 0 ? ownPosts.filter((stat) => moment(new Date(stat.created_at)) >= dateSevenDays) : 
        newTuits.filter((stat) => moment(new Date(stat.created_at)) >= dateSevenDays);
    let tweetIds = ownPosts.map((stat) => stat.id.toString());
    console.log(`Statuses ${ownPosts.length } and lastSeven days ${ lastDaysStatuses.length }`);

    while (iterator < lastDaysStatuses.length) {
      console.log(`Replays for the status ${ iterator }`);

      let statusResult = lastDaysStatuses[iterator];
      let partialReplays = [];

      try {
        partialReplays = await getReplys(searchParameter, accessToken, accessTokenSecret, statusResult.id, lastId);
      } catch (err) {
        console.error(err);
      };

      replaysForTweet = partialReplays.reduce((acc, partialReplay) => {

        let newAcc;
        let partialNewAcc;

        if (tweetIds.filter(tw => partialReplay.in_reply_to_status_id && tw === partialReplay.in_reply_to_status_id.toString()).length > 0) {
          if (acc[partialReplay.in_reply_to_status_id]) {
            partialNewAcc = getSemtimentData(partialReplay.text, acc[partialReplay.in_reply_to_status_id]);
          } else {
            partialNewAcc = getSemtimentData(partialReplay.text)
          }

          newAcc = {
            ...acc,
            [partialReplay.in_reply_to_status_id]: partialNewAcc
          }
        } else {
          newAcc = acc
        }
        return newAcc;
      }, replaysForTweet)

      lastId = statusResult.id;
      iterator++;

    }
    
    console.log('AASASDASDASDASDAS ', ownPosts.length);
    tweets.removeTweetByScreenName(searchParameter);
    
    tweets.add({
      tweets: ownPosts.map(post => ({
        id: post.id,
        id_str: post.id_str,
        text: post.text,
        entities: post.entities,
        created_at: post.created_at,
        retweet_count: post.retweet_count,
        favorite_count: post.favorite_count
      })),
      id_of_analityc: idOfAnalityc,
      screen_name: searchParameter
    })
  }
  
  analitycsORM.replies = [...Object.entries(replaysForTweet).map(el => ({
    id: el[0],
    ...el[1]
  })), ...lastAnalitycsInfo ? lastAnalitycsInfo.replies : []];
  analitycsORM.state = 'Done';
  
  
  analitycsInfo.updateStatusOfAnalisys(savedAnlitycObject._id, analitycsORM)
  .catch((err) => console.log(err))
  
  // analitycsORM.replies.reduce((acc, curr) =>
  //   acc.find((el) => el.id === curr.id) ? acc.map((el) => el.id === curr.id ? { ...el, count: el.count + 1 } : el) : [...acc, { id: curr.id, count: 1 }], []).map((el) => console.log(el)).length;


}

// function mergedSearch(analitycsNew, analitycsGeneral, haveData) { 
//   console.log(!!analitycsGeneral);
//   if (analitycsGeneral, !haveData) {
//     analitycsNew.state = 'Same'
//   }
//   return analitycsNew;
// }

function groupCount2(acc, curr) {
  return !acc.find((el) => el.value === curr) ? [...acc, {
      value: curr,
      count: 1
    }] :
    acc.map((el) => el.value === curr ? {
      ...el,
      count: el.count + 1
    } : el);
}

function getTotalsType(posts) {
  console.log("TOTALS " + posts.length);
  

  return posts.reduce((acc, curr) => ({
    onlyText: !curr.entities.media && curr.entities.urls.length === 0 ? acc.onlyText + 1 : acc.onlyText,
    onlyImage: !curr.text && haveImage(curr) ? acc.onlyImage + 1 : acc.onlyImage,
    textAndImage: curr.text && haveImage(curr) ? acc.textAndImage + 1 : acc.textAndImage,
    textAndImageAndUrl: curr.entities.urls.length > 0 && curr.text && haveImage(curr) ? acc.textAndImageAndUrl + 1 : acc.textAndImageAndUrl,
    onlyVideo: !curr.text && haveVideo(curr) ? acc.onlyVideo + 1 : acc.onlyVideo,
    textAndVideo: curr.text && haveVideo(curr) ? acc.textAndVideo + 1 : acc.textAndVideo,
    textAndVideoAndUrl: curr.entities.urls.length > 0 && curr.text && haveVideo(curr) ? acc.textAndVideoAndUrl + 1 : acc.textAndVideoAndUrl,
    textAndUrls: !curr.entities.media && curr.entities.urls.length > 0 ? acc.textAndUrls + 1 : acc.textAndUrls,
    textAndMedia: curr.entities.media && curr.entities.urls.length === 0 ? acc.textAndMedia + 1 : acc.textAndMedia,
    textUrlsAndMedia: curr.entities.media && curr.entities.urls.length > 0 ? acc.textUrlsAndMedia + 1 : acc.textUrlsAndMedia
  }), {
    onlyText: 0,
    onlyImage: 0,
    textAndImage: 0,
    textAndImageAndUrl: 0,
    onlyVideo: 0,
    textAndVideo: 0,
    textAndVideoAndUrl: 0,
    textAndUrls: 0,
    textAndMedia: 0,
    textUrlsAndMedia: 0
  })
}

function getTweetsPerTime(tweets, tweetsTimeChart) {
  // console.log(tweets, tweets[tweets.length - 1].created_at, tweets[0].created_at, tweetsTimeChart);
  
  return tweets.reduce((acc, curr) => {
    const keyName = moment(new Date(curr.created_at)).format(tweetsTimeChart === 'DAYS' ? 'DD-MM-YY' : 'MM-YY');

    return acc.map((el) => el.name === keyName ? {
      ...el,
      onlyText: !curr.entities.media && curr.entities.urls.length === 0 ? el.onlyText + 1 : el.onlyText,
      onlyImage: !curr.text && haveImage(curr) ? el.onlyImage + 1 : el.onlyImage,
      textAndImage: curr.text && haveImage(curr) ? el.textAndImage + 1 : el.textAndImage,
      textAndImageAndUrl: curr.entities.urls.length > 0 && curr.text && haveImage(curr) ? el.textAndImageAndUrl + 1 : el.textAndImageAndUrl,
      onlyVideo: !curr.text && haveVideo(curr) ? el.onlyVideo + 1 : el.onlyVideo,
      textAndVideo: curr.text && haveVideo(curr) ? el.textAndVideo + 1 : el.textAndVideo,
      textAndVideoAndUrl: curr.entities.urls.length > 0 && curr.text && haveVideo(curr) ? el.textAndVideoAndUrl + 1 : el.textAndVideoAndUrl,
      textAndUrls: !curr.entities.media && curr.entities.urls.length > 0 ? el.textAndUrls + 1 : el.textAndUrls,
      textAndMedia: curr.entities.media && curr.entities.urls.length === 0 ? el.textAndMedia + 1 : el.textAndMedia,
      textUrlsAndMedia: curr.entities.media && curr.entities.urls.length > 0 ? el.textUrlsAndMedia + 1 : el.textUrlsAndMedia,
      favorites: el.favorites + curr.favorite_count,
      retweets: el.retweets + curr.retweet_count,
      tweets: el.tweets + 1
    } : el)
  }, getArrayOfDatesBetween(tweets[tweets.length - 1].created_at, tweets[0].created_at, tweetsTimeChart))
}

function haveImage(curr) {
  // console.log(curr.entities.media ? true : false);
  // console.log(curr.entities.media ? curr.entities.media[0].expanded_url.includes('photo') : false);
  return curr.entities.media ? curr.entities.media[0].expanded_url.includes('photo') : false;
}

function haveVideo(curr) {
  // console.log(curr.entities.media ? true : false);
  // console.log(curr.entities.media ? curr.entities.media[0].expanded_url.includes('photo') : false);
  return curr.entities.media ? curr.entities.media[0].expanded_url.includes('video') : false;
}

function getArrayOfDatesBetween(startDate, endDate, tweetsTimeChart) {
  let dates = [];

  let currDate = moment(new Date(startDate)).startOf(tweetsTimeChart === 'DAYS' ? 'day' : 'month');
  let lastDate = moment(new Date(endDate)).startOf(tweetsTimeChart === 'DAYS' ? 'day' : 'month');

  while (currDate.add(1, tweetsTimeChart === 'DAYS' ? 'days' : 'months').diff(lastDate) <= 0) {
    dates.push({
      name: currDate.format(tweetsTimeChart === 'DAYS' ? 'DD-MM-YY' : 'MM-YY'),
      tweets: 0,
      onlyText: 0,
      onlyImage: 0,
      textAndImage: 0,
      textAndImageAndUrl: 0,
      onlyVideo: 0,
      textAndVideo: 0,
      textAndVideoAndUrl: 0,
      textAndUrls: 0,
      textAndMedia: 0,
      textUrlsAndMedia: 0,
      favorites: 0,
      retweets: 0
    });
  }

  return dates.reverse()
}

function getSemtimentData(text, partial) {
  const sentimentScore = sentiment(text, 'es').score;
  let sentimentObject = partial ? {
      text: [ ...partial.text, text ],
      replies: partial.replies + 1,
      score: sentimentScore + partial.score,
      positive: sentimentScore > 0 ? partial.positive + 1 : partial.positive,
      negative: sentimentScore < 0 ? partial.negative + 1 : partial.negative,
      neutral: sentimentScore === 0 ? partial.neutral + 1 : partial.neutral
    } :
    {
      text: [ text ],
      replies: 1,
      score: sentimentScore,
      positive: sentimentScore > 0 ? 1 : 0,
      negative: sentimentScore < 0 ? 1 : 0,
      neutral: sentimentScore === 0 ? 1 : 0
    }
  return sentimentObject;
}

function getReplys(searchParameter, accessToken, accessTokenSecret, sinceId, maxId) {
  let maxIdString = '';

  if (maxId) {
    maxIdString = `&max_id=${ maxId }`
  }

  // console.log(`${ twitter.acciones.search }?q=to%3A${ searchParameter }&result_type=recent&count=100&since_id=${ sinceId }${ maxIdString }`);

  return new Promise((resolve, reject) =>
    oauth.get(`${ twitter.acciones.search }?q=to%3A${ searchParameter }&result_type=recent&count=100&since_id=${ sinceId }${ maxIdString }`,
      accessToken, accessTokenSecret,
      function (err, response) {
        if (err) reject(err)
        resolve(JSON.parse(response).statuses);
      }
    )
  )
}

function getStat(searchParameter, accessToken, accessTokenSecret, maxId, idSince) {
  let maxIdString = '';
  let sinceId = '';

  if (idSince) {
    sinceId = `&since_id=${ idSince }`
  }

  if (maxId != 0) {
    maxIdString = `&max_id=${ maxId }`
  }

  return new Promise((resolve, reject) =>
    oauth.get(`${ twitter.acciones.user_timeline }?screen_name=${ searchParameter }&count=200${ maxIdString }${ sinceId }`,
      accessToken, accessTokenSecret,
      function (err, response) {
        if (err) reject(err)
        resolve(JSON.parse(response));
      }
    )
  )
}

module.exports = {
  prueba: function (req, res) {
    oauth.get(twitter.acciones.user_timeline, "284462392-qT1hXHOomD6K1SnjqWYkMwDdFX2zotTKVSZjHgnx", "scAPiEIsZsLzJO7xHmeVBexq6pCX0qEMEDdqkGnuCSx5M", function (e, data, result) {
      res.status(200).send(data);
    });
  },

  getOauth: function (req, res) {
    oauth.getOAuthRequestToken(function (error, oauth_token, oauth_token_secret, results) {
      if (error) {
        console.log(error);
        res.send("Authentication Failed!" + process.env.TCK + " " + process.env.TCS + " " + process.env.TCALLBACK);
      } else {
        if (req.body.informacion == "" || req.body.informacion == null) {
          req.session.info = "Sin información"
        } else {
          req.session.info = req.body.informacion;
        };

        req.session.user_id = req.body.user;
        req.session.oauthRequestToken = oauth_token;
        req.session.oauthRequestTokenSecret = oauth_token_secret;
        res.redirect('https://twitter.com/oauth/authenticate?oauth_token=' + oauth_token)
      }
    });
  },
  callbackOauth: function (req, res, next) {
    const session = req.session;

    oauth.getOAuthAccessToken(req.session.oauthRequestToken, req.session.oauthRequestTokenSecret, req.query.oauth_verifier,
      function (error, oauth_access_token, oauth_access_token_secret, results) {
        if (error) {
          console.log(error);
          res.send("Authentication Failure!");
        } else {
          req.session.access_token = oauth_access_token;
          req.session.access_token_secret = oauth_access_token_secret;
          var cuentaTwitter = {}
          cuentaTwitter.id_twitter = results.user_id;
          cuentaTwitter.cuenta = results.screen_name;
          cuentaTwitter.access_token = oauth_access_token;
          cuentaTwitter.access_token_secret = oauth_access_token_secret;
          cuentaTwitter.info = req.session.info;

          console.log(req.session, session);

          user.addAccount(req.session.user_id, cuentaTwitter, function (err, user) {
            console.log(user);
          })

          res.redirect('http://localhost:8080/#/configuration'); // You might actually want to redirect!
        }
      });
  },
  getSuggestions: function (req, res, next) {
    var token = req.headers.authorization;

    user.getUser(jwt.decode(token, config.TOKEN_SECRET).sub, function (err, data) {
      if (err) return res.status(400);

      console.log(data);


      oauth.get(twitter.acciones.users + "?q=" + req.params.search, data.cuentas[0].access_token, data.cuentas[0].access_token_secret, function (e, response, result) {
        return res.status(200).json({
          result: JSON.parse(response)
        });
      });
    });
  },
  getSavedSearch: function (req, res, next) {
    analytics.getSavedSearch(req.params.idSearch)
      .then((search) => res.status(200).json(search))
      .catch((err) => res.status(400).json({
        error: 1
      }))
  },
  getSavedAnalitycInfo: function (req, res, next) {
    analitycsInfo.getAnalitycInfoByIdOfAnalityco(req.params.idSearch)
      // .then((analitycInfo) => {
      //   console.log(analitycInfo.replies.reduce((acc, curr) => {
      //     const newAcc = acc;

      //     if (newAcc.find(el => el.id === curr.id)) {
      //       console.log('a');
            
      //       newAcc.map((el2) => el2.id === curr.id ? {...el2, value: el2.value + 1} : el2)
      //     } else {
      //       newAcc.push({id: curr.id, value: 1})
      //     }


      //     return newAcc;
      //   }, [])
      //   .map((el) => console.log(el)).length);

      //   // analitycsInfo.replies.map((el) => console.log(el.id))
        
      //   return analitycInfo;
      // })
      .then((analitycInfo) => res.status(200).json(analitycInfo))
      .catch((err) => res.status(400).json({
        error: 1,
        message: err.message
      }))
  },
  getSavedTweet: function (req, res, next) {
    tweets.getTweetByIdOfAnalityc(req.params.idSearch)
      .then((tweet) => {
        res.status(200).json({
          state: tweet.state,
          tweets: tweet.tweets.map((tweetObject) => ({
            created_at: tweetObject.created_at,
            entities: tweetObject.entities,
            favorite_count: tweetObject.favorite_count,
            id: tweetObject.id,
            id_str: tweetObject.id_str,
            replies: tweetObject.replies,
            retweet_count: tweetObject.retweet_count,
            source: tweetObject.source,
            text: tweetObject.text,
            // user_image: tweetObject.user.profile_image_url,
            // user_screen_name: tweetObject.user.screen_name
          }))
        })
      })
      .catch((err) => res.status(400).json({
        error: 1,
        message: err.message
      }))
  },
  getTweetsByMention: function (req, res, next) {
    tweets.getTweetByIdOfAnalityc(req.params.idSearch)
      .then((tweet) => {
        res.status(200).json(
          tweet.tweets.filter((el) =>
            el.entities.user_mentions.some(obj =>
              obj.screen_name === req.params.mention)
          ).map((tweetObject) => ({
            created_at: tweetObject.created_at,
            favorite_count: tweetObject.favorite_count,
            id: tweetObject.id,
            id_str: tweetObject.id_str,
            retweet_count: tweetObject.retweet_count,
            source: tweetObject.source,
            text: tweetObject.text,
          }))
        )
      })
      .catch((err) => res.status(400).json({
        error: 1,
        message: err.message
      }))
  },
  getTweetsByHashtag: function (req, res, next) {
    tweets.getTweetByIdOfAnalityc(req.params.idSearch)
      .then((tweet) => {
        res.status(200).json(
          tweet.tweets.filter((el) =>
            el.entities.hashtags.some(obj =>
              obj.text === req.params.hashtag)
          ).map((tweetObject) => ({
            created_at: tweetObject.created_at,
            favorite_count: tweetObject.favorite_count,
            id: tweetObject.id,
            id_str: tweetObject.id_str,
            retweet_count: tweetObject.retweet_count,
            source: tweetObject.source,
            text: tweetObject.text,
          }))
        )
      })
      .catch((err) => res.status(400).json({
        error: 1,
        message: err.message
      }))
  },
  friend_timeline: function (req, res, next) {
    var token = req.headers.authorization;
    user.getUser(jwt.decode(token, config.TOKEN_SECRET).sub, function (err, data) {
      if (err) return res.status(400);
      // Promise.all([
      //     getStatuses(req.params.search),
      new Promise((resolve, reject) =>
          oauth.get(twitter.acciones.users_show + "?screen_name=" + req.params.search,
            data.cuentas[0].access_token, data.cuentas[0].access_token_secret,
            function (err, response, result) {
              if (err) reject(err)
              resolve(response);
            }
          )
        )
        // ])
        .then((user) => {
          var userJson = JSON.parse(user);

          return analytics.add({
            id: userJson.id,
            id_str: userJson.id_str,
            user_searcher: jwt.decode(token, config.TOKEN_SECRET).sub,
            type: 'twitter',
            name: userJson.name,
            screen_name: userJson.screen_name,
            location: userJson.location,
            description: userJson.description,
            url: userJson.url,
            followers_count: userJson.followers_count,
            friends_count: userJson.friends_count,
            listed_count: userJson.listed_count,
            favorites_count: userJson.favorites_count,
            statuses_count: userJson.statuses_count,
            profile_background_image_url: userJson.profile_background_image_url,
            profile_image_url: userJson.profile_image_url,
          })
        })
        .then((response) => {
          getStatuses(req.params.search, response._id)
            .catch((e) => console.log('error => ', e))
          return res.status(200).json(response)
        })
        .catch((err) => console.log(err))
    })
  },
  getHistory: function (req, res, next) {
    analytics.getHistoy()
      .then((data) => res.status(200).json(data))
      .catch((err) => {
        console.log(err.message);

        return res.status(400).json({
          error: '1'
        })
      })
  },
  testing: function (req, res, next) {
    var token = req.headers.authorization;
    user.getUser(jwt.decode(token, config.TOKEN_SECRET).sub, function (err, data) {
      if (err) return res.status(400);

      oauth.get(twitter.acciones.search, data.cuentas[0].access_token, data.cuentas[0].access_token_secret, function (e, response, result) {
        console.log(e, JSON.parse(response));
        return res.status(200).json({
          result: JSON.parse(response)
        });
      });
    })
  },
  getTimelinesHashtag: function (req, res, next) {
    async.parallel({
      one: function (callback) {
        oauth.get(twitter.acciones.hashtags + "?q=%23" + req.params.hashtag, req.params.accessToken, req.params.accessTokenSecret, function (e, res, result) {
          callback(null, res);
        });
      }
    }, function (err, results) {
      res.status(200).json({
        error: 0,
        hashahaha: JSON.parse(results.one)
      });
    });
  },
  getTimelines: function (req, res, next) {
    var data, data2, data3, data4, data5;
    async.parallel({
      one: function (callback) {
        oauth.get(twitter.acciones.user_timeline, req.params.accessToken, req.params.accessTokenSecret, function (e, res, result) {
          callback(null, res);
        });
      },
      two: function (callback) {
        oauth.get(twitter.acciones.home_timeline, req.params.accessToken, req.params.accessTokenSecret, function (e, res, result) {
          callback(null, res);
        });
      },
      three: function (callback) {
        oauth.get(twitter.acciones.mentions_timeline, req.params.accessToken, req.params.accessTokenSecret, function (e, res, result) {
          callback(null, res);
        });
      },
      four: function (callback) {
        oauth.get(twitter.acciones.favorites_timeline, req.params.accessToken, req.params.accessTokenSecret, function (e, res, result) {
          callback(null, res);
        });
      },
      five: function (callback) {
        oauth.get(twitter.acciones.retweets_timeline, req.params.accessToken, req.params.accessTokenSecret, function (e, res, result) {
          callback(null, res);
        });
      }
    }, function (err, results) {
      res.status(200).json({
        error: 0,
        user_timeline: JSON.parse(results.one),
        home_timeline: JSON.parse(results.two),
        mentions_timeline: JSON.parse(results.three),
        favorites_timeline: JSON.parse(results.four),
        retweets_timeline: JSON.parse(results.five)
      });
    });
  },
  addAccount: function (req, res, next) {

  },
  getAccount: function (req, res, next) {
    user.getUser(req.params.user, function (err, data) {
      if (err) return res.status(500).send({
        error: 3,
        mensaje: "Server Error"
      });
      if (data != null) {
        for (var i = 0; i < data.length; i++) {
          if (data[i].id_twitter == req.paramas.twitter) {
            if (data != null) return res.status(200).send({
              error: 0,
              cuenta: data.cuenta[i]
            });
          }
        }
        return res.status(400).send({
          error: 1,
          mensaje: "Cuenta de twitter no existente"
        });
      } else return res.status(400).send({
        error: 1,
        mensaje: "Usuario no existente"
      });

    });
  },
  getAccounts: function (req, res, next) {
    user.getUser(req.params.user, function (err, data) {
      if (err) return res.status(500).send({
        error: 3,
        mensaje: "Server Error"
      });
      if (data != null) return res.status(200).send({
        error: 0,
        cuentas: data.cuentas
      });
      else return res.status(400).send({
        error: 1,
        mensaje: "Usuario no existente"
      });
    });
  },
  removeAccount: function (req, res, next) {
    user.removeAccount(req.params.id, req.params.id_twitter, function (err, data) {
      if (err) return res.status(500).send({
        error: 3,
        mensaje: "Server Error"
      });
      else return res.status(200).send({
        error: 0,
        cuentas: "Oka"
      });
    })

  },
  tweet: function (req, res, next) {
    oauth.post(twitter.acciones.tweet,
      req.body.access_token, req.body.access_token_secret, {
        status: req.body.text
      },
      function (error, data, response2) {
        if (error) {
          console.log('Error: Something is wrong.\n' + JSON.stringify(error) + '\n');
          res.status(400).json({
            error: 1,
            message: "error al tweetear"
          })
        } else {
          console.log('Twitter status updated.\n');
          console.log(response2 + '\n');
          res.status(200).json({
            error: 0,
            tweet: data
          })
        }
      });

  },
  programmedTweet: function (tweet, callback) {
    console.log(tweet);
    oauth.post(twitter.acciones.tweet,
      tweet.access_token, tweet.access_token_secret, {
        status: tweet.text
      },
      function (error, data, response2) {
        if (error) {
          console.log('Error: Something is wrong.\n' + JSON.stringify(error) + '\n');
          callback(error);
        } else {
          console.log('Twitter status updated.\n');
          console.log(response2 + '\n');
          callback(error);
        }
      });
  },
  getProgrammed: function (callback) {
    user.getProgrammed(function (err, tweets) {
      callback(err, tweets);
    });
  },
  addProgrammed: function (req, res, next) {
    user.addProgrammed(req.body, function (err) {
      if (err) return res.status(500).send({
        error: 3,
        mensaje: "Server Error"
      });
      res.status(200).send({
        error: 0,
        mensaje: "ok"
      });
    });
  },
  getHashtags: function (req, res, next) {

    user.getHashtags(req.headers.user_id, function (err, hashtag) {
      if (err) return res.status(500).send({
        error: 3,
        mensaje: "Server Error"
      });
      // llamada api
      res.status(200).send({
        error: 0,
        hashtags: hashtag
      });
    });
  },
  getHashtag: function (req, res, next) {
    user.getHashtag(req.body.email, function (err, hashtag) {
      if (err) return res.status(500).send({
        error: 3,
        mensaje: "Server Error"
      });
      // llamada api
      res.status(200).send({
        error: 0,
        hashtag: hashtag
      });
    });
  },
  addHashtag: function (req, res, next) {
    user.addHashtag(req.headers.user_id, req.body.hashtag, function (err, hashtag) {
      if (err) return res.status(500).send({
        error: 3,
        mensaje: "Server Error"
      });
      res.status(200).send({
        error: 0,
        hashtags: hashtag
      });
    })
  },
  removeHashtag: function (req, res, next) {
    user.removeHashtag(req.params.id, req.params.hashtag, function (err, hashtags) {
      if (err) return res.status(500).send({
        error: 3,
        mensaje: "Server Error"
      });
      res.status(200).send({
        error: 0,
        hashtag: hashtags
      });
    })
  },
}