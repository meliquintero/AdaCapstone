
module.exports.routes = {

  'GET /': 'Home.index',

  'GET /auth/google': 'Auth.google',

  'GET /auth/google/callback': 'Auth.google',

  'GET /destinations/:originOne/:originTwo/:destination/:DepDate/:RetDate' : 'Destinations.show',

  'GET /destinations': 'Destinations.index'

};
