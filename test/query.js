var expect = require("chai").expect;
var sinon = require("sinon")
var Promise = require('bluebird')
var mock = require("mock-require")
var reader = require("./reader")
describe("Test query functions", function () {
  describe("Query function keeps only non zero Latitude and Longitude data", function () {
    it("Expect to keep non zero Latitude and Longitude", function () {
      var fakeHttp = sinon.stub()
      var stops = reader("test/sample/stops_sample.json")
      var nonZero = reader("test/sample/response_sample_non_zero_lat_lng.json")
      mock("axios", fakeHttp.resolves({data:nonZero}))
      var query = mock.reRequire("../src/query")
      query(stops, {AccountKey: "sample_account_key", api_url : "sample_url"}).then(function (data) {
        expect(data).to.be.not.null
        expect(data).to.be.an("array")
        data.forEach(function (entry) {
          expect(Object.keys(entry)).to.include.members(["StopIndex","ServiceNo","BusStopCode","Latitude", "Longitude"])
        })
      })
      mock.stop("axios")
    })
    it("Expect to filter out zero Latitude and Longitude", function () {
      var fakeHttp = sinon.stub()
      var stops = reader("test/sample/stops_sample.json")
      var zero = reader("test/sample/response_sample_zero_lat_lng.json")
      mock("axios", fakeHttp.resolves({data:zero}))
      var query = mock.reRequire("../src/query")
      query(stops, {AccountKey: "sample_account_key", api_url : "sample_url"}).then(function (data) {
        expect(data).to.be.not.null
        expect(data).to.be.an("array")
        expect(data.length).to.be.equal(0)
      })
      mock.stop("axios")
    })
    it("Expect to filter out zero Latitude and Longitude", function () {
      var fakeHttp = sinon.stub()
      var stops = reader("test/sample/stops_sample.json")

      mock("axios", fakeHttp.resolves({data:[]}))
      var query = mock.reRequire("../src/query")
      query(stops, {AccountKey: "sample_account_key", api_url : "sample_url"}).then(function (data) {
        expect(data).to.be.not.null
        expect(data).to.be.an("array")
        expect(data.length).to.be.equal(0)
      })
      mock.stop("axios")
    })
  })
  describe("Query function copies attributes of originBus",function () {
    it("Expect to copy bus attribute in bus stop into origin bus", function () {
      var currentBuses = reader("test/sample/parse_sample_locations.json")
      var stops = reader("test/sample/stops_sample.json")
      var nonZero = reader("test/sample/response_sample_non_zero_lat_lng.json")
      var fakeHttp = sinon.stub()

      stops[0]['bus'] = currentBuses[0]

      mock("axios", fakeHttp.resolves({data:nonZero}))
      var query = mock.reRequire("../src/query")
      query(stops, {AccountKey: "sample_account_key", api_url : "sample_url"}).then(function (data) {
        expect(data).to.be.not.null
        expect(data).to.be.an("array")
        expect(data[0]).to.include.keys(["originBus"])
      })
      mock.stop("axios")
    })
  })
  describe("Query function check for api url and account key",function () {
    it("Expect query function to fail when account key not given", function (done) {
      var promise = mock.reRequire("../src/query")([{}], {api_url : "sample_url"})
      promise.catch(function (msg) {
        expect(msg).to.be.an("object")
        expect(msg).to.include.keys(["error"])
        done()
      })
    })
    it("Expect query function to fail when api url not given", function (done) {
      var promise = mock.reRequire("../src/query")([{}], {AccountKey : "sample_account_key"})
      promise.catch(function (msg) {
        expect(msg).to.be.an("object")
        expect(msg).to.include.keys(["error"])
        done()
      })
    })
  })
})
