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
    console.log("gets to getGoogleId", city, country);
    var aca = this
    var options = {
      uri: 'https://maps.googleapis.com/maps/api/geocode/json?address=' + city + ',+' + country + '&key=' + process.env.GOOGLE_KEY,

        headers: {
          'User-Agent': 'Request-Promise'
        },
        json: true,
        transform2xxOnly: false,
        transform: function (response) {
          console.log("response getGoogleId", response);
          return response
        }
    }

    return rp(options)
  },

  getAllGooglePlaceIds: function(mainObject) {
    console.log('GETS TO getAllGooglePlaceIds', mainObject);
    var that = this
    var thisPromises = mainObject["destinations"].map(function(element) {
      console.log("element", element);
        return that.getGoogleId(element['DestinationInfo']["CityName"],element['DestinationInfo']["CountryName"])
        .then(function (googleInfo) {
          console.log('googleInfo', googleInfo);
          element["googleId"] = googleInfo['results'][0]['place_id']
          return element
        })
    })

    return Promise.all(thisPromises).then(function(Destinations) {
      mainObject['destinations'] = Destinations
      return mainObject
    })

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
            console.log('element in side promises map', element);
              return self.getGoogleId(element['DestinationInfo']["CityName"], element['DestinationInfo']["CountryName"])
              .then(function (googlePlaceInfo) {
                console.log("promise with googleinfoo", element);
                return {
                  skyscannerInfo: element,
                  googleId: googlePlaceInfo//['results'][0]['place_id'
                }
              })
          })

          return Promise.all(promises).then(function(Destinations) {
            console.log("hits Promise.all(promises)");
            var finalObj =  {
              origin: placesSuperObj[response.Quotes[0]['OutboundLeg']['OriginId'].toString()],
              dataProvider: 'skyscanner',
              destinations: Destinations
            }
            console.log("finalObj mada",finalObj);
          return finalObj
        })
      }
    }

    return rp(options)
  }

}
