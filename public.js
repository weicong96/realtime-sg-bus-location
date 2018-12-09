const _ = require('lodash');
const Promise = require('bluebird')
const http = require("axios")
const fs = require("fs")
class PublicBus{
  constructor(options, events){
    this.config = options
    if(!events){
      var EventEmitter = require("events")
      this.events = new EventEmitter()
    }else{
      this.events = events;
    }
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
    var cron = require("./lib/cron")
    cron(this.events,"first_stop", this.config.firststop_cron)
    cron(this.events,"next_stop", this.config.nextstop_cron)
    cron(this.events,"current_stops", this.config.currentstop_cron)
  }
  currentBusesQuery({event}){
    return Promise.map(Object.keys(this.stops), (service)=>{
      return this.query(this.stops[service])
    },{concurrency: 5})
    .then((stops)=> _.flatten(stops))
    .then((stops)=>{
      this.process(stops,event)
      return stops
    })
  }
  firstStopQuery({event}){
    return this.query(this.firstStops).then((stops)=>{
      this.process(stops, event)
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
        }
      }else{
        nextBusStop['bus'] = currentBus
        return [currentBusStop, nextBusStop]
      }
    })
    stopsToFetch = _.flatten(stopsToFetch)
    return this.query(stopsToFetch).then((stops)=>{
      this.process(stops ,event)
      return stops
    })
  }
  updateBus(buses){
    require("./src/updateBus")({
      buses: buses,
      events: this.events,
      currentBuses: this.currentBuses
    })
  }
  process(newBuses, originEvent){
    if(originEvent == "current_stops"){
      if(this.currentBuses.length > 0){
        this.events.emit("update_buses", newBuses)
      }else{
        this.events.emit("add_buses", newBuses)
      }
    }else{
      if(originEvent != "first_stop" && originEvent != "next_stop"){
        this.events.emit("error", {msg : "ERROR: invalid event "+originEvent+" called extraction function"})
      }else if(this.currentBuses.length == 0){
        this.events.emit("add_buses", newBuses)
      }else{
        this.events.emit("update_buses", newBuses)
      }
    }
  }
  query(stops){
    return require("./src/query")(stops,this.config)
  }
  addBus(buses){
    this.currentBuses = _.concat(this.currentBuses, require("./src/addBus")({
      events: this.events,
      currentBuses: this.currentBuses,
      buses: buses
    }))
  }
}
module.exports = PublicBus
