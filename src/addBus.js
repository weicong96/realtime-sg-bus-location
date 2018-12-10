const _ = require("lodash")
module.exports = (events)=>{
  events.on("buses_to_add", (event)=>{
    events.emit("add_buses", _.map(event['newBuses'], (bus)=>{
      bus = JSON.parse(JSON.stringify(bus))
      bus['bus_id'] =  require('crypto').randomBytes(8).toString('hex')
      return bus
    }))
  })
}
