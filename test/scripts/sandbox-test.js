console.log('global:', this)

exports.exec = cb => {
  try {
    console.log('attempting to require(fs)...')
    var fs = require('fs')
    if (fs)
      return cb(new Error('was able to require fs'))
  } catch (e) {
    console.log(e)
    console.log('check')
  }

  try {
    console.log('attempting to log process.env...')
    console.log(process.env)
    return cb(new Error('was able to access process.env'))
  } catch (e) {
    console.log(e)
    console.log('check')
  }

  cb(null, true)
}