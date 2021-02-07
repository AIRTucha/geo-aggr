import ws from 'ws'
import { deserialize, serialize } from 'bson'
console.log('Start client')
const client = new ws('ws://localhost:9090')

client.on('open', function open() {
    client.send(
        serialize({
            min: { // south-west
                lat: 50,
                long: 30,
            },
            max: { // north-east
                lat: 60,
                long: 40,
            }
        })
    );
})
client.on('message', (data: Buffer) => console.log(deserialize(data)))