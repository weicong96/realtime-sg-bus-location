const Promise = require("bluebird")
const http = require("axios")
const _ = require("lodash")
const time = require("../lib/time")
module.exports = function (stops, options) {
  var AccountKey = options['AccountKey']
  var api_url = options['api_url']
  if(!AccountKey){
    return Promise.reject({error : "No AccountKey provided"})
  }
  if(!api_url){
    return Promise.reject({error: "No api url provided"})
  }
  return (Promise.map(stops, (stop, index)=>{
    return http({
      url: api_url+"BusArrivalv2",
      method: "GET",
      params: {
        BusStopCode: stop['BusStopCode'],
        ServiceNo: stop['ServiceNo']
      },
      headers: {
        "Content-Type": "application/json",
        AccountKey: AccountKey
      }
    }).then((response)=>{
      if(response && response.data.Services && response.data.Services.length > 0){
        var service = response.data.Services[0]
        var nextBus = service['NextBus']
        nextBus['StopIndex'] = parseInt(stop['StopIndex'])
        nextBus['ServiceNo'] = service['ServiceNo']
        nextBus['BusStopCode'] = stop['BusStopCode']
        if(stop['bus']){
          nextBus['originBus'] = stop['bus']
        }
        delete nextBus['DestinationCode']
        delete nextBus['OriginCode']
        delete nextBus['VisitNumber']
        if(nextBus['Latitude'] == '0' && nextBus['Longitude'] == '0'){
          return null
        }else{
          return nextBus
        }
      }else{
        return []
      }
    })
  },  {concurrency : 3})
  .then(data => _.flatten(data))
  .then(data => _.filter(data))
  .then(data=> _.groupBy(data, (item)=> item['Latitude']+","+item['Longitude']))
  .then((groupedData)=>{
    _.forEach(groupedData, (values, key)=>{
      groupedData[key] = _.sortBy(values, (item)=> time.parseFormat(item['EstimatedArrival'],"YYYY-MM-DDThh:mm:ss Z ZZ"))
    })
    return groupedData
  })
  .then((data)=> _.map(data, (value, key)=> value[0])))
}
