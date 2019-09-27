/**
 * Autores: Rubén Gabás Celimendiz, Alejandro Solanas Bonilla, Daniel Uroz Hinarejos
 * NIAs: 590738, 647647, 545338
 * Proyecto: OPbird
 * Fichero: main.js
 * Fecha: 19/5/2016
 * Funcion: Modulo main del sistema, API REST con express
 */

//Modulos a cargar en el servidor
var express = require('express'),
    bodyParser = require('body-parser'),
    methodOverride = require('method-override'),
    compression = require('compression'),
    path = require('path'),
    config = require('./server/config/config'),
    mongoose = require('mongoose'),
    middleware = require("./server/controllers/middleware"),
    usersController = require('./server/controllers/userController'),
    twitterController = require('./server/controllers/twitterController'),
    session = require('express-session'),
    jobs = require("./server/utils/jobs"),
    util = require('./server/utils/utils'),
    init = require('./server/utils/init'),
    stats = require('./server/controllers/stats');

var app = express();

app.use(session({ secret: "very secret" }));


app.set('port', (process.env.PORT || config.port));

app.use(compression());

app.use(methodOverride());

app.use(express.static(path.join(__dirname, './public')));
app.set('dbUrl', process.env.BBDD || config.db.test);
// connect mongoose to the mongo dbUrl
mongoose.connect(app.get('dbUrl'));
app.use(function(err, req, res, next) {
    console.log(err.stack);
    res.send(500, err.message);
});

//si no existe el admin lo creamos
init.createAdmin();
init.insertSomeUsers();
jobs.programmedTweets();

//Configuramos express
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// **************************************************************
//   API REST DE LA APP
// **************************************************************
/** Users **/
app.post("/api/login", usersController.login);
app.post("/api/register", usersController.register);
app.get("/api/user",middleware.ensureAuthenticated,usersController.getUsers);
app.get("/api/user/:id",middleware.ensureAuthenticated,usersController.getUser);
app.put("/api/user",middleware.ensureAuthenticated,usersController.updateUser);
app.delete("/api/user",middleware.ensureAuthenticated,usersController.deleteUser);
app.post("/api/user/comparePasswords",middleware.ensureAuthenticated,usersController.comparePassword);


/** Administrar Cuenta Twitter **/
app.get("/api/twitterAccount/:user", middleware.ensureAuthenticated, twitterController.getAccounts);//get lista de cuentas
app.post("/api/twitterAccount",middleware.ensureAuthenticated, twitterController.addAccount);//anadir cuenta (/:user? o en el body)
app.delete("/api/twitterAccount/:id/:id_twitter",middleware.ensureAuthenticated, twitterController.removeAccount);//eliminar cuenta
app.get("/api/twitterAccount/:user/:twitter",middleware.ensureAuthenticated, twitterController.getAccount);//devolver cosas de una cuenta
//publica tweet, no se si usar el mismo para los programados tambien
app.post("/api/twitterAccount/tweet",middleware.ensureAuthenticated, twitterController.tweet);
app.post("/api/twitterAccount/prog",middleware.ensureAuthenticated,twitterController.addProgrammed);



app.get("/api/hashtag",middleware.ensureAuthenticated, twitterController.getHashtags);
app.get("/api/hashtag/:id",middleware.ensureAuthenticated, twitterController.getHashtag);
app.post("/api/hashtag/",middleware.ensureAuthenticated, twitterController.addHashtag);
app.delete("/api/hashtag/:id/:hashtag",middleware.ensureAuthenticated, twitterController.removeHashtag);

app.get("/auth/prueba", twitterController.prueba);

/** TwitterApi **/
app.post("/auth/twitter", twitterController.getOauth);
app.get("/auth/twitter/callback", twitterController.callbackOauth);
app.get("/api/twitter/timelines/:accessToken/:accessTokenSecret/:twitter", middleware.ensureAuthenticated, twitterController.getTimelines);
app.get("/api/twitter/timelinesHashtag/:accessToken/:accessTokenSecret/:hashtag", middleware.ensureAuthenticated, twitterController.getTimelinesHashtag);

/** Stats **/
app.get("/api/stats/:user", stats.userStatics);
app.get("/api/stats/:user/:twitter");

app.get("/admin/stats/accounts", stats.accountsStatistics);
app.get("/admin/stats/access", stats.lastAccessStatistics);
app.get("/admin/stats/resources", stats.resourcesStatistics);
app.get("/admin/stats/map");

/** UTILS **/

app.post("/api/short/",middleware.ensureAuthenticated,util.shortURL);


//Zona privada
//app.get("/api/private/getUsers", middleware.ensureAuthenticated, usersController.getUsers);
//app.get("/api/private/getUsers", middleware.ensureAuthenticated, usersController.getUsers);

/** NOT FOUND **/
app.get('*', function(req, res){
    res.status(404).send('<h1>Tíííííííííííííííííííío no me toques la URL o te meto!!!!!!</h1>');
});


app.listen(app.get('port'), function() {
    console.log('Node app is running on port', app.get('port'));
});

