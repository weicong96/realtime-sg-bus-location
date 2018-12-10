# Singapore Realtime Bus Services Location
This repository contains code that attempts to aggregrate Bus Stop Services information from Land Transport Authority's Datamall REST API under BusArrivalv2.

# Purpose
Currently, the Datamall API does not allow the querying of bus services based on Bus Service No or Bus IDs. It is only possible to query location services by single bus stops(using BusStopCode). As such, it is not possible to query buses per Service No without querying for each bus stop. This repository contains code that attempts to solve this issue.

# Features
- "Waits" at first stop of bus service route for a new bus to arrive
- Tracks each operating bus to their next stop
- Fetches all stops on a given route, only performed on load currently
- Pings BusArrivalv2 API on a configurable timely basis for 3 different purposes listed above
- Events of different changes in code is broadcasted through the events property, which is an EventEmitter.
- To use for any buses services in Singapore, save busstop information using the script at scripts/bus_route_stops_coordinates.py
# Scripts
- bus_route_stops_coordinates.js fetches bus stop information from Datamall BusStops and BusRoutes API, produces a csv file of bus stop details for a given service
- bus_route_line_coordinates.py fetches coordinate information of bus route from OneMap getOneBusRoute API, also merges them into a single coordinate.

# Prerequisite before use
  1. Generate busstops information using given script
  2. Copy sample_config.js and rename it to config.js
  2. Specify directory that the data is located in, under config.js
  3. Specify other options for config.js, including AccountKey for LTA Datamall API

# Usage
```
var BusArrival = require("./public")
//config is options for the instance, follow sample_config.js
//eventEmitter has to be a child of NodeJS events.EventEmitter, if not provided, will be intialized to events.EventEmitter
var bus = new BusArrival({config}, eventEmitter)
//listen to events on bus.events
bus.events.on("added_buses", function(buses){
    console.log("Buses to be added", buses);
})
```
# Events

|Event | When is event broadcasted |
|------|-------------|
|added_buses| New bus on route|
|updated_buses| Bus location is updated|
|first_stop|Triggered by cron, query first stop status for new bus|
|next_stop|Triggered by cron, query next stop status for all current buses|
|current_stops|Triggered by cron, query all bus stops, will trigger clear_current|

# Disclaimer
As the accuracy of the data aggregrated is dependent on the Datamall API, the accuracy of the data presented may be affected by the accuracy of the data given.
