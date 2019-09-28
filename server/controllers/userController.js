var crypto = require('crypto');
var passwoid = require('passwoid');
var service = require('./service');
var user = require('../model/users');

module.exports = {
  comparePassword: function (req, res, next) {
    var pass = crypto.createHash('sha1').update(req.body.pass).digest('base64');
    user.getUser(req.headers.user_id, function (err, _user) {
      if (_user.password == pass) {
        res.status(200).json({
          error: 0,
          message: "Las contraseñas coinciden"
        })
      } else {
        res.status(400).send({
          error: 1,
          mensaje: "Email o contrasena incorrecta"
        });
      }
    })

  },
  login: function (req, res, next) {
    var pass = crypto.createHash('sha1').update(req.body.password).digest('base64');
    user.getUser(req.body.email, function (err, _user) {
      if (err) return res.status(500).send({
        error: 3,
        mensaje: "Server Error"
      });
      if (_user != null) {
        if (_user.b_borrado) return res.status(400).send({
          error: 2,
          mensaje: "Cuenta Borrada"
        });
        else {
          if (_user.password == pass) {
            _user.stats.ultimo_acceso = Date.now();
            return res.status(200).send({
              error: 0,
              token: service.createToken(_user),
              user: req.body.email,
              admin: _user.admin
            });
          } else {

            user.add(_user, function (err) {
              if (err) return res.status(500).send({
                error: 3,
                mensaje: "Server Error"
              });
              return res.status(400).send({
                error: 1,
                mensaje: "Email o contrasena incorrecta"
              });
            })
          }
        }
      } else return res.status(400).send({
        error: 1,
        mensaje: "Email o contrasena incorrecta"
      });
    });
  },

  //TODO: hay que genrar el pass automaticamente, no se coge del form
  register: function (req, res, next) {
    var _user = {
      email: req.body.email,
      password: crypto.createHash('sha1').update(req.body.password).digest('base64'),
      name: req.body.name
    };
    user.getUser(_user.email, function (err, data) {
      if (err) return res.status(500).send({
        error: 3,
        mensaje: 'Server Error'
      });
      if (data != null) return res.status(400).send({
        error: 1,
        mensaje: 'Usuario ya existente'
      });
      else {
        user.add(_user, function (err) {
          _user.password = req.body.password;
          if (err) return res.status(500).send({
            error: 3,
            mensaje: 'Server Error'
          });
          else return res.status(200).send({
            error: 0,
            token: service.createToken(_user),
            user: req.body.email,
            admin: _user.admin
          });
        });
      }
    });
  },

  getUser: function (req, res, next) {
    user.getUser(req.params.id, function (err, data) {
      if (err) return res.status(500).send({
        error: 3,
        mensaje: 'Server Error'
      });
      if (data != null) {
        data.password = null;
        return res.status(200).send({
          error: 0,
          user: data
        });
      } else return res.status(400).send({
        error: 1,
        mensaje: 'Usuario no existente'
      });
    });
  },

  getUsers: function (req, res, next) {
    user.getUsers(function (err, data) {
      if (err) return res.status(500).send({
        error: 3,
        mensaje: 'Server Error'
      });
      if (data != null) {
        return res.status(200).send({
          error: 0,
          users: data
        });
      } else return res.status(400).send({
        error: 1,
        mensaje: 'No Hay usuarios en la bbdd'
      });
    });
  },

  updateUser: function (req, res, next) {
    console.log(req.headers.user_id);
    var id = '';
    if (req.headers.user_id == 'admin') {
      id = req.body.user.email;
    } else {
      id = req.headers.user_id;
    }
    user.getUser(id, function (err, data) {
      if (err) return res.status(500).send({
        error: 3,
        mensaje: 'Server Error'
      });
      if (data != null) {
        if (req.body.newEmail != null) {
          user.getUser(req.body.newEmail, function (err, data2) {
            if (err) return res.status(500).send({
              error: 3,
              mensaje: 'Server Error'
            });
            if (data2 == null) {
              data.email = req.body.newEmail;
            } else return res.status(400).send({
              error: 1,
              mensaje: 'Nuevo Email ya existente'
            });
          });
        }
        if (req.body.passNueva != null) {
          data.password = crypto.createHash('sha1').update(req.body.passNueva).digest('base64');
        }
        if (req.body.nombre != null) data.nombre = req.body.nombre;
        if (req.body.apellidos != null) data.apellidos = req.body.apellidos;
        user.add(data, function (err) {
          if (err) return res.status(500).send({
            error: 3,
            mensaje: 'Server Error'
          });
          data.password = null;
          return res.status(200).send({
            error: 0,
            user: data
          });
        });
        console.log(data);
      } else return res.status(400).send({
        error: 1,
        mensaje: 'Usuario no existente'
      });
    });
  },

  deleteUser: function (req, res, next) {
    user.getUser(req.body.email, function (err, data) {
      if (err) return res.status(500).send({
        error: 3,
        mensaje: "Server Error"
      });
      if (data != null) {
        user.removeUser(req.body.email, function (err) {
          if (err) return res.status(500).send({
            error: 3,
            mensaje: "Server Error"
          });
          else return res.status(200).send({
            error: 0,
            mensaje: "Cuenta Borrada"
          });
        });
      } else return res.status(400).send({
        error: 1,
        mensaje: "Usuario no existente"
      });
    });
  }
};