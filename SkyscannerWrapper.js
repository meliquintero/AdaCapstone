var Promise = require('bluebird')
var rp = require('request-promise')
var dotenv = require('dotenv');
dotenv.load();

const MARKET = "US"
const CURRENCY = "USD"
const LOCALE = "en-US"
const DESTINATION = "anywhere"



module.exports = {


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

  getcommuns: function(origin1, origin2, departure_date, return_time) {
    return Promise.join(
      this.getOriginData(origin1, departure_date, return_time),
      this.getOriginData(origin2, departure_date, return_time),
      function(origin1Data, origin2Data) {
        array = [origin1Data, origin2Data]
        return array

      }
    )
  }
}
