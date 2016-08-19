module.exports.policies = {

  '*': true,
    UserController: {
  	 	'*': 'authenticated',
  	 	'create': true
  	},
  	AuthController: {
  		'post login': true,
  		'get logout': 'authenticated'
  	}

};
