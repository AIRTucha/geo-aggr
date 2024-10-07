export type GeoPoint = {
    lat: number
    lng: number
}

export type RawSample = GeoPoint & {
    risk: number
    date: number
    sourceId: string
    id: string
}

export type EvaluationResult = GeoPoint & {
    risk: number
}

export type SampleWithKarma = RawSample & { karma: number }

export type DBPoint = {
    id: string,
    user_id: string,
    lat: number,
    lng: number,
    rating: number,
    created: Date
}
