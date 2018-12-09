const _ = require("lodash")
module.exports = ({buses, currentBuses, events})=>{
  var addedBuses = []

  _.forEach(buses, (bus)=>{
    var newBus = JSON.parse(JSON.stringify(bus))
    newBus['bus_id'] = require('crypto').randomBytes(8).toString('hex')
    addedBuses.push(newBus)
  })
  events.emit("added_buses", addedBuses)
  return addedBuses
}
