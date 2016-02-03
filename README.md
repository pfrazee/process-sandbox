# Process Sandbox

Run javascript in sandboxed child processes.

**Basic Usage**

`parent.js`

```js
var path = require('path')
var processSandbox = require('process-sandbox')

// create a manager
var ps = processSandbox()

// spawn a script
var pingProcess = ps.spawn({
  path: path.join(__dirname, 'ping.js'), // script to execute
  manifest: { ping: 'async' } // muxrpc manifest for the target script
})

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

**Adding Methods to the Sandbox**

`parent.js`

```js
var helloProcess = ps.spawn({
  path: path.join(__dirname, 'hello.js'), // script to execute
  env: {
    manifest: { whoami: 'async' }, // muxrpc manifest for the environment
    api: { whoami: cb => cb(null, 'Bob') } // api for the environment
  }
})
```

`hello.js`

```js
whoami((err, name) => {
  console.log('Hello, world. I am', name)
})
```

## Sandbox

## IPC

The parent and child processes communicate using [muxrpc](npm.im/muxrpc) over STDIO.

From the parent, the child API is available via `childProcessObj.ipcApi.*`.
From the child, the parent API is mixed into the global object.

