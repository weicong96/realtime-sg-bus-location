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
describe("Test event based functionality",()=>{
  describe("Test setups", ()=>{
    it("Expect to setup events", (done)=>{
      var extract = require("../lib/extract")
      var Public = require("../public")
      var fakeEmit = sinon.spy()
      var _public = new Public(require("../config"), {
        on: fakeEmit,
        emit: function () {}
      })
      expect(fakeEmit.calledWith("update_buses"))
      expect(fakeEmit.calledWith("add_buses"))
      expect(fakeEmit.calledWith("first_stop"))
      expect(fakeEmit.calledWith("next_stop"))
      expect(fakeEmit.calledWith("current_stops"))
      done()
    })
  })
})
