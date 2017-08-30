var mqtt = require('mqtt')
var moment = require('moment');
var async = require('async');
const os = require('os')
const express = require('express')

const app = express()

const http = require('http')

const Influx = require('influx');
const influx = new Influx.InfluxDB({
    host: 'localhost',
    database: 'express_response_db',
    schema: [
        {
            measurement: 'presence',
            fields: {
                beacons: Influx.FieldType.STRING,
                gpstime: Influx.FieldType.STRING,
                lat: Influx.FieldType.STRING,
                lng: Influx.FieldType.STRING,
            },
            tags: [
                'host'
            ]
        },
        {
            measurement: 'test',
            fields: {
                beacons: Influx.FieldType.STRING,
                gpstime: Influx.FieldType.STRING,
                lat: Influx.FieldType.STRING,
                lng: Influx.FieldType.STRING,
            },
            tags: [
                'host'
            ]
        }

    ]
})






async.waterfall([
    setServer,
    mqttFlow
], function (error) {
    if (error) {
        //handle readFile error or processFile error here
    }
});


function setServer(callback) {

    influx.getDatabaseNames()
        .then(names => {
            if (!names.includes('express_response_db')) {
                return influx.createDatabase('express_response_db');
            }
        })
        .then(() => {
            http.createServer(app).listen(3000, function () {
                console.log('Listening on port 3000')
                callback()
            })
        })
        .catch(err => {
            console.error(`Error creating Influx database!`);
        })


}


function mqttFlow() {

    var client = mqtt.connect({ host: 'localhost', port: 1883 })

    client.on('connect', function () {
        client.subscribe("alpha2/bletest")
    })

    client.on('message', function (topic, message) {
        // message is Buffer 
        console.log("listening to topics")

        var object = JSON.parse(message.toString())



            influx.writePoints([
                {
                    measurement: 'presence',
                    tags: { host: os.hostname() },
                    fields: { beacons: object.ble, gpstime: object.gpstime, lat: object.lat, lng: object.lng },
                }
            ]).catch(err => {
                console.error(`Error saving data to InfluxDB! ${err.stack}`)
            })

        console.log(message.toString())
        //client.end()
    })
}

app.get('/', function (req, res) {
    setTimeout(() => res.end('Hello world!'), Math.random() * 500)
})

app.get('/times', function (req, res) {
    influx.query(`
    select * from presence
    where host = ${Influx.escape.stringLit(os.hostname())}
    order by time desc
    limit 10000
  `).then(result => {
            res.json(result)
        }).catch(err => {
            res.status(500).send(err.stack)
        })
})
