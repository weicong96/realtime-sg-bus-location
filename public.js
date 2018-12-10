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
    require("./src/addBus")(this.events)
    require("./src/updateBus")(this.events)

    this.events.on("first_stop", this.firstStopQuery.bind(this))
    this.events.on("next_stop", this.nextStopQuery.bind(this))
    this.events.on("current_stops", this.currentBusesQuery.bind(this))

    this.events.on("add_buses", (e)=>{
      if(!this.currentBuses){
        this.currentBuses = []
      }
      this.currentBuses = _.concat(this.currentBuses, e)
      this.events.emit("added_buses", e)
    })
    this.events.on("update_buses",(e)=>{
      _.forEach(e, (change)=>{
        this.currentBuses[change['index']] = change['newBus']
      })
      this.events.emit("updated_buses", _.map(e, (change)=> change['newBus']))
      //console.log(this.currentBuses.length," is the current length after update bus")
    })
  }
  setupTimers(){
    var cron = require("./lib/cron")
    cron(this.events,"first_stop", this.config.firststop_cron)
    cron(this.events,"next_stop", this.config.nextstop_cron)
    cron(this.events,"current_stops", this.config.currentstop_cron)

  }

  process(newBuses, event){
    if(event == "current_stops"){
      if(this.currentBuses.length > 0){
        this.events.emit("buses_to_update", {newBuses, currentBuses: this.currentBuses})
      }else{
        this.events.emit("buses_to_add", {newBuses})
      }
    }else{
      if(this.currentBuses.length == 0){
        this.events.emit("buses_to_add", {newBuses: newBuses})
      }else{
        this.events.emit("buses_to_update", {newBuses, currentBuses: this.currentBuses})
      }
    }
  }

  query(stops){
    return require("./src/query")(stops,this.config)
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
      console.log(stops, "first stop")
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
}
module.exports = PublicBus
