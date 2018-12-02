const cron = require("node-cron");
module.exports = (eventEmitter, eventName, crontext)=>{
    //set events up
    cron.schedule(crontext, ()=>{
      eventEmitter.emit(eventName, {
        time: Date.now(),
        event: eventName
      })
    })
}
