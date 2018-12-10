var expect = require("chai").expect;
var sinon = require("sinon")
describe("Test getStops functions", function () {
  describe("getStops reads data from path", function () {
    it("Expect to return stop info when reading from valid path", function () {
      var getStops = require("../src/getStops")
      var stops = getStops("./exported_data/[bus].csv", ["179"])
      expect(stops).to.be.not.null
      expect(stops).to.be.not.equal({})
      Object.keys(stops).forEach(function (stop) {
        expect(stops[stop]).to.be.an("array")
      })
    })
    it("Expect to return error when reading from invalid path", function () {
      var getStops = require("../src/getStops")
      var stops = getStops("../invalid_dir/[bus].csv", ["179"])
      expect(stops).to.be.not.null
      expect(stops).to.be.not.equal({})
      Object.keys(stops).forEach(function (stop) {
        expect(stops[stop]).to.be.deep.equal({error: "File cannot be read"})
      })
    })
  })
})
