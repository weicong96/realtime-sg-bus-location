var AWS = require('aws-sdk');
const _ = require('lodash')
function getEC2Rolename(AWS, rolename){
   var promise = new Promise((resolve,reject)=>{
     var metadata = new AWS.MetadataService();
     var request = "/latest/meta-data/iam/security-credentials/";
     if(rolename != null){
       request = request + rolename;
     }
     metadata.request(request,function(err,rolename){
         if(err) reject(err);
         resolve(rolename);
     });
   });
   return promise;
}
function handleAuth(){
  return getEC2Rolename(AWS, "ec2-ntu-bus")
  .then((credentials)=>{
    AWS.config.accessKeyId=credentials.AccessKeyId;
    AWS.config.secretAccessKey=credentials.SecretAccessKey;
    AWS.config.sessionToken = credentials.Token;
  })
}
function write(items){
  console.log(items)
  AWS.config.update({region:'ap-southeast-1'});
  (new Promise((resolve, reject)=>{
    handleAuth().then(()=>{
      resolve(items)
    }).catch((error)=>{
      if(!AWS.config.accessKeyId){
        credentials = new AWS.SharedIniFileCredentials()
        AWS.config.credentials = credentials
        resolve(items)
      }
    })
  })).then(function (items) {
    var awsClient = new AWS.DynamoDB.DocumentClient()
    return new Promise(function (resolve, reject) {
      console.log({
        "shuttlebusdata" : _.map(items, (item)=>{
          return{
              PutRequest:{
                Item: item
              }
            }

        })
      })
      awsClient.batchWrite({
          RequestItems:{
            "shuttlebusdata" : _.map(items, (item)=>{
              return{
                  PutRequest:{
                    Item: item
                  }
                }

            })
          }
        }, (err, data)=>{
          if(err) reject(err)
          resolve(err, data)
        })
      })
    })
}

module.exports = function (eventEmitter) {
    eventEmitter.on("new_buses_campus" ,function (new_buses) {
      console.log("new_buses_campus")
      write(new_buses);
    });
    eventEmitter.on("update_buses_public" ,function (new_buses) {
      console.log("update_buses_public")
      write(new_buses);
    });

    eventEmitter.on("add_buses_public" ,function (new_buses) {
      console.log("add_buses_public")
      write(new_buses);
    });
}
