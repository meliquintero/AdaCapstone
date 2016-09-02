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

  getTheHotel: function(coordinates, departure_date, return_time) {
    if (coordinates === undefined) {
      coordinates = "18.040953,-63.1089"
    }
    var options = {
      // method: 'POST',

      uri: 'http://partners.api.skyscanner.net/apiservices/hotels/liveprices/v2/'+ MARKET + '/' + CURRENCY + '/' + LOCALE + '/' + coordinates + '-latlong/' + departure_date + '/' + return_time + '/2/1?apiKey=' + process.env.SKYSCANNER_KEY,
      // http://partners.api.skyscanner.net/apiservices/hotels/liveprices/v2/{market}/{currency}/{locale}/{entityid}/{checkindate}/{checkoutdate}/{guests}/{rooms}?apiKey={apiKey}[&pageSize={pageSize}][&imageLimit={imageLimit}]
      // apiKey: process.env.SKYSCANNER_KEY,

      resolveWithFullResponse: true,
      headers: {
        // 'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Request-Promise',
        'Accept': 'application/json'
      },
      // body: {
        // 'apiKey': process.env.SKYSCANNER_KEY,
        // 'locale': LOCALE,
        // 'country': "US",
        // 'currency': CURRENCY,
        // entityId: coordinates + '-latlong',
        // checkindate: departure_date,
        // checkoutdate: return_time,
        // guests: 2,
        // rooms: 1,
      // },

      // transform2xxOnly: true,
      json: true,
      transform: function (body, response, total) {
        console.log("colombiano34body", body);
        console.log("colombiano34response", response.headers);
      return response
      }
    }

    return rp(options).promise()
  },

  getHotels: function(superObject, departure_date, return_time) {
    console.log("insideerr");

    var aqui = this

    return superObject.then(function(mainObjectForReal){
      var hotelPromises = mainObjectForReal.destinations.map(function(element) {
          return aqui.getTheHotel(element["coordinates"], departure_date, return_time)
          .then(function (hotelsResponse) {
              element["hotels"] = hotelsResponse
            return element
          })
      })

      return Promise.all(hotelPromises).then(function(arrayDestinations) {
        console.log("Hotel requests are done");
        mainObjectForReal['destinations'] = arrayDestinations
        return mainObjectForReal
      })

    })

  },

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

  getAllGooglePhotoReferences: function(mainObject) {
    var aqui = this

    return mainObject.then(function(mainObjectForReal){
      var thesePromises = mainObjectForReal.destinations.map(function(element) {
          return aqui.getGooglePhotoReference(element["googleId"])
          .then(function (googleDetails) {
              element["googlePhotoReference"] = googleDetails
            return element
          })
      })

      return Promise.all(thesePromises).then(function(arrayDestinations) {
        mainObjectForReal['destinations'] = arrayDestinations
        return mainObjectForReal
      })

    })

  },

  getGoogleId: function(city, country) {
    var options = {
      uri: 'https://maps.googleapis.com/maps/api/geocode/json?address=' + city + ',+' + country + '&key=' + process.env.GOOGLE_KEY,

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

  getAllGooglePlaceIds: function(mainObject) {
    var that = this
    var thisPromises = mainObject["destinations"].map(function(element) {
        return that.getGoogleId(element["city"],element["country"])
        .then(function (googleInfo) {
          element["googleId"] = googleInfo['results'][0]['place_id']
          return element
        })
    })

    return Promise.all(thisPromises).then(function(Destinations) {
      mainObject['destinations'] = Destinations
      return mainObject
    })

  },

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
        var thisLocale  = GetAirportInfo.lookupByIataCode(originInfoOne.destinations[i]['airportCode'])
        obj['coordinates'] = thisLocale['latitude'] + "," + thisLocale['longitude']
        obj['city']= originInfoTwo.destinations[i]['city']
      }
      if (originInfoTwo.destinations[i]['country'] === originInfoOne.destinations[i]['country']) {
        obj['country'] = originInfoTwo.destinations[i]['country']
      } else {
        obj['country'] = originInfoOne.destinations[i]['country']
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

        var TheOne = self.fussionExtreme(origin1Data, origin2Data)
        var TheOneOne = self.getAllGooglePlaceIds(TheOne)
        var TheOneOneOne = self.getAllGooglePhotoReferences(TheOneOne)
        // console.log('get to the TheOneWithHotels');
        // TheOneWithHotels = self.getHotels(TheOneOneOne, departure_date, return_time)
        return TheOneOneOne

      }
    )
  }
}
