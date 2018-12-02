var moment = require("moment-timezone")
module.exports = {
  moment:function () {
    return moment()
  },
  now:function () {
    return moment().unix()
  },
  parseFormat:function (time, format) {
    return moment(time,format);
  }
}
