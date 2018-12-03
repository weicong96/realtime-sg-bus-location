const _ = require('lodash');
const Promise = require('bluebird')

const http = require("axios")
const time = require("./lib/cron")
const extract = require("./lib/extract");
const fs = require("fs")
class PublicBus{
  constructor(options, events){
    if(!events){
      var EventEmitter = require("events")
      this.events = new EventEmitter()
    }
    this.events = events;
    if(options){
      this.config = options

      if(!options.notTimed){
        this.setupTimers()
        this.setupListener()
        this.currentBusesQuery({event: "current_buses"})
      }
    }
    //setup stops
    this.stops = _.reduce(this.config.buses, (object, bus)=>{
      object[bus] = require("./lib/reader")(this.config.stopsDataPath.replace("[bus]", bus))
      return object
    }, {})
    this.firstStops = _.map(this.stops, (stop)=> stop[1])
    this.currentBuses = [];
    this.apiKey = this.config.AccountKey
  }
  setupListener(){
    this.events.on("update_buses", this.updateBus.bind(this))
    this.events.on("add_buses", this.addBus.bind(this))
    this.events.on("first_stop", this.firstStopQuery.bind(this))
    this.events.on("next_stop", this.nextStopQuery.bind(this))
    this.events.on("replace_all", this.replaceAll.bind(this))
  }
  replaceAll(){
    this.currentBuses = []
  }
  setupTimers(){
    require("./lib/cron")(this.events,"first_stop", this.config.firststop_cron)
    require("./lib/cron")(this.events,"next_stop", this.config.nextstop_cron)
  }
  currentBusesQuery({event}){
    return Promise.map(Object.keys(this.stops), (service)=>{
      return this.query(this.stops[service])
    },{concurrency: 5})
    .then((stops)=> _.flatten(stops))
    .then((stops)=>{
    extract(this, stops, this.events,event)
      return stops
    })
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
          busesNoOrigin.push(newBus)
        }else{
          newBus['bus_id'] = newBus['originBus']['bus_id']

          delete newBus['originBus']
          this.currentBuses[originalBusIndex] = newBus
        }
      }
    })

    this.events.emit("updated_buses", this.currentBuses)
    if(busesNoOrigin.length > 0){
      this.events.emit("add_buses", busesNoOrigin)
      this.events.emit("buses_no_origin", busesNoOrigin)
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
    return
    this.query(this.firstStops)
    .then((stops)=>{
      extract(this, stops, this.events,event)
      return stops
    })
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
    return
    this.query(stopsToFetch)
      .then((stops)=>{
        extract(this, stops, this.events,event)
        return stops
      })
  }
  query(stops){
    return require("./lib/query")(stops,this.config)
  }
  on(_event, _function){
    this.events.on(_event, _function)
  }
}
module.exports = PublicBus
