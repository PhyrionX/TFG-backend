var user = require('../model/users');
var crypto = require('crypto');

module.exports = {
    createAdmin: function() {
        var email = "admin";
        var pass = "admin";
        var _user = {
            "email": email, "password": crypto.createHash('sha1').update(pass).digest('base64'),
            "admin": true
        };
        user.removeAdmin(function (err) {
            user.add(_user, function (err) {
                if (!err) {
                    console.log("System init");
                }
            })
        })
    },
    insertSomeUsers: function () {
        user.getUsers(function (err, users) {
            if (users.length < 30) {
                for(var i = 0; i < 30; i++) {
                    var email = "prueba" + i;
                    var pass = "1234";
                    var tweets = Math.floor(Math.random() * 20) + 1;
                    var prog = Math.floor(Math.random() * 10) + 1;
                    var b_borrado = Math.random() >= 0.8;
                    if (b_borrado) {
                        var baja = randomDate(new Date(2016, 3, 1), new Date());
                    }
                    var alta = randomDate(new Date(2016, 3, 1), new Date());
                    var ultimoAcceso = randomDate(alta, new Date());
                    var _user = {
                        "email": email, "password": crypto.createHash('sha1').update(pass).digest('base64'),
                        "b_borrado": b_borrado, "stats.alta": alta, "stats.baja": baja,
                        "stats.ultimo_acceso": ultimoAcceso, "stats.ntweets": tweets, "stats.nprog": prog
                    };
                    user.add(_user, function (err) {

                    });
                }
            }
        });
    }
};

function randomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

