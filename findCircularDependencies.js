const madge = require('madge');

module.exports = function findCircularDependencies(path) {
    return madge(path).then((res) => res.circular());
}