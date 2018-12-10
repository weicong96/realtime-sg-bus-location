const _ = require("lodash")
module.exports = function (path, buses) {
  return _.reduce(buses, (preValue, bus)=>{
    var data = require("../lib/reader")(path.replace("[bus]",bus))
    preValue[bus] = data

    return preValue
  }, {})
}
