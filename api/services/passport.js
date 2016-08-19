var passport = require('passport'),
  GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
  LocalStrategy = require('passport-local').Strategy,
  bcrypt = require('bcrypt');

var localconfig = require('../../config/local.js');

// helper functions
function findById(id, fn) {
  User.findOne(id).exec( function(err, user){
    if (err){
      return fn(null, null);
    }else{
      return fn(null, user);
    }
  });
}

function findByUsername(u, fn) {
  User.findOne({
    username: u
  }).exec(function(err, user) {
    // Error handling
    if (err) {
      return fn(null, null);
    // The User was found successfully!
    }else{
      return fn(null, user);
    }
  });
}

var verifyHandler = function (token, tokenSecret, profile, done) {

    process.nextTick(function () {
        User.find({uid:profile.id}, function (err, user) {
          console.log('find user:'+ user.length);
            if (user.length) {
                console.log('found', profile);
                return done(null, user);
            } else {
                     console.log("user.create()");

                User.create({
                    provider: profile.provider,
                    uid: profile.id,
                    displayName: profile.displayName,
                    name: profile.givenName,
                    lastname: profile.familyName,
                    username: profile.emails[0].value,
                    image: profile.image,
                    password:'aaa'

                }).exec(function (err, user) {
                        if (err) {
                            console.log("err");
                            throw err;
                        }
                        return done(null, user);
                    });
            }
        })
    })
};

// Passport session setup.
// To support persistent login sessions, Passport needs to be able to
// serialize users into and deserialize users out of the session. Typically,
// this will be as simple as storing the user ID when serializing, and finding
// the user by ID when deserializing.
passport.serializeUser(function(user, done) {
  console.log("serialize user: "); console.log(user);
  done(null, user);
});

passport.deserializeUser(function(id, done) {
  findById(id, function (err, user) {
    done(err, user);
  });
});


 passport.use(new GoogleStrategy({
    // passReqToCallBack: true
                    clientID: sails.config.auth.google.clientID,
                    clientSecret: sails.config.auth.google.clientSecret,
                    callbackURL: sails.config.auth.google.callbackURL
                },

                verifyHandler
            ));
// Use the LocalStrategy within Passport.
// Strategies in passport require a `verify` function, which accept
// credentials (in this case, a username and password), and invoke a callback
// with a user object.
passport.use(new LocalStrategy(
  function(username, password, done) {
    // asynchronous verification, for effect...
    process.nextTick(function () {

      // Find the user by username. If there is no user with the given
      // username, or the password is not correct, set the user to `false` to
      // indicate failure and set a flash message. Otherwise, return the
      // authenticated `user`.
      findByUsername(username, function(err, user) {
        if (err) { return done(null, err); }
        if (!user) { return done(null, false, { message: 'Unknown user ' + username }); }
        bcrypt.compare(password, user.password, function(err, res) {
        if (!res) return done(null, false, { message: 'Invalid Password'});
        var returnUser = { username: user.username, createdAt: user.createdAt, id: user.id };
        return done(null, returnUser, { message: 'Logged In Successfully'} );
    });
      })
    });
  }
));
