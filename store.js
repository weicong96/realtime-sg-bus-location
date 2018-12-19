const AWS = require("aws-sdk");
AWS.config.update({region : "us-east-1"})
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
    var grouped = _.chunk(items, 25)
    writeItem.apply(null, grouped)
  }
}
