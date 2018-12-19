const fs = require("fs")
const _ = require('lodash')
const turf = require("@turf/turf")
module.exports = (coords, stopsPath) => {
  var point = turf.point(coords)
  var paths = stopsPath.map((route, index) => {
    route = turf.lineString(route)
    //get nearest point to route on line
    var nearest = turf.nearestPointOnLine(route, point,{ units: 'kilometers'})
    delete nearest['properties']['index']
    nearest['properties']['index'] = index
    var returnResult = nearest['properties']
    returnResult['coords'] = nearest['geometry']['coordinates']
    return returnResult
  })
  paths = _.sortBy(paths, (p)=> p['dist'])
  //check if distance is within 2m
  //if not within 1m, throw away line
  paths = _.filter(paths, (p)=> p['dist'] < 0.002)
  paths = paths.slice(0,2)
  paths = _.map(paths, (p)=>{
    p['index'] = p['index'] + 1
    return p
  })
  return paths
}
