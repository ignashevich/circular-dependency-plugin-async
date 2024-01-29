const findCircularDependencies = require('./findCircularDependencies.js');

module.exports = function ({ path, workerId }, callback) {
    findCircularDependencies(path).then((res) => {
        callback(null, { output: res, workerId })
    })
}