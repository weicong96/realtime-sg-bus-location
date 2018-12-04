const _ = require("lodash")
const Promise = require("bluebird")
module.exports = function (currentBuses, newBuses,eventsEmitter, event){
  if(event == "current_stops"){
    if(currentBuses.length > 0){
      eventsEmitter.emit("update_buses", newBuses)
    }else{
      eventsEmitter.emit("add_buses", newBuses)
    }
  }else{
    if(event != "first_stop" && event != "next_stop"){
      eventsEmitter.emit("error", {msg : "ERROR: invalid event "+event+" called extraction function"})
    }else{
      eventsEmitter.emit("update_buses", newBuses)
    }
  }
}
