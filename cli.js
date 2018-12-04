var PublicBus = require("./public")
var bus = new PublicBus(require("./config"), require("./lib/event")())

bus.events.on("added_buses",function (buses) {
  buses.forEach((bus)=>{
    console.log("New bus", bus['ServiceNo'], " at stop index : ", bus['StopIndex'])
  })
})
bus.events.on("updated_buses",function (buses) {
  buses.forEach((bus)=>{
    console.log("updated bus", bus['ServiceNo'], " at stop index : ", bus['StopIndex'])
  })
  console.log(bus.currentBuses.length, " current buses")
})
bus.events.on("clear_current",function (buses) {
  console.log("Replace all busstops")
})
bus.events.on("first_stop",function () {
  console.log("first stop executed")
})
bus.events.on("next_stop",function () {
  console.log("next stop executed")
})
bus.events.on("current_stops", function () {
  console.log("update all at once executed")
})
