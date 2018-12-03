const Promise = require("bluebird")
const http = require("axios")
const _ = require("lodash")
module.exports = function (stops, config) {
  return Promise.map(stops, (stop, index)=>{
    return http({
      url: config.api_url+"BusArrivalv2",
      method: "GET",
      params: {
        BusStopCode: stop['BusStopCode'],
        ServiceNo: stop['ServiceNo']
      },
      headers: {
        "Content-Type": "application/json",
        AccountKey: config.AccountKey
      }
    }).then(function (response) {
      if(response.data.Services && response.data.Services.length > 0){

        var service = response.data.Services[0]
        var nextBus = service['NextBus']
        nextBus['StopIndex'] = parseInt(stop['StopIndex'])
        nextBus['ServiceNo'] = service['ServiceNo']
        nextBus['BusStopCode'] = stop['BusStopCode']
        if(stop['bus'])
          nextBus['originBus'] = stop['bus']
        delete nextBus['DestinationCode']
        delete nextBus['OriginCode']
        delete nextBus['VisitNumber']

        if(nextBus['Latitude'] == '0' && nextBus['Longitude'] == '0')
          return null
        return nextBus
      }else{
        return null
      }
    })
  },  {concurrency : 3})
  .then(data => _.flatten(data))
  .then(data => _.filter(data))
  .then(data=> _.groupBy(data, (item)=> item['Latitude']+","+item['Longitude']))
  .then((data)=> _.map(data, (value, key)=> value[0]))
  //.catch((err)=> console.log(err))
}
