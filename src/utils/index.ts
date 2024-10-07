import { map } from 'rxjs/operators'
import { GeoPoint } from '../core/models'

export function geoDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6378.137
    const dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180
    const dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c
    return d * 1000
}

export function samplesDistance(p1: GeoPoint, p2: GeoPoint) {
    return geoDistance(p1.lat, p1.lng, p2.lat, p2.lng)
}

export function FlowLogger(tag: string) {
    return <T>(msg: string, printData?: (val: T) => string) => {
        return map((val: T) => {
            console.log([`${new Date().toUTCString()} [${tag}] ${msg}`, printData?.(val)].join(' '))
            return val
        })
    }
}

export function Logger(tag: string) {
    return (...rest: unknown[]) => {
        console.log(`${new Date().toUTCString()} [${tag}]`, ...rest)
    }
}

export function sampleID(sourceId: string, lat: number, lng: number) {
    return `${sourceId}-${lat.toFixed(4)}/${lng.toFixed(4)}`
}

export function min(nums: number[]) {
    let min = NaN
    for (const num of nums) {
        min = min < num ? min : num
    }
    return min
}

export function max(nums: number[]) {
    let max = NaN
    for (const num of nums) {
        max = max > num ? max : num
    }
    return max
}
