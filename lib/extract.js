const _ = require("lodash")
const Promise = require("bluebird")
module.exports = function (publicInstance, newBuses,eventsEmitter, event){
  if(event == "current_buses"){
    if(publicInstance.currentBuses.length > 0){
      publicInstance.currentBuses = []
      eventsEmitter.emit("replace_all")
    }
    eventsEmitter.emit("add_bus", newBuses)
  }else{
    if(event != "first_stop" && event != "next_stop"){
      eventsEmitter.emit("error", {msg : "ERROR: invalid event "+event+" called extraction function"})
      return
    }
    eventsEmitter.emit("update_bus", newBuses)
  }
}
