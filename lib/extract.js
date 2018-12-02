const _ = require("lodash")
const Promise = require("bluebird")
module.exports = function (public, newBuses, event) {
  if(event == "current_buses"){
    if(public.currentBuses){
      public.currentBuses = []
    }
    public.eventEmitter.emit("add_bus", newBuses)
  }else{
    if(event != "first_stop" && event != "next_stop"){
      console.log("ERROR: invalid event",event," called extraction function")
      return
    }
    //next stop is easy to handle,
    //what about first stop??
    // if first stop and next stop updates, repeated?
    // in update function, check if stops has originBus, if no origin OR cannot find origin it goes to add
    public.eventEmitter.emit("update_bus", newBuses)
  }
}
