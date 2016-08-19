var bcrypt = require('bcrypt');
module.exports = {
  attributes: {
    uid: {
      type: 'string',
      unique: true
    },
    provider: {
      type: 'string',
    },
    givenName: {
      type: 'string',
    },
    familyName: {
      type: 'string',
    },
    email: {
      type: 'string',
      unique: true
    },
    // password: {
    //   type: 'string',
    // },
    photo: {
      type: 'string',
    },
    toJSON: function() {
      // this gives you an object with the current values
      var obj = this.toObject();
      // Remove the password object value
      delete obj.password;
      // return the new object without password
      return obj;
    }
  },

  // create: function(profile){
  //   User.create({
  //       uid: profile.id,
  //       provider: profile.provider,
  //       email: profile.emails,
  //       photo:profile.photos,
  //       givenName: profile.name,
  //       familyName: profile.displayName,
  //   }).exec(function createCB(err, created){
  //     return created
  //   })
  //
  //   console.log( profile );
  //   sails.log.debug(profile);
  //   return profile.id
  // },

  beforeCreate: function(user, cb) {
    bcrypt.genSalt(10, function(err, salt) {
      bcrypt.hash(user.password, salt, function(err, hash) {
        if (err) {
          console.log(err);
          cb(err);
        }else{
          user.password = hash;
          cb(null, user);
        }
      });
    });
  }
};
