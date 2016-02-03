# Process Sandbox

Run javascript in sandboxed child processes.

```js
var path = require('path')
var processSandbox = require('process-sandbox')

// create a manager
var ps = processSandbox()

// spawn a script
var scriptPath = path.join(__dirname, 'ping.js')
var scriptApiManifest = { // muxrpc manifest
  ping: 'async'
}
var pingProcess = ps.spawn(scriptPath, scriptApiManifest)

// communicate with the script
pingProcess.ipcApi.ping('foo', (err, res) => {
  console.log(res) // 'pong foo'

  // kill the script
  ps.kill(pingProcess)

  // or kill all scripts
  ps.killAll()
})
```

`ping.js`

```js
console.log('ping script active')
exports.ping = function (v, cb) {
  cb(null, 'pong '+v)
}
```