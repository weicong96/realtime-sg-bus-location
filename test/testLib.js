var expect = require("chai").expect;
var EventEmitter = require("events");

var sinon = require("sinon")
describe("Test libraries",function () {
  describe("Test CSV Reader",function () {
    it("Test CSV Files SUCCESS",function () {
      var reader = require("../lib/reader")
      var contents = reader("./test/sample/sampleCsv.csv")
      expect(contents).to.be.not.null
      expect(contents.length).to.be.equal(2)
      contents.forEach(function (content) {
        expect(Object.keys(content)).to.have.members(['TestHeader1', 'TestHeader2'])
      })
    })
  })
  describe("Test events",function () {
    it("Test Events able to be called using event emitter",function () {
      var events = require("../lib/events")
      expect(events()).to.be.instanceof(EventEmitter)
    })
  })
  describe("Test scheduler",function (cb) {
    it("Test event able to be called given event emitter", function () {
      var eventEmitter = new EventEmitter();
      var cron = require("../lib/cron");
      cron(eventEmitter, "test_event", "* * * * * *")
      var fake = sinon.fake()
      eventEmitter.on("test_event", fake)
      setTimeout(function () {
        expect(fake.callCount).to.be.equal(1)
        cb()
      }, 1001)
    })
  })
  describe("Test time", function () {
    it("Test time functionality",function () {
      var time = require("../lib/time")
      expect(time).to.be.a('object')
      expect(time.now).to.be.a('function')

      expect(Math.floor(Date.now()/1000)).to.be.equal(time.now())

      expect(time.parseFormat).to.be.a('function')
      expect(time.parseFormat('2018-03-06', "YYYY-MM-DD"))

      expect(time.moment).to.be.a('function')
      expect(time.moment()).to.be.not.null
    })
  })
})
