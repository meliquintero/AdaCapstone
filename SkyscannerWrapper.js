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
    sails.log.debug("DEBUG", origin);

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
    var self = this
    return Promise.join(

      this.getOriginData(origin1, departure_date, return_time),
      this.getOriginData(origin2, departure_date, return_time),
      function(origin1Data, origin2Data) {

        //Get all the destinations Ids
        var arrayOne = self.sky48Codes(origin1Data)
        var arrayTwo = self.sky48Codes(origin2Data)

        //find the commun destinations ids withing the two origins
        var arrayCommons = arrayOne.filter(function(n) {
          return arrayTwo.indexOf(n) != -1;
        });

        //delete from the non common destination from quotes array
        origin1Data = self.clean(arrayCommons, origin1Data)
        origin2Data = self.clean(arrayCommons, origin2Data)


      return [origin1Data, origin2Data]

      }
    )
  }
}
