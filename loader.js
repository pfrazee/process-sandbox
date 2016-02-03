/*****
Child process loader script.

This file is loaded first by `process-sandbox` into a new child process.
It creates the VM environment and reads the target source into it.
*****/

var vm = require('vm')
var fs = require('fs')
var pathlib = require('path')
var muxrpc = require('muxrpc')
var pull = require('pull-stream')
var ipcApiStream = require('./ipc-api-stream')

//
// 1. read config and inputs
//

const SCRIPT_PATH         = process.env.script_path
const ENV_IPC_MANIFEST    = readObjFromEnvVars('env_manifest')
const CHILD_IPC_MANIFEST  = readObjFromEnvVars('script_manifest')

// read script
var script = fs.readFileSync(SCRIPT_PATH, 'utf-8')
if (!script || typeof script !== 'string')
  throw "Failed to read script"

// create module object for the plugin to export with
var vmModule = { exports: {} }

//
// 2. estalish IPC
//

// setup RPC channel with parent process
var ipcStream = ipcApiStream(process, function(err) { console.error(err); throw 'parent-process ipc stream was killed' })
var ipcApi = muxrpc(ENV_IPC_MANIFEST, CHILD_IPC_MANIFEST, msg => msg)(vmModule.exports) // note, we route the requests to the VM's module.exports
pull(ipcStream, ipcApi.createStream(), ipcStream)

//
// 3. launch VM
//

// the context controls what objects will be available to the sandbox
// populate it with (safe!) APIs
var contextDesc = {
  // module, exports - commonjs objects
  // we expose the methods on module.exports to the parent environment using muxrpc
  // (see "2. establish IPC")
  module: vmModule,
  exports: vmModule.exports,

  // prepend the script's path to its stdout 
  console: {
    // TODO - add more console methods?
    log: console.log.bind(console, SCRIPT_PATH, '-'),
    info: console.info.bind(console, SCRIPT_PATH, '-'),
    warn: console.warn.bind(console, SCRIPT_PATH, '-'),
    error: console.error.bind(console, SCRIPT_PATH, '-')
  }
}
// mix in methods exposed by the parent environment via IPC
for (var k in ENV_IPC_MANIFEST)
  contextDesc[k] = ipcApi[k]

// launch vm
var vmInstance = vm.runInContext(script, vm.createContext(contextDesc))

//
// n. helpers
//

function readObjFromEnvVars (key) {
  try { return JSON.parse(process.env[key]) }
  catch (e) { return {} }
}