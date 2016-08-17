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
  sortBySumPrice: function(originInfo) {
    originInfo.destinations.sort(function (a, b) {
      var sumPricesA = Number(a.sumPrices); // ignore upper and lowercase
      var sumPricesB = Number(b.sumPrices); // ignore upper and lowercase

      if (sumPricesA > sumPricesB) {
        return 1;
      }
      if (sumPricesA < sumPricesB) {
        return -1;
      }
      return 0;
    });
  },

  sortByCity: function(originInfo) {
    originInfo.destinations.sort(function (a, b) {
      var cityA = a.city.toUpperCase(); // ignore upper and lowercase
      var cityB = b.city.toUpperCase(); // ignore upper and lowercase

      if (cityA > cityB) {
        return 1;
      }
      if (cityA < cityB) {
        return -1;
      }
      return 0;
    });

  },

  fussionExtreme: function(originInfoOne, originInfoTwo) {
    // sort them by city, so I can loop good
    this.sortByCity(originInfoOne)
    this.sortByCity(originInfoTwo)

    theSuperObj = {}
    theSuperObj["originOne"] = {
      airportName: originInfoOne['airportName'],
      airportCode: originInfoOne['airportCode'],
      city: originInfoOne['city'],
      country: originInfoOne['country']
      }

    theSuperObj["originTwo"] = {
      airportName: originInfoTwo['airportName'],
      airportCode: originInfoTwo['airportCode'],
      city: originInfoTwo['city'],
      country: originInfoTwo['country']
    }
    theSuperObj["destinations"] = []

    for (var i = 0; i < originInfoTwo.destinations.length; i++) {
      obj = {}

      //the if Statements are to double checking that I am paring the right cities.
      if (originInfoTwo.destinations[i]['airportName'] === originInfoOne.destinations[i]['airportName']) {
        obj['airportName'] = originInfoTwo.destinations[i]['airportName']
      }

      if (originInfoTwo.destinations[i]['airportCode'] === originInfoOne.destinations[i]['airportCode']) {

        obj['airportCode'] = originInfoTwo.destinations[i]['airportCode']
      }

      if (originInfoTwo.destinations[i]['city'] ===  originInfoOne.destinations[i]['city']) {
        obj['city']= originInfoTwo.destinations[i]['city']
      }
      if (originInfoTwo.destinations[i]['country'] === originInfoOne.destinations[i]['country']) {
        obj['country'] = originInfoTwo.destinations[i]['country']
      }

      obj['priceFromOriginOne'] = originInfoOne.destinations[i]['price']
      obj['priceFromOriginTwo'] = originInfoTwo.destinations[i]['price']
      var num = originInfoTwo.destinations[i]['price'] + originInfoOne.destinations[i]['price']
      obj['sumPrices'] = num.toFixed(2)

      theSuperObj["destinations"].push(obj)
    }

    this.sortBySumPrice(theSuperObj)

    return theSuperObj
  },

  cleanAgain: function(originInfo) {
    for (var i = 0; i < originInfo.destinations.length; i++) {
      repeated = []
      for (var j = i + 1; j < originInfo.destinations.length; j++) {

        if (originInfo.destinations[i]["city"] == originInfo.destinations[j]["city"]) {
          repeated.push(originInfo.destinations[i])
          repeated.push(originInfo.destinations[j])
        }
      }

      if (repeated.length > 1) {

        if (repeated[0]['price'] > repeated[1]['price']) {
          var index = originInfo.destinations.indexOf(repeated[0]);
        } else {
          var index = originInfo.destinations.indexOf(repeated[1]);
        }

        if (index > -1) {
          originInfo.destinations.splice(index, 1);
        }
      }
    }
  },

  getCities: function(originData) {
    var arrayCodes = originData.destinations.map(function(oneDest) {
      return oneDest["city"]
    });

    return arrayCodes
  },

  clean: function(arrayCommons, originData) {
    var finalArray = []

    for (var i = 0, len = originData.destinations.length; i < len; i++) {
      if (arrayCommons.includes(originData.destinations[i]["city"])) {
        finalArray.push(originData.destinations[i])
      }
    }

    originData['destinations'] = finalArray

  },

  getSkyscannerLocation: function(originCode) {

    var options = {
      uri: 'http://partners.api.skyscanner.net/apiservices/autosuggest/v1.0/' + MARKET + '/' + CURRENCY + '/' + LOCALE + '/?id=' + originCode.toString() + '-sky48&apiKey=' + process.env.SKYSCANNER_KEY,
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true,
      transform2xxOnly: false,
      transform: function (response) {

      return response.Places[0]
      }
     }

    return rp(options)

  },

  getOriginData: function (origin, departure_date, return_time) {
    var self = this

    var originLoca = GetAirportInfo.lookupByIataCode(origin.toUpperCase())

    if (originLoca['country'] === 'United States') {
      var SabreDevStudioFlight = require('sabre-dev-studio/lib/sabre-dev-studio-flight');
      var sabre_dev_studio_flight = new SabreDevStudioFlight({
        client_id:     process.env.SABRE_ID,
        client_secret: process.env.SABRE_SECRET,
        uri:           'https://api.test.sabre.com'
      });

      var sabreOptions = {
        origin: origin,
        departuredate: departure_date,
        returndate: return_time
        //  theme         : 'MOUNTAINS'
      };

      //A promise is being waited in the other side
      var myPromise = new ThePromise(function (resolve, reject) {
        sabre_dev_studio_flight.destination_finder( sabreOptions, function(error, data) {

          if (error) {
            reject(error)
          } else {

            var finalObj =  {
              dataProvider: 'sabre',
              airportName: originLoca['name'],
              city: originLoca['city'],
              country: originLoca['country'],
              airportCode: originLoca['iata'],
              destinations: []
            }

            JSON.parse(data).FareInfo.forEach(function(element, index, array) {
              var DestinationLocale = GetAirportInfo.lookupByIataCode(element["DestinationLocation"])

              var obj = {}
              obj["airportName"] = DestinationLocale['name'],
              obj["city"] = DestinationLocale['city'],
              obj["country"] = DestinationLocale['country'],
              obj["airportCode"] = DestinationLocale['iata'],
              obj["price"] = element["LowestFare"]
              finalObj['destinations'].push(obj)
            });

            resolve(finalObj)
          }
        });
      });

      return myPromise

    } else if (originLoca['country'] != 'United States') {

      var skyscannerOptions = {
      uri: 'http://partners.api.skyscanner.net/apiservices/browsequotes/v1.0/' + MARKET + '/' + CURRENCY + '/' + LOCALE + '/' + origin + '/' + DESTINATION + '/' + departure_date + '/' + return_time + '?apiKey=' + process.env.SKYSCANNER_KEY,
      headers: {
        'User-Agent': 'Request-Promise'
      },
      json: true,
      transform2xxOnly: false,
      transform: function (response) {

        var promises = response.Quotes.map(function(element) {
            return self.getSkyscannerLocation(element["OutboundLeg"]["DestinationId"])
            .then(function (skyscannerPlaceInfo) {
                var destLoca = GetAirportInfo.lookupByIataCode(skyscannerPlaceInfo.PlaceId.slice(0,3))
              return {
                airportName: destLoca['name'],
                city: destLoca['city'],
                country: destLoca['country'],
                airportCode: destLoca['iata'],
                price: element["MinPrice"]
              }
            })
        })

          return Promise.all(promises).then(function(Destinations) {
              var finalObj =  {
                dataProvider: 'skyscanner',
                airportName: originLoca['name'],
                city: originLoca['city'],
                country: originLoca['country'],
                airportCode: originLoca['iata'],
                destinations: Destinations
              }
              return finalObj
          })
      }
    }
    return rp(skyscannerOptions).promise()
    }
  },

  matchedDestinations: function(origin1, origin2, departure_date, return_time) {
    var self = this
    return Promise.join(

      this.getOriginData(origin1, departure_date, return_time),
      this.getOriginData(origin2, departure_date, return_time),
      function(origin1Data, origin2Data) {

        //Get all the destinations cities
        var arrayOne = self.getCities(origin1Data)
        var arrayTwo = self.getCities(origin2Data)

        // find the commun destinations cities whithing the two origins
        var arrayCommons = arrayOne.filter(function(n) {
          return arrayTwo.indexOf(n) != -1;
        });

        // select the commmon cities
        self.clean(arrayCommons, origin1Data)
        self.clean(arrayCommons, origin2Data)

        //clean the skyscanner data, call the method that selects the cheapest
        if (origin1Data.dataProvider === "skyscanner") {
            self.cleanAgain(origin1Data)
        } else if (origin2Data.dataProvider === "skyscanner") {
            self.cleanAgain(origin2Data)
        }

        TheOne = self.fussionExtreme(origin1Data, origin2Data)

      return TheOne

      }
    )
  }
}
