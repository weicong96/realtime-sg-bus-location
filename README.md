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

# In Progress
 - Complete test code
 - Add refresh every 5mins for buses to get a clean slate

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
|add_buses & added_buses| New bus on route|
|update_buses & updated_buses| Previous bus has been updated in the journey|
|first_stop|Time to query first stop status for new bus|
|next_stop|Time to query next stop status for all current buses|
|replace_all|When current buses are refreshed but current buses is not empty(not used yet)|
