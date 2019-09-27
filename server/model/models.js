var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// define the userSchema
var userSchema = new Schema({
    email: {type: String, require: true, unique: true},
    password: {type: String, require: true},
    nombre: {type: String, require: true},
    apellidos: {type: String, require: true},
    b_borrado: {type: Boolean, default: false},
    admin: {type:Boolean, default: false},
    stats: {
        alta:{type: Date, default: Date.now()},
        baja:{type: Date},
        ultimo_acceso:{type: Date, default: Date.now()},
        ntweets:{type: Number, default: 0},
        nprog:{type:Number,default:0}
    },
    cuentas: [
        {
            id_twitter:{type: String},
            cuenta:{type: String},
            access_token:{type: String},
            access_token_secret:{type: String},
            info:{type: String},
            tweetP: [ //A publicar
                {
                    fecha: {type: Date},
                    text:{type:String},
                    enviado:{type:Boolean}
                }
            ]
        }
    ],
    hashtags: [String]
});

// Export the User model
exports.User = mongoose.model('User', userSchema);
