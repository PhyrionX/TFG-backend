var User = require('./models').User;

module.exports = {

    add: function(_newUser, callback) {
        var newUser = new User(_newUser);
        newUser.save(function(err){
            callback(err);
        });
    },
    //devuelve todos menos el admin
    getUsers: function(callback) {
        User.find({admin: false, b_borrado: false}, function(err, user) {
            callback(err, user);
        });
    },
    getUser: function(_email, callback) {
        User.findOne({email: _email}, function(err, user) {
            callback(err, user);
        })
    },
    getDownsUsers: function (callback) {
        User.find({b_borrado: true}, function (err, user) {
            callback(err, user);
        });
    },
    getUpsUsers: function (callback) {
        User.find({b_borrado: false}, function (err, user) {
            callback(err, user);
        });
    },
    removeUser: function(_email, callback){
        this.getUser(_email,function(err,user){
            user.b_borrado = true;
            user.stats.baja = Date.now();
            user.save();
            callback();
        });
    },
    removeAdmin: function (callback) {
        this.getUser("admin", function (err, user) {
            if (user) {
                user.remove(function (err) {
                    callback(err);
                });
            } else {
                callback(err);
            }
        });
    },
    addAccount: function(_email,_account,callback){
        var intro = false;
        this.getUser(_email,function(err,user){
            //console.log(user.cuentas[0]);
            for (var i = 0; i < user.cuentas.length; i++) {
                if (user.cuentas[i].id_twitter == _account.id_twitter) {
                    intro = true;
                }
            }
            if (!intro) {
                user.cuentas.push(_account);
                user.save();
            }
            callback(err, user);
        });
    },
    removeAccount: function (_email, _account, callback) {
        var position = -1;
        this.getUser(_email, function (err, user) {
            for (var i = 0; i < user.cuentas.length; i++) {
                if (user.cuentas[i].id_twitter == _account) {
                    position = i;
                }
            }
            if (position >= 0) {
                user.cuentas.splice(position, 1);
                user.save();
            }
            callback(err, user);
        })

    },
    getHashtags: function(_email, callback) {
        this.getUser(_email, function(err, user) {
            callback(err, user.hashtags);
        })
    },
    getHashtag: function(_email, callback) {
        this.getUser(_email, function(err, user) {
            callback(err, user.hashtags);
        })
    },
    addHashtag: function(_email, hashtag, callback) {
        var intro = true;
        this.getUser(_email, function(err, user) {
            for (var i = 0; i < user.hashtags.length; i++) {
                if (user.hashtags[i] == hashtag) {
                    intro = false;
                }
            }
            if (intro) {
                user.hashtags.push(hashtag);
                var newUser = new User(user);
                newUser.save(user,function(err){
                    callback(err, user.hashtags);
                });
            } else {
                callback(true, user.hashtags);
            }

        })
    },
    removeHashtag: function(_email, hashtag, callback) {
        var position = -1;
        this.getUser(_email, function (err, user) {
            for (var i = 0; i < user.hashtags.length; i++) {
                if (user.hashtags[i] == hashtag) {
                    position = i;
                }
            }
            if (position >= 0) {
                user.hashtags.splice(position, 1);
                user.save();
            }
            callback(err, user.hashtags);
        })
    },
    getProgrammed: function(callback) {
        this.getUsers(function (err, users) {
            var tweets=[];
            for(var i=0;i<(users.length);i++){
                for (var j=0;j<(users[i].cuentas.length);j++){
                    for (var n=0; n<(users[i].cuentas[j].tweetP.length);n++){
                        if(!users[i].cuentas[j].tweetP[n].enviado){
                            if(new Date(users[i].cuentas[j].tweetP[n].fecha).getTime()<Date.now()){
                                var tweet = {fecha: users[i].cuentas[j].tweetP[n].fecha,
                                    text: users[i].cuentas[j].tweetP[n].text,
                                    access_token: users[i].cuentas[j].access_token,
                                    access_token_secret: users[i].cuentas[j].access_token_secret
                                };
                                users[i].cuentas[j].tweetP[n].enviado = true;
                                users[i].save(function(err){
                                    if(err)throw err;
                                });
                                tweets.push(tweet);
                            }
                        }
                    }
                }
            }
            callback(err,tweets);
        });
    },
    addProgrammed: function(body,callback){
        this.getUser(body.user,function(err,user) {
            for (var i = 0; i < (user.cuentas.length); i++) {
                if(user.cuentas[i].id_twitter== body.idtwitter){
                    var tweet = {fecha: body.fecha,text: body.text,enviado:false};
                    user.cuentas[i].tweetP.push(tweet);
                    var newUser = new User(user)
                    newUser.save(user,function(err){
                        callback(err);
                    });
                }
            }
        });
    },

}