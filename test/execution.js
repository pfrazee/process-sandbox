var tape           = require('tape')
var pathlib        = require('path')
var processSandbox = require('../')

const PING_MANIFEST = {
  ping: 'async'
}

tape('spawn - loads target script, and establishes IPC', t => {
  var ps = processSandbox()
  var ping = ps.spawn(pathlib.join(__dirname, 'scripts/ping.js'), PING_MANIFEST)
  ping.ipcApi.ping('foo', (err, res) => {
    if (err) throw err
    t.equal(res, 'pong foo')
    ps.killAll()  
    t.end()
  })
})