var destinationRequests = require('../../ApisWrapper')
var flightRequests = require('../../FlightsWrapper')

module.exports = {

	index: function (req, res) {
    var Origin1 = req.body.origin_one
    var Origin2 = req.body.origin_two
    var DepDate = req.body.departure_date
    var RetDate = req.body.return_date

		destinationRequests.matchedDestinations(Origin1, Origin2, DepDate, RetDate).then(function(destinationsresult){
				return res.view('index', {
					searchresults: destinationsresult,
					depdate: DepDate,
					retdate: RetDate,
					user: req.user
				});
		  })
		  .catch(function (err) {
				return res.view('404')
		})

	},

	show: function (req, res) {
		var originOne = req.params.originOne
		var originTwo = req.params.originTwo
		var destination = req.params.destination
		var DepDate = req.params.DepDate
		var RetDate = req.params.RetDate


		flightRequests.theFlights(originOne, originTwo, destination, DepDate, RetDate).then(function(flightsResult){
			return res.view('show', {
					searchresults: flightsResult,
					originOne: originOne,
					originTwo: originTwo,
					destination: destination,
					user: req.user
				});
		  })
		  .catch(function (err) {
				return res.view('404')
		})

	}
};
