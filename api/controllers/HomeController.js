module.exports = {
	index: function (req, res) {

		return res.view('homepage', {
			searchBar: undefined,
			user: req.user
		});
	}
};
