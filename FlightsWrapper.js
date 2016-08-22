var Promise = require('bluebird');
var rp = require('request-promise');
var GetAirportInfo = require('airportsjs');
var dotenv = require('dotenv');
var ThePromise = require('promise');
// var skyscanner = require("skyscannerjs");

var SabreDevStudioFlight = require('sabre-dev-studio/lib/sabre-dev-studio-flight');
require('promise/lib/rejection-tracking').enable(
  {allRejections: true}
);

dotenv.load();

const MARKET = "US"
const CURRENCY = "USD"
const LOCALE = "en-US"

module.exports = {

  getTheActualFlights: function(sessionKey) {
    console.log("gets to getTheActualFlights", sessionKey);
    var options = {
      apiKey: process.env.SKYSCANNER_KEY,
      uri: sessionKey + '?apiKey=' + process.env.SKYSCANNER_KEY, //+ 'pageindex=0&pagesize=20',
      headers: {
          'User-Agent': 'Request-Promise'
      },
      json: true,
      transform: function (bigData) {
        var AgentsObj = {}
        for (var i = 0; i < bigData['Agents'].length; i++) {
          AgentsObj[bigData['Agents'][i]['Id'].toString()] = bigData['Agents'][i]
        }

        var LegsObj = {}
        for (var i = 0; i < bigData['Legs'].length; i++) {
          LegsObj[bigData['Legs'][i]['Id'].toString()] = bigData['Legs'][i]
        }

        var CarriersObj = {}
        for (var i = 0; i < bigData['Carriers'].length; i++) {
          CarriersObj[bigData['Carriers'][i]['Id'].toString()] = bigData['Carriers'][i]
        }

        var theArray = []
        for (var i = 0; i < 50; i++) {
          var obj = {}
          obj['OutboundLegInfo'] = {}
          obj['OutboundLegInfo']['Departure'] = LegsObj[bigData['Itineraries'][i]['OutboundLegId']]['Departure']
          obj['OutboundLegInfo']['Arrival'] = LegsObj[bigData['Itineraries'][i]['OutboundLegId']]['Arrival']
          obj['OutboundLegInfo']['Duration'] = LegsObj[bigData['Itineraries'][i]['OutboundLegId']]['Duration']
          obj['OutboundLegInfo']['FlightNumbers'] = LegsObj[bigData['Itineraries'][i]['OutboundLegId']]['FlightNumbers']

          obj['InboundLegInfo'] = {}
          obj['InboundLegInfo']['Departure'] = LegsObj[bigData['Itineraries'][i]['InboundLegId']]['Departure']
          obj['InboundLegInfo']['Arrival'] = LegsObj[bigData['Itineraries'][i]['InboundLegId']]['Arrival']
          obj['InboundLegInfo']['Duration'] = LegsObj[bigData['Itineraries'][i]['InboundLegId']]['Duration']
          obj['InboundLegInfo']['FlightNumbers'] = LegsObj[bigData['Itineraries'][i]['InboundLegId']]['FlightNumbers']

          obj['Price'] = bigData['Itineraries'][i]['PricingOptions'][0]['Price']

          obj['OutboundLegInfo']['FlightNumbers'].forEach (function(element) {
            element['CarrierInfo'] = CarriersObj[element['CarrierId'].toString()]
          })



          // bigData['Itineraries'][i]['InboundLegInfo']['CarriersInfo'] = []
          // bigData['Itineraries'][i]['OutboundLegInfo']['CarriersInfo'] = []
          //
          // bigData['Itineraries'][i]['PricingOptions'].forEach (function(element) {
          //   element['Agents'][1] = AgentsObj[element['Agents'][0].toString()]
          // })
          //
          // bigData['Itineraries'][i]['OutboundLegInfo']['Carriers'].forEach (function(element) {
          //   bigData['Itineraries'][i]['OutboundLegInfo']['CarriersInfo'].push(CarriersObj[element])
          // })
          //
          // bigData['Itineraries'][i]['InboundLegInfo']['Carriers'].forEach (function(element) {
          //   bigData['Itineraries'][i]['InboundLegInfo']['CarriersInfo'].push(CarriersObj[element])
          // })

          theArray.push(obj)
        }

        return theArray

      }
    }

    return rp(options).promise()

  },

  getFlightData: function(origin, destination, DepDate, RetDate) {
    var self =  this
    var originLoca = GetAirportInfo.lookupByIataCode(origin.toUpperCase())
    console.log(originLoca);

      if (originLoca['country'] === 'United States') {

      var sabre_dev_studio_flight = new SabreDevStudioFlight({
        client_id:     process.env.SABRE_ID,
        client_secret: process.env.SABRE_SECRET,
        uri:           'https://api.test.sabre.com'
      });

      var sabreOptions = {
        origin: origin,
        destination: destination,
        departuredate: DepDate,
        returndate: RetDate
            //  theme         : 'MOUNTAINS'
      };

      //A promise is being waited in the other side
      var myPromise = new ThePromise(function (resolve, reject) {
        return sabre_dev_studio_flight.instaflights_search( sabreOptions, function(error, sabreResult) {

            if (error) {
              reject(error)
            } else {
              var theArray = []
              JSON.parse(sabreResult).PricedItineraries.forEach(function(element, index, array) {
                var obj = {}
                obj['OutboundLegInfo'] = element['AirItinerary']['OriginDestinationOptions']['OriginDestinationOption'][0]['FlightSegment']
                obj['InboundLegInfo'] = element['AirItinerary']['OriginDestinationOptions']['OriginDestinationOption'][1]['FlightSegment']

                obj['Price'] = element['AirItineraryPricingInfo']['ItinTotalFare']['TotalFare']
                theArray.push(obj)
              })


              resolve(theArray)
            }
        });
      });

      return myPromise

    } else if (originLoca['country'] != 'United States') {
      console.log("Hits (originLoca['country'] != 'United States')");
      // /session live key
      var skyscannerOptions = {
        method: 'POST',
        uri: 'http://partners.api.skyscanner.net/apiservices/pricing/v1.0',
        resolveWithFullResponse: true,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Accept': 'application/json'
        },
        form: {
          'apiKey': process.env.SKYSCANNER_KEY,
          'locale': LOCALE,
          'country': "US",
          'currency': CURRENCY,
          'locationschema': 'iata',
          'originplace': origin,
          'destinationplace': destination,
          'outbounddate': DepDate,
          'inbounddate': RetDate,
          'adults': 1
        },
        transform: function (body, response, resolveWithFullResponse) {
          return self.getTheActualFlights(response.headers.location).then(function (skyscannerInfo) {
            return skyscannerInfo
          })
        }

      }
      return rp(skyscannerOptions).promise()
    }

  },

  theFlights: function(originOne, originTwo, destination, DepDate, RetDate) {
      // var self = this
    return Promise.join(
      this.getFlightData(originOne, destination, DepDate, RetDate),
      this.getFlightData(originTwo, destination, DepDate, RetDate),
      function(origin1Data, origin2Data) {
        console.log("gets to the join promise");
        return [origin1Data, origin2Data]
      })

  }
};
