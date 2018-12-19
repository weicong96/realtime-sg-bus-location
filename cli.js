var PublicBus = require("./public")
var crawler = new PublicBus(require("./config"), require("./lib/event")())
var log = false
crawler.events.on("added_buses",function (buses) {
  if(log) console.log(buses," new buses has appeared")
})
crawler.events.on("updated_buses",function (buses) {
  console.log("update")
  if(log) console.log(buses, "buses updated")
})
crawler.events.on("first_stop",function () {
  if(log) console.log("Timed query for first stop status, to see if new bus is moving out")
})
crawler.events.on("next_stop",function () {
  if(log) console.log("Timed query for next stop status for all buses that are not at next stop")
})
crawler.events.on("current_stops", function () {
  if(log) console.log("update all at once executed")
})

setInterval(()=>{
  console.log(crawler.currentBuses, " interval for current buses")
}, 60 * 1000)
