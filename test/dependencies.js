var expect = require("chai").expect;
var EventEmitter = require("events");

var sinon = require("sinon")
describe("Test libraries",function () {
  describe("Test CSV Reader",function () {
    it("Expect file read to succeed with valid csv file",function () {
      var reader = require("../lib/reader")
      var contents = reader("./test/sample/sampleCsv.csv")
      expect(contents).to.be.not.null
      expect(contents.length).to.be.equal(2)
      contents.forEach(function (content) {
        expect(Object.keys(content)).to.have.members(['TestHeader1', 'TestHeader2'])
      })
    })
    it("Expect file read to fail with return error with invalid csv file",function () {
      var reader = require("../lib/reader")
      var contents = reader("./test/sample/sampleCsv222.csv")
      expect(contents).to.be.not.null
      expect(contents).to.be.instanceof(Error)
    })
  })
  describe("Test scheduler",function () {
    it("Expect cron to be working properly, call event given cron text to call it",(cb)=>{
      var eventEmitter = new EventEmitter();
      var cron = require("../lib/cron");
      cron(eventEmitter, "test_event", "* * * * * *")
      var fake = sinon.fake()
      eventEmitter.on("test_event", fake)
      setTimeout(()=>{
        expect(fake.callCount).to.be.equal(1)
        cb()
      }, 1000)
    })
  })
  describe("Test time", function () {
    it("Expect time to parse text properly",function () {
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
