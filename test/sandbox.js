var tape           = require('tape')
var pathlib        = require('path')
var processSandbox = require('../')

const EXEC_MANIFEST = {
  exec: 'async'
}

tape('sandbox - loads target script, and establishes IPC', t => {
  var ps = processSandbox()
  var ping = ps.spawn({ path: pathlib.join(__dirname, 'scripts/sandbox-test.js'), manifest: EXEC_MANIFEST })
  ping.ipcApi.exec((err, res) => {
    if (err) throw err
    t.ok(res)
    ps.killAll()
    t.end()
  })
})