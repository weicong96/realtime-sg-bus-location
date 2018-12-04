const _ = require("lodash")
const Promise = require("bluebird")
module.exports = function (publicInstance, newBuses,eventsEmitter, event){
  if(event == "current_stops"){
    if(publicInstance.currentBuses.length > 0){
      eventsEmitter.emit("clear_current")
      eventsEmitter.emit("update_buses", newBuses)
      //console.log("replace all!", newBuses, "REPLACE ALL")
    }else{
      eventsEmitter.emit("add_buses", newBuses)
    }
  }else{
    if(event != "first_stop" && event != "next_stop"){
      eventsEmitter.emit("error", {msg : "ERROR: invalid event "+event+" called extraction function"})
      return
    }
    eventsEmitter.emit("update_buses", newBuses)
  }
}
