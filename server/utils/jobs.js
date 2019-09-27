var cron = require('node-cron');
var twitter = require("../controllers/twitterController");
var user = require("../model/users");


module.exports = {
    programmedTweets: function(){
        console.log("Servicio monitorizando tweets a enviar")
        cron.schedule('0 * * * * *', function(){
            twitter.getProgrammed(function (err,tweets) {
                if(err) throw err;
                else {
                    for(var i = 0;i<tweets.length;i++){
                        twitter.programmedTweet(tweets[i],function(err){
                            if (err) throw err;
                            console.log("tweet enviado");
                        });
                    }
                }
            });
        })
    }
}



