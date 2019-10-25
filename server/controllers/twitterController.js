var crypto = require('crypto'),
  oauth = require('oauth'),
  async = require('async'),
    twitter = require('../config/twitterConnection'),
    user = require('../model/users'),
    moment = require('moment'),
    analytics = require('../model/analytics'),
    sentiment = require('multilang-sentiment'),
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

  const tweetsObjectB = {
    id_of_analityc: idOfAnalityc,
    state: 'init'
  }

  
  
  let savedTweetsObject = await tweets.add(tweetsObjectB);
  
  tweets.updateStatusOfSearching(savedTweetsObject._id, 'Getting Statuses')

  do {
    console.log(`Getting statuses -> ${ statuses.length }`);

    result = (await getStat(searchParameter, accessToken, accessTokenSecret, maxId));

    console.log(result.length);
    

    statuses = [...statuses, ...result]

    if (statuses.length > 0) {
      maxId = statuses[statuses.length - 1].id;
    }
  } while (result.length > 1);

  if (statuses.length > 0) {
    let lastId = null,
      iterator = 0;

    tweets.updateStatusOfSearching(savedTweetsObject._id, 'Getting Replays');

    const lastDaysStatuses = statuses.filter((stat) => moment(new Date(stat.created_at)) >= dateSevenDays);
    let tweetIds = statuses.map((stat) => stat.id.toString());
    console.log(`Statuses in the last seven days ${statuses.length } and lastSeven days ${ lastDaysStatuses.length }`);

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

        if (tweetIds.filter(tw => partialReplay.in_reply_to_status_id && tw === partialReplay.in_reply_to_status_id.toString())) {
          if (acc[partialReplay.in_reply_to_status_id]) {
            partialNewAcc = [...acc[partialReplay.in_reply_to_status_id], {
              text: partialReplay.text,
              sentiment_score: sentiment(partialReplay.text, 'es'),
              created_at: partialReplay.created_at,
              in_reply_to_status_id: partialReplay.in_reply_to_status_id,
              in_reply_to_status_id_str: partialReplay.in_reply_to_status_id_str,
              in_reply_to_user_id: partialReplay.in_reply_to_user_id,
              in_reply_to_user_id_str: partialReplay.in_reply_to_user_id_str,
              in_reply_to_screen_name: partialReplay.in_reply_to_screen_name
            }];
          } else {
            partialNewAcc = [{
              text: partialReplay.text,
              sentiment_score: sentiment(partialReplay.text, 'es'),
              created_at: partialReplay.created_at,
              in_reply_to_status_id: partialReplay.in_reply_to_status_id,
              in_reply_to_status_id_str: partialReplay.in_reply_to_status_id_str,
              in_reply_to_user_id: partialReplay.in_reply_to_user_id,
              in_reply_to_user_id_str: partialReplay.in_reply_to_user_id_str,
              in_reply_to_screen_name: partialReplay.in_reply_to_screen_name
            }];
          }


          newAcc = {
            ...acc,
            [partialReplay.in_reply_to_status_id]: partialNewAcc
          }
        } else {
          newAcc = acc
        }

        return newAcc;
      }, replaysForTweet);

      lastId = statusResult.id;
      iterator++;
    }
  }

  let tweetsObject = {
    id_of_analityc: idOfAnalityc,
    state: 'Done',
    tweets: statuses.map((status) => 
    replaysForTweet[status.id] ? 
    ({
      ...status,
      replies: replaysForTweet[status.id]
    }) : status)
  }

  // savedTweetsObject = {
  //   _id: savedTweetsObject._id,
  //   id_of_analityc: idOfAnalityc,
  //   state: 'Done',
  //   tweets: statuses.map((status) =>
  //     replaysForTweet[status.id] ?
  //     ({
  //       ...status,
  //       replies: replaysForTweet[status.id]
  //     }) : status)
  // }

  // console.log(savedTweetsObject._id);

  tweets.updateStatusOfSearching(
    savedTweetsObject._id,
    'Done',
    statuses.map((status) => 
      replaysForTweet[status.id] ? 
      ({
        ...status,
        replies: replaysForTweet[status.id]
      }) : status)
  );
  // tweets.add(tweetsObject);
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

function getStat(searchParameter, accessToken, accessTokenSecret, maxId) {
  let maxIdString = '';

  if (maxId != 0) {
    maxIdString = `&max_id=${ maxId }`
  }

  return new Promise((resolve, reject) =>
    oauth.get(`${ twitter.acciones.user_timeline }?screen_name=${ searchParameter }&count=200${ maxIdString }`,
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