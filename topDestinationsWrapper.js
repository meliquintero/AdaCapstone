var Promise = require('bluebird')
var rp = require('request-promise')
var GetAirportInfo = require('airportsjs')
var dotenv = require('dotenv');
var ThePromise = require('promise');

dotenv.load();

const MARKET = "US"
const CURRENCY = "USD"
const LOCALE = "en-US"
const DESTINATION = "anywhere"

module.exports = {

  topDestinations: function() {
    var options = {
      uri: 'http://partners.api.skyscanner.net/apiservices/browseroutes/v1.0/' + MARKET + '/'  + CURRENCY + '/' + LOCALE + '/SEA/' + DESTINATION + '/anytime/anytime?apiKey=' + process.env.SKYSCANNER_KEY,

        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Request-Promise'
        },
        json: true,
        transform2xxOnly: false,
        transform: function (response) {
          placesSuperObj = {}
            for (var i = 0; i < response.Places.length; i++) {
              console.log("placeID", response.Places[i]['PlaceId'].toString());
              placesSuperObj[response.Places[i]['PlaceId'].toString()] = response.Places[i]

          }
          console.log(placesSuperObj);
          response.Quotes.forEach(function(element, index, array) {
              element["DestinationInfo"] = placesSuperObj[element['OutboundLeg']['DestinationId'].toString()]
          })

        return response
        }
    }

    return rp(options)
  }

}
