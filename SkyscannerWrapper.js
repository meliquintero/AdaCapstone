var Promise = require('bluebird')
var rp = require('request-promise')
var dotenv = require('dotenv');
dotenv.load();

const MARKET = "US"
const CURRENCY = "USD"
const LOCALE = "en-US"
const DESTINATION = "anywhere"



module.exports = {

  sky48Codes: function(origin) {

    var arrayCodes = []

    return arrayCodes
  },

  getCommons: function(origin1, origin2) {

    return ['arrayCommons', "melissa"]
  },

  getOriginData: function (origin, departure_date, return_time) {
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

    return rp(options).promise()
  },

  matchedDestinations: function(origin1, origin2, departure_date, return_time) {
    return Promise.join(
      this.getOriginData(origin1, departure_date, return_time),
      this.getOriginData(origin2, departure_date, return_time),
      function(origin1Data, origin2Data) {

        //Gett all the destinations Ids
        var arrayOne = origin1Data.Quotes.map(function(one) {
          return one["OutboundLeg"]["DestinationId"]
        });

        var arrayTwo = origin2Data.Quotes.map(function(one) {
          return one["OutboundLeg"]["DestinationId"]
        });

        //find the commun destinations ids withing the two origins
        var arrayCommons = arrayOne.filter(function(n) {
          return arrayTwo.indexOf(n) != -1;
        });

        //delete from the non common destination from quotes array
        final1 = []

        sails.log.debug("DEBUG", final1);


        for (var i = 0, len = origin1Data.Quotes.length; i < len; i++) {
          if (arrayCommons.includes(origin1Data.Quotes[i]["OutboundLeg"]["DestinationId"])) {
            final1.push(origin1Data.Quotes[i])
          }
        }


       final2 = []

       for (var i = 0, len = origin2Data.Quotes.length; i < len; i++) {
         if (arrayCommons.includes(origin2Data.Quotes[i]["OutboundLeg"]["DestinationId"])) {
           final2.push(origin2Data.Quotes[i])
         }
       }

      sails.log.debug("DEBUG", final1);

      return [ final1, final2 ]

      }
    )
  }
}
