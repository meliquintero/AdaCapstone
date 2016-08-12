var apiRequests = require('../../ApisWrapper')

module.exports = {

	index: function (req, res) {

    var Origin1 = req.body.origin_one
    var Origin2 = req.body.origin_two
    var DepDate = req.body.departure_date
    var RetDate = req.body.return_date

		apiRequests.matchedDestinations(Origin1, Origin2, DepDate, RetDate).then(function(destinationsresult){
				return res.view('index', {
					searchresults: destinationsresult
				});
		  })
		  .catch(function (err) {
				return res.view('404')
		  })


    // // sails.log.debug("DEBUG", req.body);
    //   return res.view('index', {
		// 			searchresults: [Origin1, Origin2]
    //   })
	}
};
