var User = require('../model/users');
var moment = require('moment');

module.exports = {
    accountsStatistics: function (req, res) {
        User.getUpsUsers(function (err, users) {
            var ups = users.length;
            var today = moment(new Date()).format("YYYY-MM-DD");
            var todayUps = 0;
            var weekUps = 0;
            var monthUps = 0;
            var beyondUps = 0;
            users.forEach(function (user) {
                var userDate = moment(new Date(user.stats.alta.toDateString())).format("YYYY-MM-DD");
                var remainingDate = moment(today).diff(userDate, 'days');
                if (remainingDate == 0) {
                    todayUps++;
                } else if (remainingDate > 0 && remainingDate < 7) {
                    weekUps++;
                } else if (remainingDate > 7 && remainingDate < 30) {
                    monthUps++;
                } else {
                    beyondUps++
                }
            });
            User.getDownsUsers(function (err, users) {
                var downs = users.length;
                var todayDowns = 0;
                var weekDowns = 0;
                var monthDowns = 0;
                var beyondDowns = 0;
                users.forEach(function (user) {
                    var userDate = moment(new Date(user.stats.alta.toDateString())).format("YYYY-MM-DD");
                    var remainingDate = moment(today).diff(userDate, 'days');
                    if (remainingDate == 0) {
                        todayDowns++;
                    } else if (remainingDate > 0 && remainingDate < 7) {
                        weekDowns++;
                    } else if (remainingDate > 7 && remainingDate < 30) {
                        monthDowns++;
                    } else {
                        beyondDowns++
                    }
                });
                res.status(200).send(
                    {
                        error:0,
                        totales: {
                            altas: ups,
                            bajas: downs
                        },
                        altas: {
                            hoy: todayUps,
                            semana: weekUps,
                            mes: monthUps,
                            masMes: beyondUps
                        },
                        bajas: {
                            hoy: todayDowns,
                            semana: weekDowns,
                            mes: monthDowns,
                            masMes: beyondDowns
                        }
                    });
            });
        });
    },
    lastAccessStatistics: function (req, res) {
        User.getUsers(function (err, users) {
            var today = moment(new Date()).format("YYYY-MM-DD");
            var todayAccess = 0;
            var threeDaysAccess = 0;
            var weekAccess = 0;
            var monthAccess = 0;
            var beyondMonth = 0;
            users.forEach(function (user) {
                var userDate = moment(new Date(user.stats.ultimo_acceso.toDateString())).format("YYYY-MM-DD");
                var remainingDate = moment(today).diff(userDate, 'days');
                if (remainingDate == 0) {
                    todayAccess++;
                } else if (remainingDate > 0 && remainingDate < 3) {
                    threeDaysAccess++;
                } else if (remainingDate > 3 && remainingDate < 7) {
                    weekAccess++;
                } else if (remainingDate > 7 && monthAccess < 30) {
                    monthAccess++;
                } else {
                    beyondMonth++
                }
            });
            res.status(200).send({error: 0, todayAccess: todayAccess, threeDaysAccess: threeDaysAccess,
                weekAccess: weekAccess, monthAccess: monthAccess, beyondMonth: beyondMonth});
        })
    },
    resourcesStatistics: function (req, res) {
        User.getUsers(function (err, users) {
            var totalTweets = 0;
            var totalProg = 0;
            users.forEach(function (user) {
                totalTweets += user.stats.ntweets;
                totalProg += user.stats.nprog;
            });
            res.status(200).send({error: 0, total: totalTweets, totalProg: totalProg});
        })
    },
    userStatics: function (req, res) {
        User.getUser(req.params.user, function (err, user) {
            res.status(200).send({error: 0, total: user.stats.ntweets, totalProg: user.stats.nprog});
        });
    }
};