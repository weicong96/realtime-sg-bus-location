const EventEmitter = require("events");
var eventsChannel = new EventEmitter();
module.exports = function () {
  return eventsChannel;
}
