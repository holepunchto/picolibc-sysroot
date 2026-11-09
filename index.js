module.exports = function sysroot(target) {
  try {
    return require(`picolibc-sysroot-${target}`)
  } catch (err) {
    if (err.code === 'MODULE_NOT_FOUND') {
      throw new Error(`No sysroot found for target '${target}'`)
    } else {
      throw err
    }
  }
}
