const _ = require('lodash');
const Promise = require('bluebird')

const http = require("axios")
const events = require("./lib/events")
const config = require("./config")
const time = require("./lib/cron")
const extract = require("./lib/extract");
const fs = require("fs")
class PublicBus{
  constructor(){
    this.config = config
    this.eventEmitter = events()
    this.setupTimers()
    this.setupListener()

    //setup stops
    this.stops = _.reduce(config.buses, (object, bus)=>{
      object[bus] = require("./lib/reader")("./exported_data/"+bus+"_busstops_raw.csv")
      return object
    }, {})
    this.firstStops = _.map(this.stops, (stop)=> stop[1])
    this.currentBuses = [];
    this.apiKey = config.AccountKey
    this.currentBusesQuery({event: "current_buses"})
  }
  setupListener(){
    this.eventEmitter.on("update_bus", this.updateBus.bind(this))
    this.eventEmitter.on("add_bus", this.addBus.bind(this))
    this.eventEmitter.on("first_stop", this.firstStopQuery.bind(this))
    this.eventEmitter.on("next_stop", this.nextStopQuery.bind(this))
  }
  setupTimers(){
    require("./lib/cron")(this.eventEmitter,"first_stop", this.config.firststop_cron)
    require("./lib/cron")(this.eventEmitter,"next_stop", this.config.nextstop_cron)
    //require("./lib/cloud")(this.eventEmitter)
  }
  currentBusesQuery({event}){
    return Promise.map(Object.keys(this.stops), (service)=>{
      return this.query(this.stops[service])
    },{concurrency: 5})
    .then((stops)=> _.flatten(stops))
    .then((stops)=>{
      console.log(stops.length+" buses CURRENT in operation")
      return stops
    })
    .then((stops)=> extract(this, stops, event))
  }
  updateBus(newBuses){
    var busesNoOrigin = [];
    _.forEach(newBuses, (newBus)=>{
      if(!newBus['originBus']){
        busesNoOrigin.push(newBus)
      }else{
        var originalBusIndex = _.findIndex(this.currentBuses, (currentBus)=> currentBus['bus_id'] == newBus['originBus']['bus_id'])

        if(originalBusIndex == -1){
          delete newBus['originBus']
          console.log("could not find originalBusIndex for", newBus)
          busesNoOrigin.push(newBus)
        }else{
          newBus['bus_id'] = newBus['originBus']['bus_id']

          console.log("bus id "+newBus['bus_id']+" : "+newBus['ServiceNo']+" "+newBus['originBus']['StopIndex']+"-> "+newBus['StopIndex'], newBus['originBus']['EstimatedArrival'], " -> ",newBus['EstimatedArrival'])
          delete newBus['originBus']
          this.currentBuses[originalBusIndex] = newBus
        }
      }
    })
    console.log("replaced")
    if(busesNoOrigin.length > 0){
      console.log(busesNoOrigin.length, " buses have no origin ",busesNoOrigin)
      this.eventEmitter.emit("add_bus", busesNoOrigin)
    }
  }
  addBus(stops){
    _.forEach(stops, (stop)=>{
      var newStop = JSON.parse(JSON.stringify(stop))
      newStop['bus_id'] = require('crypto').randomBytes(8).toString('hex')
      this.currentBuses.push(newStop)
    })
    console.log(this.currentBuses.length+" new length after added bus")
  }
  firstStopQuery({event}){
    return this.query(this.firstStops)
    .then((stops)=> extract(this, stops, event))
  }

  nextStopQuery({event}){
    var stopsToFetch = _.map(this.currentBuses, (currentBus)=>{
      var currentBusStop = this.stops[currentBus['ServiceNo']][currentBus['StopIndex']]
      var nextBusStop = this.stops[currentBus['ServiceNo']][currentBus['StopIndex'] + 1]

      currentBusStop['bus'] = currentBus
      if(!nextBusStop){
        return [currentBusStop]
      }else{
        nextBusStop['bus'] = currentBus
        return [currentBusStop, nextBusStop]
      }
    })
    stopsToFetch = _.flatten(stopsToFetch)
    return this.query(stopsToFetch)
    .then((stops)=> extract(this, stops, event))
  }
  query(stops){
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
          AccountKey: this.config.AccountKey
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
    .catch((err)=> console.log(err))
  }
}
module.exports = PublicBus
new PublicBus()
