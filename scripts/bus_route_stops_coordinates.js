/*
  Generates bus stop data for the specified routes of data
*/
const axios = require("axios");
const _ = require("lodash");
const fs = require("fs");
const Promise = require("bluebird")
const ArgumentParser = require("argparse").ArgumentParser

function getBusStopInRoute(AccountKey, page, type){
  return axios({
    method: "GET",
    headers: {
      "AccountKey" : "/GuJf570QNi0wcgxT6/0Jw=="
    },
    url : "http://datamall2.mytransport.sg/ltaodataservice/"+type+"?$skip="+(page*500)
  }).then((response)=>{
    console.log(response.data.value.length, type ," page ", page)

    if(response.data['value'].length != 500){
      return response.data['value']
    }else{
      return getBusStopInRoute(AccountKey, page+1, type).then((nextResponse)=>{
        return _.concat(nextResponse, response.data['value'])
      })
    }
  })
}
function saveAsCsv(array, fileName){
  if(!array && array.length == 0){
    return;
  }
  var text = "";
  text = text + Object.keys(array[0]).join(",")+"\n";
  _.forEach(array, (item)=>{
    text = text + _.values(item).join(",")+"\n";
  })
  fs.writeFileSync(fileName, text);
}
var parse = new ArgumentParser({
  version: '0.0.1',
  addHelp:true,
  description: 'Argparse example'
})
parse.addArgument(['buses'], {
  help: "Buses to get data for, known as ServiceNo on Datamall API, comma seperated"
})
parse.addArgument(['accountKey'], {
  help: "Specify account key LTA Datamall API"
})
parse.addArgument(['--folder'], {
  help: "Directory to save generated csv files to, if not specified defaults to same directory",
  argumentDefault: "./",
  defaultValue: "./"
})
var args = parse.parseArgs()
var buses = args.buses.split(",")
Promise.all([
  getBusStopInRoute(args.accountKey, 0, "BusRoutes"),
  getBusStopInRoute(args.accountKey, 0, "BusStops")
]).then(function (result) {
  var stops = result[0];
  var namedStops = result[1];

  console.log("Total number of bus stops in Singapore is ",stops.length)
  console.log("Filtering now:")
  var busStops = _.filter(stops, (stop)=>{
    return buses.indexOf(stop['ServiceNo']) != -1
  })
  busStops = _.groupBy(busStops, (stops) => stops['ServiceNo'])
  _.forEach(busStops, (stops, bus)=>{
    console.log("bus ",bus," has ", stops.length)
    console.log("saving ",stops.length, " stops into ", args.folder+"/"+bus+".csv")

    stops = _.map(stops,(stop, index)=>{
      stop['StopIndex'] = index

      //stop details
      var namedStop = _.find(namedStops, (nStop)=>{
        return stop['BusStopCode'] == nStop['BusStopCode']
      })
      stop['RoadName'] = namedStop['RoadName']
      stop['Description'] = namedStop['Description']
      stop['Latitude'] = namedStop['Latitude']
      stop['Longitude'] = namedStop['Longitude']

      return stop
    })
    saveAsCsv(stops, args.folder+"/"+bus+".csv");
  })
})
