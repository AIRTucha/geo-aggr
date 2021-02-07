import { injectable } from 'inversify'
import 'reflect-metadata'
import { SampleWithKarma } from '../../core/apis/SampleStorage'
import { SourceStorage } from '../../core/apis/SourceStorage'
import { mean, stdev } from 'stats-lite'

type SampleSource = {
    karma: number
    activeSamples: Set<SampleWithKarma>
}

@injectable()
export class LocalSourceStorage implements SourceStorage {
    private readonly sources = new Map<string, SampleSource>()
    getSamples(sourceId: string): SampleWithKarma[] {
        return Array.from(
            this.sources
                .get(sourceId)
                ?.activeSamples
                .values() ?? []
        )
    }
    getKarma(sourceId: string): number {
        return this.sources.get(sourceId)?.karma ?? 0
    }
    getKarmaStat(): [number, number] {
        const karmas = Array
            .from(this.sources.values())
            .map(source => source.karma)
        return [stdev(karmas), mean(karmas)]
    }
    getLastTime(sourceId: string): number {
        return this
            .getSamples(sourceId)
            .reduce(
                (max, sample) => max > sample.date ? max : sample.date,
                0
            )
    }
    addSample(sample: SampleWithKarma): void {
        const source = this.sources.get(sample.id)
        if (source) {
            this.updateSource(source, sample)
        } else {
            this.createSource(sample)
        }
    }
    private updateSource(source: SampleSource, sample: SampleWithKarma) {
        source.activeSamples.add(sample)
    }
    private createSource(sample: SampleWithKarma) {
        this.sources.set(
            sample.id,
            {
                karma: 0,
                activeSamples: new Set([sample])
            }
        )
    }
    removeSample(samples: SampleWithKarma[]): void {
        samples.forEach(sample => {
            this.sources
                .get(sample.id)
                ?.activeSamples
                ?.delete(sample)
        })
    }
    updateKarma(sourceId: string, karmaDelta: number): void {
        const source = this.sources.get(sourceId)
        if (source) {
            source.karma += karmaDelta
        }
    }
}