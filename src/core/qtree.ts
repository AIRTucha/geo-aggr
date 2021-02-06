import { GeoPoint } from "./apis/DataInjection";

const MIN_BRANCH_SIZE = 100
const MIN_BRANCH_AREA = MIN_BRANCH_SIZE * MIN_BRANCH_SIZE

export type QPoint<T> = GeoPoint & { value: T }

export function qpoint<T>(lat: number, long: number, data: T) {
    return { lat, long, data }
}

export type BoundingBox = {
    readonly latMin: number
    readonly latMax: number
    readonly longMin: number
    readonly longMax: number
}

function boundingBox(
    latMin: number,
    latMax: number,
    longMin: number,
    longMax: number,
) {
    return {
        latMin,
        latMax,
        longMin,
        longMax,
    }
}

function isInRange(val: number, min: number, max: number) {
    return val >= min && val <= max
}

// function segmentIntersection(min1: number, max1: number, min2: number, max2: number) {
//     return min1 <= max2 && max1 >= min2
// }

// function intersectsBoundingBoxes(this: BoundingBox, that: BoundingBox) {
//     return (
//         segmentIntersection(this.latMin, this.latMax, that.latMin, that.latMax) &&
//         segmentIntersection(this.longMin, this.longMax, that.longMin, that.longMax)
//     )
// }

export interface QTree<T> {
    filter(predicate: (point: QPoint<T>) => boolean): QuadTree<T>
    getQuads(): QPoint<T>[][]
    insert(point: QPoint<T>): boolean
}

abstract class QuadTree<T> {
    constructor(protected readonly boundary: BoundingBox) { }
    isPointInBoundary<T>(point: QPoint<T>) {
        const boundary = this.boundary
        const containsX = isInRange(point.lat, boundary.latMin, boundary.latMax)
        const containsY = isInRange(point.long, boundary.longMin, boundary.longMax)

        return containsX && containsY
    }

    abstract insert(point: QPoint<T>): boolean
    filter(predicate: (point: QPoint<T>) => boolean): QuadTree<T> {
        const filteredPoints = this.doFilter(predicate)
        if (filteredPoints) {
            return filteredPoints
        } else {
            return new QuadBranch(this.boundary)
        }
    }
    abstract getQuads(): QPoint<T>[][]
    abstract doFilter(predicate: (point: QPoint<T>) => boolean): QuadTree<T> | undefined
}

type Branches<T> = {
    readonly northWest: T,
    readonly northEast: T,
    readonly southWest: T,
    readonly southEast: T,
}

function branchList<T>(branches?: Branches<T>): T[] {
    return branches ?
        [
            branches.northWest,
            branches.northEast,
            branches.southWest,
            branches.southEast,
        ]
        :
        []
}

function getQuads<T>(tree: QuadTree<T>) {
    return tree.getQuads()
}

function isNotEmptyArray(arr: Array<unknown>) {
    return arr.length !== 0
}

class QuadBranch<T> extends QuadTree<T>{
    constructor(
        boundary: BoundingBox,
        private branches?: Branches<QuadTree<T>>
    ) {
        super(boundary)
    }

    insert(point: QPoint<T>): boolean {
        if (this.isPointInBoundary(point)) {
            const branches = this.initBranches()

            const northWest = branches.northWest.insert(point)
            if (northWest) {
                return true
            }

            const northEast = branches.northEast.insert(point)
            if (northEast) {
                return true
            }

            const southWest = branches.southWest.insert(point)
            if (southWest) {
                return true
            }

            const southEast = branches.southEast.insert(point)
            if (southEast) {
                return true
            }
            return false
        } else {
            return false
        }
    }

    doFilter(predicate: (point: QPoint<T>) => boolean): QuadTree<T> | undefined {
        return this.branches ?
            new QuadBranch(
                this.boundary,
                {
                    northWest: this.branches.northWest.filter(predicate),
                    northEast: this.branches.northEast.filter(predicate),
                    southWest: this.branches.southWest.filter(predicate),
                    southEast: this.branches.southEast.filter(predicate),
                }
            )
            :
            new QuadBranch(this.boundary)
    }

    getQuads(): QPoint<T>[][] {
        return branchList(this.branches)
            .map(getQuads)
            .flat()
            .filter(isNotEmptyArray)
    }

    private initBranches() {
        if (!this.branches) {
            const { latMin, latMax, longMin, longMax } = this.boundary
            const latMid = midPoint(latMin, latMax)
            const longMid = midPoint(longMin, longMax)
            const QuadContractor: new (boundary: BoundingBox) => QuadTree<T> = isSmallestBranch(this.boundary) ? Quad : QuadBranch
            this.branches = {
                northWest: new QuadContractor(boundingBox(latMin, latMid, longMin, longMid)),
                northEast: new QuadContractor(boundingBox(latMid, latMax, longMin, longMid)),
                southWest: new QuadContractor(boundingBox(latMin, latMid, longMid, longMax)),
                southEast: new QuadContractor(boundingBox(latMid, latMax, longMid, longMax)),
            }
        }

        return this.branches
    }
}

function midPoint(min: number, max: number) {
    return (max + min) / 2.0;
}

class Quad<T> extends QuadTree<T> {
    constructor(boundary: BoundingBox, private readonly points: QPoint<T>[] = []) {
        super(boundary)
    }

    insert(point: QPoint<T>): boolean {
        if (this.isPointInBoundary(point)) {
            this.points.push(point)
            return true
        } else {
            return false
        }
    }
    doFilter(predicate: (point: QPoint<T>) => boolean): QuadTree<T> | undefined {
        const filteredPoints = this.points.filter(predicate)
        if (filteredPoints) {
            return new Quad(this.boundary, filteredPoints)
        } else {
            return undefined
        }
    }
    getQuads(): QPoint<T>[][] {
        return [this.points]
    }
}

export function geoDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6378.137
    const dLat = lat2 * Math.PI / 180 - lat1 * Math.PI / 180
    const dLon = lon2 * Math.PI / 180 - lon1 * Math.PI / 180
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    const d = R * c;
    return d * 1000;
}

function isSmallestBranch(boundary: BoundingBox) {
    const lat = geoDistance(boundary.latMin, boundary.longMin, boundary.latMin, boundary.longMax)
    const long = geoDistance(boundary.latMin, boundary.longMin, boundary.latMax, boundary.longMin)
    return lat * long < MIN_BRANCH_AREA
}

export default function <T>(): QTree<T> {
    return new QuadBranch(
        boundingBox(0, 90, 0, 180)
    )
}

