var expect = require("chai").expect;
var sinon = require("sinon")
var Promise = require('bluebird')
var mock = require("mock-require")
function getSampleJson() {
  var content = require("fs").readFileSync("./test/sample/sample_stops.json").toString()
  content = JSON.parse(content)
  return content
}
function mockAxios() {
  return (new Promise(function (resolve, reject) {
    var json = getSampleJson()

    resolve({data: json})
  }))
}
var data;
var prog;
describe("Test Fetch buses functionality",()=>{
  describe("Test add and update functionality", function () {
    it("Expect add to be called on addBus method",function () {
      var fakeAdd = sinon.spy()
      mock("../src/addBus", fakeAdd)
      var Public = mock.reRequire("../public")
      var config = require("../config")
      config['notTimed'] = true
      var prog = new Public(config)
      prog.addBus([{}])
      expect(fakeAdd.callCount).to.be.equal(1)
      mock.stop("../src/addBus")
    })
    it("Expect update to be called on update_buses",function () {
      var fakeAdd = sinon.spy()
      mock("../src/updateBus", fakeAdd)
      var Public = mock.reRequire("../public")
      var config = require("../config")
      config['notTimed'] = true
      var prog = new Public(config)
      prog.updateBus([{}])
      expect(fakeAdd.callCount).to.be.equal(1)
      mock.stop("../src/updateBus")
    })
  })
  describe("Test events", ()=>{
    beforeEach(()=>{
      data = getSampleJson()['Services']
    })
    it("Expect next stops to filter last buses and going to last station", ()=>{
      var Public = mock.reRequire("../public")
      var config = require("../config")
      config['notTimed'] = true
      prog = new Public(config)
      var data = require("fs").readFileSync("./test/sample/sample_locations.json").toString()
      data = JSON.parse(data)
      var mockQuery = sinon.spy()
      //Test at last stop
      prog.query = function (stops) {
        expect(stops).to.be.not.null
        expect(stops.length).to.be.equal(0)
        return new Promise(function (resolve,reject) {
          resolve(data)
        })
      }
      data[data.length - 1]['StopIndex'] = prog.stops['179'].length-1
      prog.currentBuses = [data[data.length - 1]]
      prog.nextStopQuery({event: "next_stop"})

      prog.query = function (stops) {
        expect(stops).to.be.not.null
        expect(stops.length).to.be.equal(2)
        stops.forEach((stop)=>{
          expect(stop.bus).to.be.not.null
        })
        return new Promise(function (resolve,reject) {
          resolve(data)
        })
      }
      var secondLastStop = prog.stops['179'][prog.stops['179'].length - 2]
      data[data.length - 2]['StopIndex'] = prog.stops['179'].length-2
      prog.currentBuses = [data[data.length - 2]]
      prog.nextStopQuery({event: "next_stop"})

    })
    it("Expect first, next and current stops to return same number of stops as given", (done)=>{
      //mock query and extract
      var mockQuery = sinon.stub()
      var mockProcess= sinon.spy()

      var Public = mock.reRequire("../public")
      var config = require("../config")
      config['notTimed'] = true
      prog = new Public(config)
      prog.query = mockQuery.resolves([{
        ServiceNo: "199",
        Latitude: "1.345",
        Longitude: "103.5567"
      }])
      prog.process = mockProcess
      expect(prog.firstStopQuery).to.be.not.null
      var result = prog.firstStopQuery({event: "first_stop"})
      expect(result).to.be.not.undefined
      result.then(()=>{
        expect(mockProcess.callCount).to.be.equal(1)
        expect(mockProcess.calledWith([{
          ServiceNo: "199",
          Latitude: "1.345",
          Longitude: "103.5567"
        }])).to.be.true
        return prog.currentBusesQuery({event: "next_stop"})
      }).then((result)=>{
        expect(result).to.be.not.undefined

        expect(mockProcess.callCount).to.be.equal(2)
        expect(mockProcess.calledWith([{
          ServiceNo: "199",
          Latitude: "1.345",
          Longitude: "103.5567"
        }])).to.be.true
        done()
      })
    })
    afterEach(()=>{
      prog = null
    })
  })
  describe("Test Instance Setup logic", ()=>{
    it("Expect instance to load bus stops", ()=>{
      var fakeOn = sinon.fake()
      var Public = mock.reRequire("../public")
      prog = new Public(mock.reRequire("../config"))
      expect(prog.stops).to.be.not.null
      expect(prog.stops).to.be.not.equal({})
    })
    it("Expect instance to init with events", ()=>{
      var fakeOn = sinon.fake()
      var Public = mock.reRequire("../public")
      prog = new Public(mock.reRequire("../config"),{
        on:fakeOn
      })
      expect(fakeOn.callCount).to.be.equal(5)
      expect(fakeOn.calledWith("update_buses")).to.be.true
      expect(fakeOn.calledWith("add_buses")).to.be.true
      expect(fakeOn.calledWith("first_stop")).to.be.true
      expect(fakeOn.calledWith("next_stop")).to.be.true
      expect(fakeOn.calledWith("current_stops")).to.be.true
    })
    it("Expect instance to setup timers ", ()=>{
      var fakeCronLib = sinon.spy()
      mock('../lib/cron', fakeCronLib)
      var Public = mock.reRequire("../public")
      var config = mock.reRequire("../config")
      var prog = new Public(config)

      expect(fakeCronLib.callCount).to.be.equal(3)
      expect(fakeCronLib.calledWithExactly(prog.events, "first_stop", config.firststop_cron))
      expect(fakeCronLib.calledWithExactly(prog.events, "next_stop", config.nextstop_cron))
      expect(fakeCronLib.calledWithExactly(prog.events, "current_stops", config.currentstop_cron))
      mock.stop('../lib/cron')
    })
  })
  describe("Test process buses logic", ()=>{
    beforeEach(()=>{
      var Public = require("../public")
      prog = new Public({
        notTimed: true
      })
      data = getSampleJson()['Services']
    })

    it("Expect instance to add or update buses when called with first or next stop", ()=>{
      var fakeEmit = sinon.spy()
      prog.events = {
        emit: fakeEmit
      }
      prog.currentBuses = data
      expect(prog.process).to.be.not.null
      expect(prog.process(data, "first_stop")).to.be.undefined
      expect(fakeEmit.callCount).to.be.equal(1)
      expect(fakeEmit.calledWith("update_buses", data)).to.be.true

      prog.currentBuses = []
      expect(prog.process).to.be.not.null
      expect(prog.process(data, "first_stop")).to.be.undefined
      expect(fakeEmit.callCount).to.be.equal(2)
      expect(fakeEmit.calledWith("add_buses", data)).to.be.true
    })
    it("Expect instance to throw error when called with non event", ()=>{
      var fakeEmit = sinon.spy()
      prog.events = {
        emit: fakeEmit
      }
      expect(prog.process).to.be.not.null
      expect(prog.process([], "random_non_event")).to.be.undefined
      expect(fakeEmit.callCount).to.be.equal(1)
      expect(fakeEmit.calledWith("error")).to.be.true
    })
    it("Expect instance to update or add bus when called current_stops", ()=>{
      var fakeEmit = sinon.spy()
      prog.events = {
        emit: fakeEmit
      }
      prog.currentBuses = data

      expect(prog.process).to.be.not.null

      expect(prog.process(data, "current_stops")).to.be.undefined
      expect(fakeEmit.calledWithExactly("update_buses", data)).to.be.true
      expect(fakeEmit.callCount).to.be.equal(1)

      prog.currentBuses = []
      expect(prog.process(data, "current_stops")).to.be.undefined
      expect(fakeEmit.calledWithExactly("add_buses", data)).to.be.true
      expect(fakeEmit.callCount).to.be.equal(2)
    })

    afterEach(()=>{
      prog = null
    })
  })
})
