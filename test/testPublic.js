var expect = require("chai").expect;
var EventEmitter = require("events");
var axios = require("axios")
var MockAdapter = require('axios-mock-adapter');
var mock = new MockAdapter(axios);
var sinon = require("sinon")
describe("Test Public crawl functionality",function () {
  describe("Test functional logic", function () {
    it("Test listeners",(done)=>{
      mock.onGet().reply(function (config) {
        console.log(config)
        return [200, []]
      })
      var Public = require("../public")
      var _public = new Public()
      
    })
  })
})
