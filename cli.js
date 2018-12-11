const PublicBus = require("./public")
const crawler = new PublicBus(require("./config"), require("./lib/event")())
const fs = require("fs")
const time = require("./lib/time")
const _ = require("lodash")
function mapItems(items) {
  items = _.uniqBy(items, (item)=> item['bus_id'])
  items = items.map(function (item) {
    var expiry = time.moment()
    expiry.add(30, "seconds")
    return {
      route_id : item['ServiceNo'],
      bus_id: item['bus_id'],
      lat: item['Latitude'],
      lon: item['Longitude'],
      last_updated : time.now(),
      expiry: expiry.unix(),
      time_arrive: time.parseFormat(item['EstimatedArrival'],"YYYY-MM-DDThh:mm:ss Z ZZ").unix(),
      time_arrive_words: item['EstimatedArrival'],
      stop_index: item['StopIndex'],
      bus_stop_code: item['BusStopCode']
    }
  })
  return items
}

function addOrUpdateBuses(buses) {
  //console.log(buses," new buses has appeared")
  buses = mapItems(buses)
  var grouped = _.groupBy(buses, (bus)=> bus['route_id'])
  _.forEach(grouped, (buses, service)=>{
    var columns = _.map(buses, (bus)=> _.values(bus).join(",")).join("\n")
    fs.appendFileSync("./exported_data/service_timings_"+service+"_"+time.moment().format("DD_MM_HH")+".csv", columns+"\n")
  })
  require("./store").write(buses)
}
crawler.events.on("added_buses", addOrUpdateBuses)
crawler.events.on("updated_buses",addOrUpdateBuses)
crawler.events.on("first_stop",function () {
  console.log("Timed query for first stop status, to see if new bus is moving out")
})
crawler.events.on("next_stop",function () {
  console.log("Timed query for next stop status for all buses that are not at next stop")
})
crawler.events.on("current_stops", function () {
  console.log("update all at once executed")
})

setInterval(()=>{
  console.log(crawler.currentBuses, " interval for current buses")
}, 60 * 1000)
