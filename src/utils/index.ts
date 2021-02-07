import { map } from 'rxjs/operators'
import { GeoPoint } from '../core/apis/DataInjection'
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

export function log(tag: string) {
    return map(<T>(val: T) => {
        console.log(`[${tag}]`)
        return val
    })
}