module.exports = function (req, res, ok) {

  // User is allowed, proceed to controller
  if (req.isAuthenticated()) {
    return ok();
  }
  else {  // User is not allowed
    return res.send("You're not permitted to perform this action.", 403);
  }
};
