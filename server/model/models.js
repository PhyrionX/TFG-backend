var mongoose = require('mongoose');
var Schema = mongoose.Schema;
// define the userSchema
// var userSchema = new Schema({
//   email: {
//     type: String,
//     require: true,
//     unique: true
//   },
//   password: {
//     type: String,
//     require: true
//   },
//   nombre: {
//     type: String,
//     require: true
//   },
//   apellidos: {
//     type: String,
//     require: true
//   },
//   b_borrado: {
//     type: Boolean,
//     default: false
//   },
//   admin: {
//     type: Boolean,
//     default: false
//   },
//   stats: {
//     alta: {
//       type: Date,
//       default: Date.now()
//     },
//     baja: {
//       type: Date
//     },
//     ultimo_acceso: {
//       type: Date,
//       default: Date.now()
//     },
//     ntweets: {
//       type: Number,
//       default: 0
//     },
//     nprog: {
//       type: Number,
//       default: 0
//     }
//   },
//   cuentas: [{
//     id_twitter: {
//       type: String
//     },
//     cuenta: {
//       type: String
//     },
//     access_token: {
//       type: String
//     },
//     access_token_secret: {
//       type: String
//     },
//     info: {
//       type: String
//     },
//     tweetP: [ //A publicar
//       {
//         fecha: {
//           type: Date
//         },
//         text: {
//           type: String
//         },
//         enviado: {
//           type: Boolean
//         }
//       }
//     ]
//   }],
//   hashtags: [String]
// });

var userSchema = new Schema({
  email: {
    type: String,
    require: true,
    unique: true
  },
  password: {
    type: String,
    require: true
  },
  name: {
    type: String,
    require: true
  },
  b_borrado: {
    type: Boolean,
    default: false
  },
  cuentas: [{
    id_twitter: {
      type: String
    },
    cuenta: {
      type: String
    },
    access_token: {
      type: String
    },
    access_token_secret: {
      type: String
    },
    info: {
      type: String
    }
  }]
});

var analyticsSchema = new Schema({
  id: {
    type: Number,
    require: true,
  },
  id_str: {
    type: String,
    require: true,
  },
  user_searcher: {
    type: String
  },
  date_of_search: {
    type: Date,
    default: Date.now
  },
  type: {
    type: String
  },
  name: {
    type: String
  },
  screen_name: {
    type: String
  },
  location: {
    type: String
  },
  description: {
    type: String
  },
  url: {
    type: String
  },
  followers_count: {
    type: Number,
    require: true,
  },
  friends_count: {
    type: Number,
    require: true,
  },
  listed_count: {
    type: Number,
    require: true,
  },
  favourites_count: {
    type: Number,
    require: true,
  },
  statuses_count: {
    type: Number
  },
  profile_background_image_url: {
    type: String
  },
  profile_image_url: {
    type: String
  },
  tweets: {
    type: Array
  }
})

var tweetsSchema = new Schema({
  id_of_analityc: {
    type: String,
    require: true
  },
  state: {
    type: String,
    require: true
  },
  tweets: {
    type: Array,
    default: []
  }
})

// Export the User model
exports.User = mongoose.model('User', userSchema);
exports.Analytics = mongoose.model('Analytics', analyticsSchema);
exports.Tweets = mongoose.model('Tweets', tweetsSchema);