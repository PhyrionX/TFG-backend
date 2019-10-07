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
    type: String,
    required: true
  },
  date_of_search: {
    type: Date,
    required: true,
    default: Date.now
  },
  type: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  screen_name: {
    type: String,
    required: true
  },
  location: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
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
    type: Number,
    required: true
  },
  profile_background_image_url: {
    type: String
  },
  profile_image_url: {
    type: String
  }
})

// Export the User model
exports.User = mongoose.model('User', userSchema);
exports.Analytics = mongoose.model('Analytics', analyticsSchema);