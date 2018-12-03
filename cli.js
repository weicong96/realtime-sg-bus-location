var PublicBus = require("./public")
var bus = new PublicBus(require("./config"), require("./lib/event")())
bus.currentBusesQuery({event: "current_buses"})
