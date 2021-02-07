import { GeoPoint } from '../../core/apis/DataInjection'
import { geoDistance } from '../../utils'

export type QPoint<T> = GeoPoint & T

export type Quad<T> = {
    readonly points: QPoint<T>[]
} & GeoPoint

export function flatten<T>(quads: Quad<T>[]) {
    return quads.map(q => q.points).flat()
}

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

export interface QTree<T> {
    partition(predicate: (point: QPoint<T>) => boolean): [QuadTree<T>, QuadTree<T>]
    getQuads(): Quad<T>[]
    insert(point: QPoint<T>): boolean
}

abstract class QuadTree<T> implements QTree<T>{
    constructor(protected readonly boundary: BoundingBox, protected readonly minBranchArea: number) { }
    isPointInBoundary<T>(point: QPoint<T>) {
        const boundary = this.boundary
        const containsX = isInRange(point.lat, boundary.latMin, boundary.latMax)
        const containsY = isInRange(point.lng, boundary.longMin, boundary.longMax)

        return containsX && containsY
    }

    abstract insert(point: QPoint<T>): boolean
    partition(predicate: (point: QPoint<T>) => boolean): [QuadTree<T>, QuadTree<T>] {
        const [left, removed] = this.doPartition(predicate)
        return [
            left ?? new QuadBranch(this.boundary, this.minBranchArea),
            removed ?? new QuadBranch(this.boundary, this.minBranchArea)
        ]
    }
    abstract getQuads(): Quad<T>[]
    abstract doPartition(predicate: (point: QPoint<T>) => boolean): [QuadTree<T> | undefined, QuadTree<T> | undefined]
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

function isNotEmptyArray<T>(arr: Quad<T>) {
    return arr.points.length !== 0
}

class QuadBranch<T> extends QuadTree<T>{
    constructor(
        boundary: BoundingBox,
        minBranchArea: number,
        private branches?: Branches<QuadTree<T>>
    ) {
        super(boundary, minBranchArea)
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

    doPartition(predicate: (point: QPoint<T>) => boolean): [QuadTree<T>, QuadTree<T>] {
        if (this.branches) {
            const [leftNorthWest, removedNorthWest] = this.branches.northWest.partition(predicate)
            const [leftNorthEast, removedNorthEast] = this.branches.northEast.partition(predicate)
            const [leftSouthWest, removedSouthWest] = this.branches.southWest.partition(predicate)
            const [leftSouthEast, removedSouthEast] = this.branches.southEast.partition(predicate)
            return [
                new QuadBranch(
                    this.boundary,
                    this.minBranchArea,
                    {
                        northWest: leftNorthWest,
                        northEast: leftNorthEast,
                        southWest: leftSouthWest,
                        southEast: leftSouthEast,
                    }
                ),
                new QuadBranch(
                    this.boundary,
                    this.minBranchArea,
                    {
                        northWest: removedNorthWest,
                        northEast: removedNorthEast,
                        southWest: removedSouthWest,
                        southEast: removedSouthEast,
                    }
                )
            ]
        } else {
            return [
                new QuadBranch(this.boundary, this.minBranchArea),
                new QuadBranch(this.boundary, this.minBranchArea)
            ]
        }
    }

    getQuads(): Quad<T>[] {
        return branchList(this.branches)
            .flatMap(getQuads)
            .filter(isNotEmptyArray)
    }

    private initBranches() {
        if (!this.branches) {
            const { latMin, latMax, longMin, longMax } = this.boundary
            const latMid = midPoint(latMin, latMax)
            const longMid = midPoint(longMin, longMax)
            const QuadContractor: new (
                boundary: BoundingBox, minBranchArea: number
            ) => QuadTree<T> = isSmallestBranch(this.minBranchArea, this.boundary) ? QuadLeaf : QuadBranch
            this.branches = {
                northWest: new QuadContractor(boundingBox(latMin, latMid, longMin, longMid), this.minBranchArea),
                northEast: new QuadContractor(boundingBox(latMid, latMax, longMin, longMid), this.minBranchArea),
                southWest: new QuadContractor(boundingBox(latMin, latMid, longMid, longMax), this.minBranchArea),
                southEast: new QuadContractor(boundingBox(latMid, latMax, longMid, longMax), this.minBranchArea),
            }
        }

        return this.branches
    }
}

function midPoint(min: number, max: number) {
    return (max + min) / 2.0
}

function partition<T>(array: Array<T>, predicate: (val: T) => boolean): [Array<T>, Array<T>] {
    const left = []
    const removed = []
    for (const val of array) {
        if (predicate(val)) {
            left.push(val)
        } else {
            removed.push(val)
        }
    }
    return [
        left,
        removed
    ]
}

class QuadLeaf<T> extends QuadTree<T> {
    constructor(
        boundary: BoundingBox,
        minBranchArea: number,
        private readonly points: QPoint<T>[] = []) {
        super(boundary, minBranchArea)
    }

    insert(point: QPoint<T>): boolean {
        if (this.isPointInBoundary(point)) {
            this.points.push(point)
            return true
        } else {
            return false
        }
    }
    doPartition(predicate: (point: QPoint<T>) => boolean): [QuadTree<T>, QuadTree<T>] {
        const [leftPoints, removedPoints] = partition(this.points, predicate)
        return [
            new QuadLeaf(this.boundary, this.minBranchArea, leftPoints),
            new QuadLeaf(this.boundary, this.minBranchArea, removedPoints)
        ]
    }
    getQuads(): Quad<T>[] {
        const boundary = this.boundary
        return [{
            points: this.points,
            lat: midPoint(boundary.latMin, boundary.latMax),
            lng: midPoint(boundary.longMin, boundary.longMax)
        }]
    }
}

function isSmallestBranch(minBranchArea: number, boundary: BoundingBox) {
    const lat = geoDistance(boundary.latMin, boundary.longMin, boundary.latMin, boundary.longMax)
    const long = geoDistance(boundary.latMin, boundary.longMin, boundary.latMax, boundary.longMin)
    return lat * long < minBranchArea
}

export default function <T>(min_branch_size = 100): QTree<T> {
    return new QuadBranch(
        boundingBox(0, 90, 0, 180),
        min_branch_size * min_branch_size
    )
}
