var Promise = require('bluebird');
var rp = require('request-promise');
var GetAirportInfo = require('airportsjs');
var dotenv = require('dotenv');
var ThePromise = require('promise');
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
        for (var i = 0; i < 10; i++) {
          var obj = {}

          // obj['BookingDetailsLink'] = LegsObj[bigData['Itineraries'][i]['BookingDetailsLink']]

          obj['OutboundLegInfo'] = {}
          obj['OutboundLegInfo']['Departure'] = LegsObj[bigData['Itineraries'][i]['OutboundLegId']]['Departure']
          obj['OutboundLegInfo']['Arrival'] = LegsObj[bigData['Itineraries'][i]['OutboundLegId']]['Arrival']
          obj['OutboundLegInfo']['Duration'] = LegsObj[bigData['Itineraries'][i]['OutboundLegId']]['Duration']
          // obj['OutboundLegInfo']['FlightsInfo'] = LegsObj[bigData['Itineraries'][i]['OutboundLegId']]['FlightNumbers']

          obj['OutboundLegInfo']['FlightsInfo'] = []

          LegsObj[bigData['Itineraries'][i]['OutboundLegId']]['FlightNumbers'].forEach(function(elementFlight) {

            var airlineSkyObj = {}
            airlineSkyObj['FlightNumber'] = elementFlight['FlightNumber']
            // sails.log( CarriersObj[elementFlight['CarrierId'].toString()])
            airlineSkyObj['AirlineName'] = CarriersObj[elementFlight['CarrierId'].toString()]['Name']
            airlineSkyObj['AirlineCode'] = CarriersObj[elementFlight['CarrierId'].toString()]['Code']
            // console.log(CarriersObj[elementFlight['CarrierId'].toString()]['ImageUrl']);
            airlineSkyObj['AirlineLogo'] = CarriersObj[elementFlight['CarrierId'].toString()]['ImageUrl']
            obj['OutboundLegInfo']['FlightsInfo'].push(airlineSkyObj)
          })


          if (obj['OutboundLegInfo']['FlightsInfo'].length > 1){
            obj['OutboundLegInfo']['Stops'] = (obj['OutboundLegInfo']['FlightsInfo'].length - 1).toString() + " Stop(s)"
          } else {
            obj['OutboundLegInfo']['Stops'] = "Direct"
          }


          obj['InboundLegInfo'] = {}
          obj['InboundLegInfo']['Departure'] = LegsObj[bigData['Itineraries'][i]['InboundLegId']]['Departure']
          obj['InboundLegInfo']['Arrival'] = LegsObj[bigData['Itineraries'][i]['InboundLegId']]['Arrival']
          obj['InboundLegInfo']['Duration'] = LegsObj[bigData['Itineraries'][i]['InboundLegId']]['Duration']


          obj['InboundLegInfo']['FlightsInfo'] = []

          LegsObj[bigData['Itineraries'][i]['InboundLegId']]['FlightNumbers'].forEach(function(elementFlight) {

            var airlineSkyObj = {}
            airlineSkyObj['FlightNumber'] = elementFlight['FlightNumber']
            airlineSkyObj['AirlineName'] = CarriersObj[elementFlight['CarrierId'].toString()]['Name']
            airlineSkyObj['AirlineCode'] = CarriersObj[elementFlight['CarrierId'].toString()]['Code']
            obj['InboundLegInfo']['FlightsInfo'].push(airlineSkyObj)
          })

          if (obj['InboundLegInfo']['FlightsInfo'].length > 1){
           obj['InboundLegInfo']['Stops'] = (obj['InboundLegInfo']['FlightsInfo'].length - 1).toString() + " Stop(s)"
          } else {
             obj['InboundLegInfo']['Stops'] = "Direct"
          }


          obj['Price'] = {}
          obj['Price']['CurrencyCode'] = 'USD'
          obj['Price']['DecimalPlaces'] = 2
          obj['Price']['Amount'] = bigData['Itineraries'][i]['PricingOptions'][0]['Price'].toFixed(2)
          obj['Price']['superLink'] = bigData['Itineraries'][i]['PricingOptions'][0]['DeeplinkUrl']


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
                obj['OutboundLegInfo'] = {}
                obj['OutboundLegInfo']['Departure'] =  element['AirItinerary']['OriginDestinationOptions']['OriginDestinationOption'][0]['FlightSegment'][0]['DepartureDateTime']
                obj['OutboundLegInfo']['Arrival'] =  element['AirItinerary']['OriginDestinationOptions']['OriginDestinationOption'][0]['FlightSegment'][ element['AirItinerary']['OriginDestinationOptions']['OriginDestinationOption'][0]['FlightSegment'].length - 1]['ArrivalDateTime']

                obj['OutboundLegInfo']['FlightsInfo'] = []

                element['AirItinerary']['OriginDestinationOptions']['OriginDestinationOption'][0]['FlightSegment'].forEach (function(ele) {
                  var airlineObj = {}
                  airlineObj['FlightNumber'] = ele['FlightNumber']
                  airlineObj['AirlineName'] = ele['OperatingAirline']['CompanyShortName']
                  airlineObj['AirlineCode'] = ele['OperatingAirline']['Code']
                  airlineObj['Duration'] = ele['OperatingAirline']['ElapsedTime']

                  obj['OutboundLegInfo']['FlightsInfo'].push(airlineObj)
                })


                if (element['AirItinerary']['OriginDestinationOptions']['OriginDestinationOption'][0]['FlightSegment'].length > 1){
                 obj['OutboundLegInfo']['Stops'] = (element['AirItinerary']['OriginDestinationOptions']['OriginDestinationOption'][0]['FlightSegment'].length - 1).toString() + " Stop(s)"
                } else {
                   obj['OutboundLegInfo']['Stops'] = "Direct"
                }

                obj['InboundLegInfo'] = {}
                obj['InboundLegInfo']['Departure'] =  element['AirItinerary']['OriginDestinationOptions']['OriginDestinationOption'][1]['FlightSegment'][0]['DepartureDateTime']
                obj['InboundLegInfo']['Arrival'] =  element['AirItinerary']['OriginDestinationOptions']['OriginDestinationOption'][1]['FlightSegment'][ element['AirItinerary']['OriginDestinationOptions']['OriginDestinationOption'][1]['FlightSegment'].length - 1]['ArrivalDateTime']
                obj['InboundLegInfo']['Duration'] = element['AirItinerary']['OriginDestinationOptions']['OriginDestinationOption'][1]['FlightSegment'][0]['ElapsedTime']

                obj['InboundLegInfo']['FlightsInfo'] = []
                element['AirItinerary']['OriginDestinationOptions']['OriginDestinationOption'][1]['FlightSegment'].forEach (function(eleIn) {
                  var airlineInObj = {}
                  airlineInObj['FlightNumber'] = eleIn['FlightNumber']
                  airlineInObj['AirlineName'] = eleIn['OperatingAirline']['CompanyShortName']
                  airlineInObj['AirlineCode'] = eleIn['OperatingAirline']['Code']
                  airlineInObj['Duration'] = eleIn['OperatingAirline']['ElapsedTime']

                  obj['InboundLegInfo']['FlightsInfo'].push(airlineInObj)
                })

                if (element['AirItinerary']['OriginDestinationOptions']['OriginDestinationOption'][1]['FlightSegment'].length > 1){
                 obj['InboundLegInfo']['Stops'] = (element['AirItinerary']['OriginDestinationOptions']['OriginDestinationOption'][1]['FlightSegment'].length - 1).toString() + " Stop(s)"
                } else {
                   obj['InboundLegInfo']['Stops'] = "Direct"
                }
                obj['Price'] = element['AirItineraryPricingInfo']['ItinTotalFare']['TotalFare']
                theArray.push(obj)
              })


              resolve(theArray)
            }
        });
      });

      return myPromise

    } else if (originLoca['country'] != 'United States') {
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
