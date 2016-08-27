module.exports = {
	index: function (req, res) {

		return res.view('homepage', {
			searchBar: "false",
			user: req.user
		});
	}
};
