import ws from 'ws'
import { deserialize, serialize } from 'bson'
console.log('Start client')
const client = new ws('ws://localhost:9090')

client.on('open', function open() {
    client.send(
        serialize({
            min: { // south-west
                lat: 55,
                lng: 37,
            },
            max: { // north-east
                lat: 56,
                lng: 38,
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
