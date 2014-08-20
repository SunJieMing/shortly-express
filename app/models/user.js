var db = require('../config');
var bcrypt = require('bcrypt-nodejs');
var Promise = require('bluebird');

var User = db.Model.extend({
  tableName: 'users',
  // hasTimestamps: true,
  // defaults:{
  //   username: null,
  //   password: null,
  //   salt: null
  // },
  initialize: function(){
    this.on('creating', function(model, attrs, options){
      var password = model.get('password');
      var salt = model.get('salt');
      var passwordAndSalt = password + salt;
      var hash = bcrypt.hash(passwordAndSalt, null, null, function(err, hash){
        if(err){
          console.log('Hashing Error', err);
        }
        model.set('password', hash);
      })

    })
  }
});

module.exports = User;


// var User = db.Model.extend({
//   tableName: 'users',
//   hasTimestamps: true,
//   initialize: function(){
//     this.on('creating', this.hashPassword);
//   },
//   comparePassword: function(attemptedPassword, callback){
//     bcrypt.compare(attemptedPassword, this.get('password'), function(err, isMatch){
//       callback(isMatch);
//     });
//   },
//   hashPassword: function(){
//     var cipher = Promise.promisify(bcrypt.hash);
//     return cipher(this.get('password'), null, null)
//     .bind(this)
//     .then(function(hash){
//       this.set('password', hash);
//     });
//   }
// });