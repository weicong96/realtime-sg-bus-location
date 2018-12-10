const AWS = require("aws-sdk");
AWS.config.update({region : "ap-southeast-1"})
const time = require("./lib/time")
const _ = require("lodash")
function writeItem(items) {
  if(!items || items.length == 0){
    return;
  }
  var awsClient = new AWS.DynamoDB.DocumentClient()
  awsClient.batchWrite({
    RequestItems: {
      "shuttlebusdata": _.map(items, (item)=>{
        return {
          PutRequest:{
            Item: item
          }
        }
      })
    }
  }, (err)=>{
    if(err)
      console.log(err)
  })
}
module.exports = {
  write: (items)=>{
    items = _.uniqBy(items, (item)=> item['bus_id'])
    items = items.map(function (item) {
      var expiry = time.moment()
      expiry.add(30, "seconds")
      return {
        route_id : item['ServiceNo'],
        bus_id: item['bus_id'],
        lat: item['Latitude'],
        lon: item['Longitude'],
        last_updated : time.now(),
        expiry: expiry.unix(),
        time_arrive: time.parseFormat(item['EstimatedArrival'],"YYYY-MM-DDThh:mm:ss Z ZZ").unix(),
        time_arrive_words: item['EstimatedArrival'],
        stop_index: item['StopIndex'],
        bus_stop_code: item['BusStopCode']
      }
    })
    var grouped = _.chunk(items, 25)
    writeItem.apply(null, grouped)
  }
}
