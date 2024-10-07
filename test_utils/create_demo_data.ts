import ws from 'ws'
import { deserialize, serialize } from 'bson'
import fs from 'fs'
import { GeoPoint } from '../src/core/models'
console.log('Start client')
const client = new ws('ws://localhost:9090')

const coordsDeltaSmall = 0.0004

const distTable = [
    { el: 1, freq: 0.1 },
    { el: 2, freq: 0.1 },
    { el: 3, freq: 0.1 },
    { el: 4, freq: 0.1 },
    { el: 5, freq: 0.1 },
]

function getDistTable(score: number) {
    const table = distTable.slice()
    table[score] = { el: score, freq: 0.6 }
    return table
}

function genRandom(score: number): number {
    const maxRange = 100
    const table = getDistTable(score)

    const el = Math.floor(Math.random() * maxRange)

    let rangeStart = 0

    const ret = table.find((val) => {
        const start = rangeStart
        const end = rangeStart + Math.floor(maxRange * val.freq)

        if (start < el && el <= end) {
            return true
        }

        rangeStart = end
        return false
    })

    return ret ? ret.el : 1
}

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

const randomIds = 99999

function normalize1to5(val: (GeoPoint & { risk: number })[]) {
    const risks = val.map(v => v.risk)
    const max = Math.max(...risks)
    return val.map(v => ({ ...v, risk: v.risk < 5 ? v.risk : 5 }))
}
const newData: unknown[] = []

function randId() {
    return (randomIds * Math.random()).toFixed()
}

function moveLocation(location: number) {
    return location + coordsDeltaSmall * Math.random() * (Math.random() > 0.5 ? -1 : 1)
}


client.on('message', (data: Buffer) => {
    console.log('get msg')
    const vals = normalize1to5(Object.values(deserialize(data)))

    for (const val of vals) {
        const numberOfSamples = Math.floor(Math.random() * 15)
        for (let i = 0; i < numberOfSamples; i++) {
            newData.push({
                id: randId(),
                lat: moveLocation(val.lat),
                lng: moveLocation(val.lng),
                risk: val.risk //genRandom(val.risk)
            })
        }
    }
    fs.writeFileSync('data.json', `{"data": ${JSON.stringify(newData)}}`)
    console.log('file ready')
})
