var expect = require("chai").expect;
var sinon = require("sinon")
var Promise = require('bluebird')
var mock = require("mock-require")

describe("Test query functions", function () {
  describe("Test success cases", function () {
    it("Expect to keep non 0 Latitude Longitude results", function () {
      var Public = require("../public")
      var config = require("../config")
      var prog = new Public(config)

      var stub = sinon.stub()
      var data = require("fs").readFileSync("./test/sample/sample_stops.json").toString()
      data = JSON.parse(data)
      mock("axios", stub.resolves({data: data}))
      var query = mock.reRequire("../src/query")
      query(prog.firstStops, {
          AccountKey: config.AccountKey,
          api_url: config.api_url
      }).then((result)=>{
        expect(result).to.be.an('array')
        expect(result.length).to.be.equal(1)
      })
      mock.stop("axios")
    })
    it("Expect to filter 0 Latitude Longitude results", function () {
      var Public = require("../public")
      var config = require("../config")
      var prog = new Public(config)

      var stub = sinon.stub()
      var data = require("fs").readFileSync("./test/sample/sample_stops.json").toString()
      data = JSON.parse(data)
      data['Services'] = data['Services'].map(function (service) {
        service['NextBus']['Latitude'] = '0'
        service['NextBus']['Longitude'] = '0'

        return service
      })
      mock("axios", stub.resolves({data: data}))
      var query = mock.reRequire("../src/query")
      query(prog.firstStops, {
          AccountKey: config.AccountKey,
          api_url: config.api_url
      }).then((result)=>{
        expect(result).to.be.an('array')
        expect(result.length).to.be.equal(0)
      })
      mock.stop("axios")
    })
    it("Expect to return empty array if result does not resolve", function () {
      var Public = require("../public")
      var config = require("../config")
      var prog = new Public(config)

      var stub = sinon.stub()
      var data = require("fs").readFileSync("./test/sample/sample_stops.json").toString()
      data = JSON.parse(data)
      data['Services'] = data['Services'].map(function (service) {
        service['NextBus']['Latitude'] = '0'
        service['NextBus']['Longitude'] = '0'

        return service
      })
      mock("axios", stub.resolves())
      var query = mock.reRequire("../src/query")
      query(prog.firstStops, {
          AccountKey: config.AccountKey,
          api_url: config.api_url
      }).then((result)=>{
        expect(result).to.be.an('array')
        expect(result.length).to.be.equal(0)
      })
      mock.stop("axios")
    })
    it("Expect to move bus attribute to origin bus", function () {
      var Public = require("../public")
      var config = require("../config")
      var prog = new Public(config)

      var stub = sinon.stub()
      var data = require("fs").readFileSync("./test/sample/sample_stops.json").toString()
      var currentBuses = require("fs").readFileSync("./test/sample/sample_locations.json").toString()
      data = JSON.parse(data)
      currentBuses = JSON.parse(currentBuses)
      var stops = prog.firstStops
      stops = stops.map(function (stop) {
        stop['bus'] = currentBuses[0]
        return stop
      })
      mock("axios", stub.resolves())
      var query = mock.reRequire("../src/query")
      query(stops, {
          AccountKey: config.AccountKey,
          api_url: config.api_url
      }).then((result)=>{
        expect(result).to.be.an('array')
        expect(result.length).to.be.equal(0)
      })
      mock.stop("axios")
    })
  })
  describe("Test error cases", function () {
    it("No AccountKey given", function () {
      var query = require("../src/query")
      query([], {
        api_url : "http://localhost"
      }).catch((err)=>{
        expect(err).to.be.not.null
        expect(err['msg']).to.be.not.null
        expect(err['msg']).to.be.equal("No AccountKey provided")
      })
    })
    it("No Api url given", function () {
      var query = require("../src/query")
      query([], {
        AccountKey: "ffff"
      }).catch((err)=>{
        expect(err).to.be.not.null
        expect(err['msg']).to.be.not.null
        expect(err['msg']).to.be.equal("No api url provided")
      })
    })
  })
})
