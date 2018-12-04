var expect = require("chai").expect;
var sinon = require("sinon")
var Promise = require('bluebird')
var mock = require("mock-require")
function getSampleJson() {
  var content = require("fs").readFileSync("./test/sample/sample_bus.json").toString()
  content = JSON.parse(content)
  return content
}
function mockAxios() {
  return (new Promise(function (resolve, reject) {
    var json = getSampleJson()

    resolve({data: json})
  }))
}
describe("Test Fetch buses functionality",()=>{
  describe("Test extract buses logic", ()=>{
    it("Expect to emit update bus when called with first stop or second stop", (done)=>{
      var extract = require("../lib/extract")
      var Public = require("../public")
      var fakeEmit = sinon.spy()

      var result = extract([{ ServiceNo: "fakeCurrentBusNo" }],[{ServiceNo:"fakeServiceNo"}],{
        emit: fakeEmit
      }, "current_stops")
      expect(fakeEmit.calledWithExactly("update_buses",[{ServiceNo:"fakeServiceNo"}])).to.be.true
      expect(fakeEmit.callCount).to.be.equal(1)

      fakeEmit = sinon.spy()
      var result = extract([],[{ServiceNo:"fakeServiceNo"}],{
        emit: fakeEmit
      }, "current_stops")
      expect(fakeEmit.calledWithExactly("add_buses",[{ServiceNo:"fakeServiceNo"}])).to.be.true
      expect(fakeEmit.callCount).to.be.equal(1)

      done()
    })
    it("Expect to emit update bus when called with first stop or second stop", (done)=>{
      var extract = require("../lib/extract")
      var Public = require("../public")
      var fakeEmit = sinon.spy()

      var result = extract(null,[{ServiceNo:"fakeServiceNo"}],{
        emit: fakeEmit
      }, "first_stop")
      expect(fakeEmit.calledWithExactly("update_buses",[{ServiceNo:"fakeServiceNo"}])).to.be.true
      expect(fakeEmit.callCount).to.be.equal(1)

      fakeEmit = sinon.spy()
      var result = extract(null,[{ServiceNo:"fakeServiceNo"}],{
        emit: fakeEmit
      }, "next_stop")
      done()
    })
    it("Expect to error when called with non event", (done)=>{
      var extract = require("../lib/extract")
      var Public = require("../public")
      var fakeEmit = sinon.fake()

      var result = extract(null,null,{
        emit: fakeEmit
      }, "random_event_123")
      expect(fakeEmit.callCount).to.be.equal(1)
      done()
    })

  })

  describe("Test Query Logic in extracting information",()=>{
    it("Expect null if no results",(done)=>{
      var ownMock = require("mock-require")
      ownMock('axios', (options)=>{
        return new Promise(function (resolve) {
          resolve(null)
        })
      })
      var PublicEmitter = require("../public")
      var query = mock.reRequire("../lib/query")

      var config = require("../config")
      config['notTimed'] = true
      var _public = new PublicEmitter(config, {})
      query(_public.firstStops, config).then((buses)=>{
        expect(buses.length).to.be.equal(0)
        ownMock.stop('axios')
        done();
      })
    })
    it("Expect buses with bus value to get tagged to originBus",(done)=>{
      var ownMock = require("mock-require")
      ownMock('axios', (options)=>{
        return mockAxios()
      })
      var PublicEmitter = require("../public")
      var query = mock.reRequire("../lib/query")

      var config = require("../config")
      config['notTimed'] = true
      var _public = new PublicEmitter(config, {})

      var anyStop = _public.firstStops
      anyStop['bus'] = getSampleJson()['Services'][0]
      query([anyStop], config).then((buses)=>{
        expect(buses.length).to.be.equal(1)
        ownMock.stop('axios')
        done();
      })
    })
    it("Expect buses with invalid Latitude and Longitude to not go through",(done)=>{
      var ownMock = require("mock-require")
      ownMock('axios', (options)=>{
        return mockAxios().then(function (response) {
          response['data']['Services'] = response['data']['Services'].map(function (service) {
            service['NextBus']['Latitude'] = '0'
            service['NextBus']['Longitude'] = '0'
            return service
          })
          return response
        })
      })
      var PublicEmitter = require("../public")
      var query = mock.reRequire("../lib/query")

      var config = require("../config")
      config['notTimed'] = true
      var _public = new PublicEmitter(config, {})

      query(_public.firstStops, config).then((buses)=>{
        expect(buses.length).to.be.equal(0)
        ownMock.stop('axios')
        done();
      })
    })
    it("Expect buses with valid Latitude and Longitude to go through",(done)=>{
      var ownMock = require("mock-require")
      ownMock('axios', (options)=>{
        return mockAxios()
      })
      var PublicEmitter = require("../public")
      var config = require("../config")
      config['notTimed'] = true
      var _public = new PublicEmitter(config, {})
      var query =  mock.reRequire("../lib/query")
      query(_public.firstStops, config).then((buses)=>{
        expect(buses.length).to.be.equal(1)
        buses.forEach((bus)=>{
          expect(bus).to.be.an('object')
          expect(bus).to.include.keys(['BusStopCode'])
          expect(bus).to.include.keys(['ServiceNo'])
          expect(bus).to.include.keys(['StopIndex'])
        })
        ownMock.stop('axios')
        done();
      })
    })
  })
})
