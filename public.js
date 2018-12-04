const _ = require('lodash');
const Promise = require('bluebird')

const http = require("axios")
const time = require("./lib/cron")
const extract = require("./lib/extract");
const fs = require("fs")
const winston = require("winston")
const logger = winston.createLogger({
  level: 'info',
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log`
    // - Write all logs error (and below) to `error.log`.
    //
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'debug.log', level: 'debug' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
})
class PublicBus{
  constructor(options, events){
    this.config = options
    if(!events){
      var EventEmitter = require("events")
      this.events = new EventEmitter()
    }
    this.events = events;
    //setup stops
    this.stops = _.reduce(this.config.buses, (object, bus)=>{
      object[bus] = require("./lib/reader")(this.config.stopsDataPath.replace("[bus]", bus))
      return object
    }, {})
    this.firstStops = _.map(this.stops, (stop)=> stop[1])
    this.currentBuses = [];
    this.apiKey = this.config.AccountKey

    if(options){
      if(!options.notTimed){
        this.setupTimers()
        this.setupListener()
        this.currentBusesQuery({event: "current_stops"})
      }
    }
  }
  setupListener(){
    this.events.on("update_buses", this.updateBus.bind(this))
    this.events.on("add_buses", this.addBus.bind(this))
    this.events.on("first_stop", this.firstStopQuery.bind(this))
    this.events.on("next_stop", this.nextStopQuery.bind(this))
    this.events.on("current_stops", this.currentBusesQuery.bind(this))
  }
  setupTimers(){
    require("./lib/cron")(this.events,"first_stop", this.config.firststop_cron)
    require("./lib/cron")(this.events,"next_stop", this.config.nextstop_cron)
    require("./lib/cron")(this.events,"current_stops", this.config.currentstop_cron)
  }
  currentBusesQuery({event}){
    return Promise.map(Object.keys(this.stops), (service)=>{
      return this.query(this.stops[service])
    },{concurrency: 5})
    .then((stops)=> _.flatten(stops))
    .then((stops)=>{
      extract(this.currentBuses, stops, this.events,event)
      return stops
    })
  }
  updateBus(newBuses){
    //this is an update all, not a replace.
    var busesNoOrigin = [];
    _.forEach(newBuses, (newBus)=>{
      if(!newBus['originBus']){
        var lookByStopIndex = _.findIndex(this.currentBuses, (currentBus)=>{
          return (Math.abs(currentBus['StopIndex'] == newBus['StopIndex']) <= 2)
        })
        if(lookByStopIndex == -1){
          busesNoOrigin.push(newBus)
        }
      }else{
        var originalBusIndex = _.findIndex(this.currentBuses, (currentBus)=> currentBus['bus_id'] == newBus['originBus']['bus_id'])
        if(originalBusIndex == -1){
          delete newBus['originBus']
          busesNoOrigin.push(newBus)
        }else{
          logger.info("Bus "+newBus['originBus']['bus_id']+" from "+ newBus['originBus']['StopIndex'] + " -> " + newBus['StopIndex'] + " time : " + newBus['originBus']['EstimatedArrival']+  " -> "+ newBus['EstimatedArrival'])

          newBus['bus_id'] = newBus['originBus']['bus_id']

          delete newBus['originBus']
          this.currentBuses[originalBusIndex] = newBus
        }
      }
    })

    this.events.emit("updated_buses", this.currentBuses)
    if(busesNoOrigin.length > 0){
      this.events.emit("add_buses", busesNoOrigin)
    }
  }
  addBus(stops){
    _.forEach(stops, (stop)=>{
      var newStop = JSON.parse(JSON.stringify(stop))
      newStop['bus_id'] = require('crypto').randomBytes(8).toString('hex')
      this.currentBuses.push(newStop)
    })
    this.events.emit("added_buses", this.currentBuses)
  }
  firstStopQuery({event}){
    return this.query(this.firstStops).then((stops)=>{
      extract(this.currentBuses, stops, this.events,event)
      return stops
    })
  }

  nextStopQuery({event}){
    var stopsToFetch = _.map(this.currentBuses, (currentBus)=>{
      var currentBusStop = this.stops[currentBus['ServiceNo']][currentBus['StopIndex']]
      var nextBusStop = this.stops[currentBus['ServiceNo']][currentBus['StopIndex'] + 1]

      currentBusStop['bus'] = currentBus

      if(!nextBusStop || !currentBusStop){
        //last stop
        if(currentBusStop['StopIndex'] == (this.stops[currentBus['ServiceNo']].length - 1)){
          return []
        }else{
          return [currentBusStop]
        }
      }else{
        nextBusStop['bus'] = currentBus
        return [currentBusStop, nextBusStop]
      }
    })
    stopsToFetch = _.flatten(stopsToFetch)
    return this.query(stopsToFetch).then((stops)=>{
      extract(this.currentBuses, stops, this.events,event)
      return stops
    })
  }
  query(stops){
    return require("./lib/query")(stops,this.config)
  }
}
module.exports = PublicBus
