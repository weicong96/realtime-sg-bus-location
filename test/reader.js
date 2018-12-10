
module.exports = function (file) {
    return JSON.parse(require("fs").readFileSync(file).toString())
}
