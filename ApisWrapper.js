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

  getLocaData: function(originCode) {

    var options = {
      uri: 'http://partners.api.skyscanner.net/apiservices/autosuggest/v1.0/' + MARKET + '/' + CURRENCY + '/' + LOCALE + '/?id=' + originCode.toString() + '-sky48&apiKey=' + process.env.SKYSCANNER_KEY,
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true,
      transform2xxOnly: false,
      transform: function (response) {

      return response
      }
     }

    return rp(options)

  },

  cleanAgain: function(originQuotes) {
    for (var i = 0, len = originQuotes.length; i < len; i++) {
      repeated = []
      for (var j = i + 1, len = originQuotes.length; j < len; j++) {
        if (originQuotes[i]["OutboundLeg"]["DestinationId"] == originQuotes[j]["OutboundLeg"]["DestinationId"]) {
          repeated.push(originQuotes[i]["OutboundLeg"]["DestinationId"])
          repeated.push(originQuotes[j]["OutboundLeg"]["DestinationId"])
        }
      }

      sails.log.debug("DEBUG", repeated);

      if (repeated.length > 1) {
              if (repeated[0]['MinPrice'] > repeated[1]['MinPrice']) {
                var index = array.indexOf(repeated[0]);
                if (index > -1) {
                  originQuotes.splice(index, 1);
                }
              } else {
                var index = array.indexOf(repeated[1]);
                if (index > -1) {
                  originQuotes.splice(index, 1);
                }
              }
      }
    }

    return originQuotes
  },

  sky48Codes: function(origin) {
    var arrayCodes = origin.Quotes.map(function(one) {
      return one["OutboundLeg"]["DestinationId"]
    });

    return arrayCodes
  },

  clean: function(arrayCommons, originQuotes) {
    final = []

    for (var i = 0, len = originQuotes.Quotes.length; i < len; i++) {
      if (arrayCommons.includes(originQuotes.Quotes[i]["OutboundLeg"]["DestinationId"])) {
        final.push(originQuotes.Quotes[i])
      }
    }
    return final

  },

  getOriginData: function (origin, departure_date, return_time) {
    var loca = GetAirportInfo.lookupByIataCode(origin.toUpperCase())

    if (loca['country'] === 'United States') {
    var SabreDevStudioFlight = require('sabre-dev-studio/lib/sabre-dev-studio-flight');
    var sabre_dev_studio_flight = new SabreDevStudioFlight({
      client_id:     process.env.SABRE_ID,
      client_secret: process.env.SABRE_SECRET,
      uri:           'https://api.test.sabre.com'
    });

    var options = {
       origin: origin,
       departuredate: departure_date,
       returndate: return_time
      //  theme         : 'MOUNTAINS'
     };

    var myPromise = new ThePromise(function (resolve, reject) {
      sabre_dev_studio_flight.destination_finder( options, function(error, data) {
        if (error) {
         reject(error)
        } else {
         resolve(data)
        }
      });
    });

    return myPromise

  } else if (loca['country'] != 'United States') {

      var options = {
      uri: 'http://partners.api.skyscanner.net/apiservices/browsequotes/v1.0/' + MARKET + '/' + CURRENCY + '/' + LOCALE + '/' + origin + '/' + DESTINATION + '/' + departure_date + '/' + return_time + '?apiKey=' + process.env.SKYSCANNER_KEY,
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true,
      transform2xxOnly: false,
      transform: function (response) {
        
        return response
        }
      }
    }
    return rp(options).promise()
  },

  matchedDestinations: function(origin1, origin2, departure_date, return_time) {
    var self = this
    return Promise.join(

      this.getOriginData(origin1, departure_date, return_time),
      this.getOriginData(origin2, departure_date, return_time),
      function(origin1Data, origin2Data) {

        //Get all the destinations Ids
        // var arrayOne = self.sky48Codes(origin1Data)
        // var arrayTwo = self.sky48Codes(origin2Data)
        //
        // //find the commun destinations ids withing the two origins
        // var arrayCommons = arrayOne.filter(function(n) {
        //   return arrayTwo.indexOf(n) != -1;
        // });
        //
        // //delete from the non common destination from quotes array
        // origin1Data = self.clean(arrayCommons, origin1Data)
        // origin2Data = self.clean(arrayCommons, origin2Data)

        // //watch out if there are no the same length
        // if (origin1Data.length != origin2Data.length) {
        //   sails.log.debug("DEBUG", "step 1");
        //   var origin1Data = self.cleanAgain(origin1Data)
        //   var origin2Data = self.cleanAgain(origin2Data)
        // }


        // origin1Data.forEach(function(element, index, array) {
        //   sails.log.debug("DEBUG", index)
        //   element["DestinationInfo"] = self.getLocaData(element["OutboundLeg"]["DestinationId"])
        //
        // });


      return [origin1Data, origin2Data]

      }
    )
  }
}
