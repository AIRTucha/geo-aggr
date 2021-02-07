import ws from 'ws'
import { deserialize, serialize } from 'bson'
console.log('Start client')
const client = new ws('ws://localhost:9090')

client.on('open', function open() {
    client.send(
        serialize({
            min: { // south-west
                lat: 50,
                lng: 30,
            },
            max: { // north-east
                lat: 60,
                lng: 40,
            }
        })
    )
})
client.on('message', (data: Buffer) => {
    const vals = deserialize(data)
    console.log('New msg')
    Object.keys(vals).forEach(key => {
        console.log('risk:', vals[key].risk)
    })
})