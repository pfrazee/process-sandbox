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

`spawn()` creates a child process, and then uses the [node vm api](https://nodejs.org/api/vm.html) to create a context without access to any of the node APIs.

The context is configured in [loader.js](./loader.js).
In addition to same basic methods (like `console` functions) the context will include the methods supplied in the `env` options of `spawn()`.

**Possible avenues for improvement:**

If some JS were ever able to break its VM context, within its own process or another (via IPC), it would have the same rights as the compromised process.
We might mitigate this at the OS-level, using the same techniques that browsers use.

From https://chromium.googlesource.com/chromium/src/+/master/docs/linux_sandboxing.md:

 - Linux: `setuid()` and `setgid()`
 - Linux: [seccomp](https://wiki.mozilla.org/Security/Sandbox/Seccomp)

## IPC

The parent and child processes communicate using [muxrpc](npm.im/muxrpc) over STDIO.

From the parent, the child API is available via `childProcessObj.ipcApi.*`.
From the child, the parent API is mixed into the global object.

