var PublicBus = require("./public")
var bus = new PublicBus(require("./config"), require("./lib/event")())

bus.events.on("added_buses",function (buses) {
  console.log(buses," new buses has appeared")
})
bus.events.on("updated_buses",function (buses) {
  console.log(buses, "buses updated")
})
bus.events.on("first_stop",function () {
  console.log("Timed query for first stop status, to see if new bus is moving out")
})
bus.events.on("next_stop",function () {
  console.log("Timed query for next stop status for all buses that are not at next stop")
})
bus.events.on("current_stops", function () {
  console.log("update all at once executed")
})

setInterval(()=>{
  console.log(this.currentBuses, " interval for current buses")
}, 60 * 1000)
