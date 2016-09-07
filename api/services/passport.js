var passport = require('passport'),
  GoogleStrategy = require('passport-google-oauth').OAuth2Strategy

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


var verifyHandler = function (token, tokenSecret, profile, done) {

    process.nextTick(function () {
        User.find({uid:profile.id}, function (err, user) {
          console.log('find user:'+ user.length);
            if (user.length) {
                console.log('found', profile);
                return done(null, user);
            } else {
                     console.log("user.create()", profile);

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
                        console.log("execUser",user);
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
                    callbackURL: '/auth/google/callback'
                },

                verifyHandler
            ));
