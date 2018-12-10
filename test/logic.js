var expect = require("chai").expect;
var sinon = require("sinon")
var Promise = require('bluebird')
var mock = require("mock-require")
var reader = require("./reader")
describe("Test add and update bus functionality", ()=>{
  describe("Test add bus function", ()=>{
    it("Expect bus_to_add event to give new id to buses", ()=>{
      var fake = sinon.spy()

      var emitter = new (require("events").EventEmitter)()
      emitter.on("add_buses", fake)
      require("../src/addBus")(emitter)
      emitter.emit("buses_to_add", {newBuses: reader("test/sample/parse_sample_locations.json")})

      expect(fake.callCount).to.be.equal(1)
      var called = fake.getCall(0)
      expect(called.args[0]).to.be.an('array')
      called.args[0].forEach(function (arg) {
        expect(arg).to.be.not.null
        expect(arg["bus_id"]).to.be.not.null
      })
    })
  })
  describe("Test update bus functionality", ()=>{
    it("Expect bus_to_update to patch as bus_to_add if bus id does not match", (done)=>{
      var emitter = new (require("events").EventEmitter)()
      var fakeUpdate = sinon.fake()
      var fakeAdd = sinon.fake()
      emitter.on("update_buses", fakeUpdate)
      emitter.on("buses_to_add", fakeAdd)

      var file = require("../src/updateBus")(emitter)
      var buses = {
        newBuses: reader("test/sample/new_buses.json"),
        currentBuses: reader("test/sample/current_buses.json")
      }
      var fakeBus = JSON.parse(JSON.stringify(buses['newBuses'][0]))
      fakeBus['originBus']['bus_id'] = "fake_id"
      fakeBus['Latitude'] = "1.333333"

      buses['newBuses'].push(fakeBus)

      emitter.emit("buses_to_update", buses)
      expect(fakeUpdate.callCount).to.be.equal(1)
      expect(fakeAdd.callCount).to.be.equal(1)
      var call = fakeAdd.getCall(0)
      expect(call.args[0]['newBuses'][0]['Latitude']).to.be.equal(fakeBus['Latitude'])
      done()
    })
    it("Expect bus_to_update to match according to bus_id for periodic follow logic",(done)=>{
      var emitter = new (require("events").EventEmitter)()
      var fakeUpdate = sinon.fake()
      var fakeAdd = sinon.fake()
      emitter.on("update_buses", fakeUpdate)
      emitter.on("buses_to_add", fakeAdd)

      var file = require("../src/updateBus")(emitter)
      var buses = {
        newBuses: reader("test/sample/new_buses.json"),
        currentBuses: reader("test/sample/current_buses.json")
      }
      emitter.emit("buses_to_update", buses)
      expect(fakeUpdate.callCount).to.be.equal(1)
      expect(fakeAdd.callCount).to.be.equal(0)
      var called = fakeUpdate.getCall(0)
      expect(called.args[0]).to.be.an('array')
      expect(called.args[0].length).to.be.equal(buses['currentBuses'].length)

      called.args[0].forEach((arg)=>{
        expect(arg).to.include.keys(["index","newBus"])
        expect(arg['newBus']).to.not.include.keys(["originBus"])
      })
      done()
    })
    it("Expect bus_to_update to attempt to patch with min 1 stop diff critera if no originBus", (done)=>{
      var emitter = new (require("events").EventEmitter)()
      var fakeUpdate = sinon.fake()
      var fakeAdd = sinon.fake()
      emitter.on("update_buses", fakeUpdate)
      emitter.on("buses_to_add", fakeAdd)

      var file = require("../src/updateBus")(emitter)
      var buses = {
        newBuses: reader("test/sample/new_buses.json"),
        currentBuses: reader("test/sample/current_buses.json")
      }
      buses['newBuses'][0]['StopIndex'] = 2
      delete buses['newBuses'][0]['originBus']

      emitter.emit("buses_to_update", {
        newBuses: [buses['newBuses'][0]],
        currentBuses: [buses['currentBuses'][0]]
      })

      expect(fakeUpdate.callCount).to.be.equal(1)
      expect(fakeAdd.callCount).to.be.equal(0)
      var called = fakeUpdate.getCall(0)
      expect(called.args[0]).to.be.an('array')
      expect(called.args[0].length).to.be.equal(1)

      called.args[0].forEach((arg)=>{
        expect(arg).to.include.keys(["index","newBus"])
        expect(arg['newBus']).to.not.include.keys(["originBus"])
      })

      buses['newBuses'][0]['StopIndex'] = 20
      delete buses['newBuses']['originBus']
      emitter.emit("buses_to_update", {
        newBuses: [buses['newBuses'][0]],
        currentBuses: [buses['currentBuses'][0]]
      })
      expect(fakeAdd.callCount).to.be.equal(1)

      done()
    })
  })
})
