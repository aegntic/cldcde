if (process.env.COLOR_MODEL_COVERAGE) {
  eval('module.exports = require("./.coverage/lib");');
} else {
  module.exports = require('./lib');
}
