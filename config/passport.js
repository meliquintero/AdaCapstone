var passport = require('passport'),
   GoogleStrategy = require('passport-google-oauth').OAuth2Strategy,
  LocalStrategy = require('passport-local').Strategy;

module.exports = {
 http: {
    customMiddleware: function(app){
      console.log('express middleware for passport ');
      app.use(passport.initialize());
      app.use(passport.session());
    }
  }
};
