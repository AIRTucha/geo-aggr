import { RawSample } from './DataInjection'
import { SampleWithKarma } from './SampleStorage'

export interface SourceStorage {
    getSamples(sourceId: string): SampleWithKarma[]
    getKarma(sourceId: string): number
    /**
     * @returns [sd, mean]
     */
    getKarmaStat(): [number, number]
    getLastTime(sourceId: string): number
    addSample(sample: SampleWithKarma): void
    removeSample(samples: SampleWithKarma[]): void
    updateKarma(sourceId: string, karmaDelta: number): void
}
