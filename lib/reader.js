const fs = require("fs")
const _ = require("lodash")
function readFile(path) {
  return fs.readFileSync(path).toString()
}

module.exports = function (path) {
  var contents = readFile(path)
  var lines = contents.split("\n");
  var headers = lines[0].split(",");
  lines.shift();
  return _.filter(_.map(lines, (line)=>{
    var fields = line.split(",");
    if(fields.length != 1){
      return _.reduce(fields, (object, field, index)=>{
        field = field.replace(/(\r\n|\n|\r)/gm, "");
        headers[index] = headers[index].replace(/(\r\n|\n|\r)/gm, "")
        object[headers[index]] = field
        return object
      }, {})
    }else{
      return null
    }
  }))
}
