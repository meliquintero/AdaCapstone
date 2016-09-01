
module.exports.routes = {

  'GET /': 'Home.index',

  'GET /auth/google': 'Auth.google',

  'GET /auth/google/callback': 'Auth.google',

  'GET /flights/:originOne/:originTwo/:destination/:DepDate/:RetDate' : 'Destinations.show',

  'GET /destinations': 'Destinations.index',

  'GET /about': 'Home.about'

};
