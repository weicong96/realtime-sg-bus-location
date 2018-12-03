var expect = require("chai").expect;
var sinon = require("sinon")
var Promise = require('bluebird')
var mock = require("mock-require")
describe("Test Fetch buses functionality",()=>{
  describe("Test extract buses logic", ()=>{
    
  })
  describe("Test Logic in handling data",()=>{
    it("Expect buses with invalid Latitude and Longitude to not go through",(done)=>{
      mock('axios', (options)=>{
        return new Promise(function (resolve, reject) {
          var content = require("fs").readFileSync("./test/sample/sample_bus.json").toString()
          content = JSON.parse(content)
          content['Services'] = content['Services'].map(function (service) {
            service['NextBus']['Latitude'] = '0'
            service['NextBus']['Longitude'] = '0'
            return service
          })
          resolve({data: content})
        })
      })

      var PublicEmitter = require("../public")
      var config = require("../config")
      config['notTimed'] = true
      var _public = new PublicEmitter(config, {})

      _public.query(_public.firstStops).then((buses)=>{
        expect(buses.length).to.be.equal(0)
        done();
      })
    })
    it("Expect buses with valid Latitude and Longitude to go through",(done)=>{
      var PublicEmitter = require("../public")
      var config = require("../config")
      config['notTimed'] = true
      var _public = new PublicEmitter(config, {})
      _public.query(_public.firstStops).then((buses)=>{
        buses.forEach((bus)=>{
          expect(bus).to.be.an('object')
          expect(bus).to.include.keys(['BusStopCode'])
          expect(bus).to.include.keys(['ServiceNo'])
          expect(bus).to.include.keys(['StopIndex'])
        })
        done();
      })
    })

    afterEach(function () {
      mock.stop('axios')
    })
  })
})
