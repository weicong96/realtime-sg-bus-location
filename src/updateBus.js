const _ = require("lodash")

module.exports = ({buses, events, currentBuses})=>{
  //this is an update all, not a replace.
  var busesNoOrigin = [];
  _.forEach(newBuses, (newBus)=>{
    if(!newBus['originBus']){
      var lookByStopIndex = _.findIndex(currentBuses, (currentBus)=>{
        return (Math.abs(currentBus['StopIndex'] == newBus['StopIndex']) <= 2)
      })
      if(lookByStopIndex == -1){
        busesNoOrigin.push(newBus)
      }
    }else{
      var originalBusIndex = _.findIndex(currentBuses, (currentBus)=> currentBus['bus_id'] == newBus['originBus']['bus_id'])
      if(originalBusIndex == -1){
        delete newBus['originBus']
        busesNoOrigin.push(newBus)
      }else{
        //logger.info("Bus "+newBus['originBus']['bus_id']+" from "+ newBus['originBus']['StopIndex'] + " -> " + newBus['StopIndex'] + " time : " + newBus['originBus']['EstimatedArrival']+  " -> "+ newBus['EstimatedArrival'])
        newBus['bus_id'] = newBus['originBus']['bus_id']
        delete newBus['originBus']
        currentBuses[originalBusIndex] = newBus
      }
    }
  })

  events.emit("updated_buses", currentBuses)
  if(busesNoOrigin.length > 0){
    events.emit("add_buses", busesNoOrigin)
  }
}
