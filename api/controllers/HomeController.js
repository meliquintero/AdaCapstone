var topDestinationsRequests = require('../../topDestinationsWrapper')

module.exports = {
	index: function (req, res) {


			topDestinationsRequests.topDestinations().then(function(destinationsresult){
					return res.view('homepage', {
						searchresults: destinationsresult,
						searchBar: "false",
						user: req.user
					});
				})
				.catch(function (err) {
					return res.view('404')
			})

	},

	about: function (req, res) {
					return res.view('about', {
						user: req.user
					});
	}
};
