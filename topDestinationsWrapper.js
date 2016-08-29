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
  getGooglePhotoReference: function(placeId) {
    var options = {
      uri: 'https://maps.googleapis.com/maps/api/place/details/json?placeid=' + placeId + '&key=' + process.env.GOOGLE_KEY,

        headers: {
          'User-Agent': 'Request-Promise'
        },
        json: true,
        transform2xxOnly: false,
        transform: function (response) {
        return response['result']['photos']
        }
    }

    return rp(options)
  },

  getGoogleId: function(city, country) {
    var that = this
    var options = {
      uri: 'https://maps.googleapis.com/maps/api/geocode/json?address=' + city + ',+' + country + '&key=' + process.env.GOOGLE_KEY,
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true,
      transform2xxOnly: false,
      transform: function (response) {
        return that.getGooglePhotoReference(response['results'][0]['place_id']).then(function(dataForReal){
          return dataForReal
        })
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

          var tenResult = []

          for (var i = 0; i < 10; i++) {
            //add continue if city is the same
            if (i === 0 ){
              var prev = 4
            } else {
              var prev = i - 1
            }

            if (placesSuperObj[response.Quotes[i]['OutboundLeg']['DestinationId'].toString()]['CityName'] === placesSuperObj[response.Quotes[prev]['OutboundLeg']['DestinationId'].toString()]['CityName']) {
              continue;
            }

            quoteObj = {}
            quoteObj['DestinationInfo'] = placesSuperObj[response.Quotes[i]['OutboundLeg']['DestinationId'].toString()]
            quoteObj['skyscannerQuote'] = response.Quotes[i]
            tenResult.push(quoteObj)
          }

          var promises = tenResult.map(function(element) {
              return self.getGoogleId(element['DestinationInfo']["CityName"], element['DestinationInfo']["CountryName"])
              .then(function (googlePlaceInfo) {
                return {
                  skyscannerInfo: element,
                  googlePhotoReference: googlePlaceInfo
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
