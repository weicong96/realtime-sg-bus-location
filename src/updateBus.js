const _ = require("lodash")

module.exports = (events)=>{
  events.on("buses_to_update", (event)=>{
    var newBuses = event['newBuses']
    var currentBuses = event['currentBuses']

    //require("fs").writeFileSync("./test/sample/current_buses.json", JSON.stringify(currentBuses))
    //require("fs").writeFileSync("./test/sample/new_buses.json", JSON.stringify(newBuses))

    var addBuses = []
    var updateBuses = []
    _.forEach(newBuses, (newBus)=>{
      //patching logic for periodic refresh
      if(!newBus['originBus']){
        //can bus discrepancy in data go both ways? ie. behind or ahead by 1 stop?
        var diffs = _.map(currentBuses, (currentBus)=> Math.abs(parseInt(currentBus['StopIndex']) - parseInt(newBus['StopIndex'])))
        var minStopDiff = Math.min.apply(null,diffs)

        if(minStopDiff <= 1){
          var index = _.findIndex(diffs, (diff)=>(diff == minStopDiff))
          newBus['originBus'] = currentBuses[index]
          console.log("patched ", newBus['StopIndex'], currentBuses[index]['StopIndex'])
        }
      }
      if(!newBus['originBus']){
        addBuses.push(newBus)
      }else{
        var originalBusIndex = _.findIndex(currentBuses, (currentBus)=> currentBus['bus_id'] == newBus['originBus']['bus_id'])
        //bus disappeared
        if(originalBusIndex == -1){
          delete newBus['originBus']
          addBuses.push(newBus)
        }else{
          //periodic follow
          newBus['bus_id'] = newBus['originBus']['bus_id']
          delete newBus['originBus']
          updateBuses.push({
            index : originalBusIndex,
            newBus: newBus
          })
        }
      }
    })
    if(addBuses.length > 0){
      events.emit("buses_to_add", {newBuses: addBuses})
    }
    events.emit("update_buses", updateBuses)
  })
}
