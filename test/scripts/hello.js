module.exports.sayHello = cb => {
  whoami((err, name) => {
    cb(null, 'Hello, world. I am ' + name)
  })
}