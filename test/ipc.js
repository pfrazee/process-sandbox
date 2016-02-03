var tape           = require('tape')
var pathlib        = require('path')
var processSandbox = require('../')

const PING_MANIFEST = {
  ping: 'async'
}
const HELLO_MANIFEST = {
  sayHello: 'async'
}

tape('child ipc api works', t => {
  var ps = processSandbox()
  var ping = ps.spawn({ path: pathlib.join(__dirname, 'scripts/ping.js'), manifest: PING_MANIFEST })
  ping.ipcApi.ping('foo', (err, res) => {
    if (err) throw err
    t.equal(res, 'pong foo')
    ps.killAll()  
    t.end()
  })
})

tape('env ipc api works', t=>{
  var wasCalled = false

  var ps = processSandbox()
  var ping = ps.spawn({
    path: pathlib.join(__dirname, 'scripts/hello.js'),
    manifest: HELLO_MANIFEST,
    env: {
      manifest: { whoami: 'async' },
      api: {
        whoami: cb => {
          wasCalled = true
          cb(null, 'Bob')
        }
      }
    }
  })
  ping.ipcApi.sayHello((err, res) => {
    if (err) throw err
    t.equal(res, 'Hello, world. I am Bob')
    t.ok(wasCalled)
    ps.killAll()  
    t.end()
  })
})