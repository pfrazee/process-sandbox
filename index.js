'use strict'

var childProcess = require('child_process')
var pathlib = require('path')
var muxrpc = require('muxrpc')
var pull = require('pull-stream')
var ipcApiStream = require('./ipc-api-stream')

//
// constants and persistent state
//

const NODE_PATH = process.execPath
const LOADER = pathlib.join(__dirname, 'loader.js')

module.exports = function () {

  var api = {}
  var activeProcesses = api.activeProcesses = []
  var byPath = api.byPath = {}

  //
  // spawn a new sandboxed child
  //
  api.spawn = function (opts) {
    if (!opts || typeof opts !== 'object')
      throw "spawn() requires an object with {path:}"
    var path          = opts.path
    var childManifest = opts.manifest || {}
    var envManifest   = opts.env && opts.env.manifest || {}
    var envAPI        = opts.env && opts.env.api || {}

    // spawn the process
    var childProcessInstance = childProcess.spawn(NODE_PATH, [LOADER], {
      stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
      cwd: pathlib.dirname(path),
      env: {
        script_path: path,
        script_manifest: JSON.stringify(childManifest),
        env_manifest: JSON.stringify(envManifest)
      }
    })
    console.log(path, '- started.')

    // setup ipc api
    var ipcStream = ipcApiStream(childProcessInstance, function() { console.log(path, '- ipc stream closed.') })
    var ipcApi = muxrpc(childManifest, envManifest, msg => msg)(envAPI)

    // add to the registry
    var processDesc = {
      path: path,
      manifest: childManifest,
      process: childProcessInstance,
      ipcStream: ipcStream,
      ipcApi: ipcApi,
      state: { isAlive: true, code: null, signal: null }
    }
    byPath[path] = processDesc
    activeProcesses.push(processDesc)

    // start the api stream
    ipcApi.id = path
    pull(ipcStream, ipcApi.createStream(), ipcStream)

    // watch for process death
    childProcessInstance.on('close', function (code, signal) {
      console.log(path, '- stopped. Code:', code, 'Signal:', signal)

      // record new state
      processDesc.state.isAlive = false
      processDesc.state.code = code
      processDesc.state.signal = signal

      // remove from registries
      delete byPath[path]
      activeProcesses.splice(activeProcesses.indexOf(processDesc), 1)
    })
    return processDesc
  }

  //
  // kill given process
  //
  api.kill = function (processDesc, signal) {
    processDesc.process.kill(signal || 'SIGHUP')
  }

  //
  // stop all child processes
  //
  api.killAll = function (signal) {
    activeProcesses.forEach(processDesc => processDesc.process.kill(signal || 'SIGHUP'))
  }

  return api
}