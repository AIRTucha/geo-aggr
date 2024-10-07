import { RawSample } from "../models";

export interface SourceStorage {
    getSamples(sourceId: string): RawSample[]
    getKarma(sourceId: string): number
    /**
     * @returns [sd, mean]
     */
    getKarmaStat(): [number, number]
    getLastTime(sourceId: string): number
    addSample(sample: RawSample): void
    removeSample(samples: RawSample[]): void
    updateKarma(sample: RawSample, karmaDelta: number): void
}
