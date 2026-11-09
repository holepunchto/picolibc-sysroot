require.asset = require('require-asset')

// Resolving the directory marks the whole package, which is the sysroot, as an
// asset.
module.exports = require.asset('./', __filename)
