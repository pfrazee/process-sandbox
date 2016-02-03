console.log('ping script active')
exports.ping = function (v, cb) {
  cb(null, 'pong '+v)
}