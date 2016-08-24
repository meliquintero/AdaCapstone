
var passport = require('passport');
module.exports = {

  login: function(req, res){
    passport.authenticate('local', function(err, user, info){
      if ((err) || (!user)) res.send(err);
      req.logIn(user, function(err){
        if (err) res.send(err);
        return res.send({ message: 'login successful' });
      });
    })(req, res);
  },

  logout: function (req,res){
    req.logout();
    res.redirect('/');
  },

  'google': function (req, res) {
    passport.authenticate('google', { failureRedirect: '/login', scope:['https://www.googleapis.com/auth/plus.login','https://www.googleapis.com/auth/userinfo.profile','https://www.googleapis.com/auth/userinfo.email'] },
      function (err, user) {
        req.logIn(user, function (err) {
          if (err) {
            console.log(err);
            res.send(err);
            return;
          }

          var redir = req.param['redir'];
          console.log("redir: "+ redir);
          res.redirect('/');
        return;
      });
    })(req, res);
  },

  'google/callback': function (req, res) {
    passport.authenticate('google',
      function (req, res) {
      res.redirect('/');
    })(req, res);
  },

  facebook: function(req, res) {
  passport.authenticate('facebook', { failureRedirect: '/login', scope: ['email'] }, function(err, user) {
    req.logIn(user, function(err) {
      if (err) {
        console.log(err);
        res.view('500');
        return;
      }

      res.redirect('/');
      return;
    });
  })(req, res);
  },

};
