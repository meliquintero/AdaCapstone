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
  getGoogleId: function(city, country) {
    var aca = this
    var options = {
      uri: 'https://maps.googleapis.com/maps/api/geocode/json?address=' + city + ',+' + country + '&key=' + process.env.GOOGLE_KEY,
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true,
      transform2xxOnly: false,
      transform: function (response) {
        return response['results'][0]['place_id']
      }
    }

    return rp(options)
  },

  topDestinations: function() {
    var self = this
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
              placesSuperObj[response.Places[i]['PlaceId'].toString()] = response.Places[i]

          }
          response.Quotes.forEach(function(element, index, array) {
              element["DestinationInfo"] = placesSuperObj[element['OutboundLeg']['DestinationId'].toString()]
          })


          var promises = response.Quotes.map(function(element) {
              return self.getGoogleId(element['DestinationInfo']["CityName"], element['DestinationInfo']["CountryName"])
              .then(function (googlePlaceInfo) {
                return {
                  skyscannerInfo: element,
                  googleId: googlePlaceInfo
                }
              })
          })

          return Promise.all(promises).then(function(Destinations) {
            var finalObj =  {
              origin: placesSuperObj[response.Quotes[0]['OutboundLeg']['OriginId'].toString()],
              dataProvider: 'skyscanner',
              destinations: Destinations
            }
          return finalObj
        })
      }
    }

    return rp(options)
  }

}
