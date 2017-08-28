var mqtt = require('mqtt')
var moment = require('moment');

var client  = mqtt.connect({ host: 'localhost', port: 1883 })
 
 client.on('connect', function () {
  client.subscribe("alpha2/test")
})
 
client.on('message', function (topic, message) {
  // message is Buffer 
  console.log(message.toString())
  //client.end()
})