var expect = require("chai").expect;
var sinon = require("sinon")
var Promise = require('bluebird')
var fs = require("fs")

var derive = require("../src/deriveLocation")
describe("Test derive logic of StopIndex from route", function () {
  describe("Derive logic buffers to nearest path", function () {
    it("Expect derive logic to buffer to nearest path", function () {
      var point = [1.34443,103.707]
      var multilinestring = fs.readFileSync("./test/sample/sample_path.json").toString()
      multilinestring = JSON.parse(multilinestring)

      var result = derive(point, multilinestring)
      expect(result).to.be.not.null
      expect(result.map(r=>r['index'])).to.include.members([25])
    })
  })
})
