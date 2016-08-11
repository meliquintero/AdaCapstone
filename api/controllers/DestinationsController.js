var skyscanner = require('../../SkyscannerWrapper')

module.exports = {

	index: function (req, res) {
    var one = req.body.origin_one
    var two = req.body.origin_two
    var dep = req.body.departure_date
    var ret = req.body.return_date

		skyscanner.getcommuns(one, two, dep, ret).then(function(destinationsresult){
				return res.view('index', {
					searchresults: destinationsresult
				});
		  })
		  .catch(function (err) {
				return res.view('404')
		  })

    //
    // sails.log.debug("DEBUG", req.body);
    //   return res.view('index', {
		// 			searchresults: req.body.origin_two
    //   })
	}
};
